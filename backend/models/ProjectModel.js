// models/ProjectModel.js
const db = require('../config/db');
const { validationResult } = require('express-validator');
const { logEvento } = require('../utils/logEvento');

// Obtener todos los proyectos con filtros
exports.getProjects = async (req, res) => {
  try {
    const { estado, responsable, fechaInicio, fechaFin } = req.query;
    
    let query = `
      SELECT p.*, u.nombre as responsable_nombre, u.email as responsable_email
      FROM Proyectos p
      LEFT JOIN Usuarios u ON p.id_usuario_responsable = u.id
      WHERE 1=1
    `;

    const params = [];

    if (estado) {
      query += ' AND p.estado = ?';
      params.push(estado);
    }

    if (responsable) {
      query += ' AND p.id_usuario_responsable = ?';
      params.push(responsable);
    }

    if (fechaInicio && fechaFin) {
      query += ' AND p.fecha_inicio >= ? AND p.fecha_fin <= ?';
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += ' AND p.fecha_inicio >= ?';
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += ' AND p.fecha_fin <= ?';
      params.push(fechaFin);
    }

    query += ' ORDER BY p.fecha_inicio DESC';

    const [projects] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los proyectos',
      error: error.message
    });
  }
};

// Obtener un proyecto por ID
exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;

    const query = `
      SELECT p.*, u.nombre as responsable_nombre, u.email as responsable_email
      FROM Proyectos p
      LEFT JOIN Usuarios u ON p.id_usuario_responsable = u.id
      WHERE p.id = ?
    `;

    const [projects] = await db.query(query, [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: projects[0]
    });
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el proyecto',
      error: error.message
    });
  }
};

// Crear un nuevo proyecto y retornar el ID (método adicional)
exports.createProjectAndReturnId = async (projectData, userId) => {
  const { nombre, descripcion, fecha_inicio, fecha_fin, estado, id_usuario_responsable } = projectData;

  const query = `
    INSERT INTO Proyectos 
    (nombre, descripcion, fecha_inicio, fecha_fin, estado, id_usuario_responsable)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(query, [
    nombre,
    descripcion || null,
    fecha_inicio || null,
    fecha_fin || null,
    estado || 'activo',
    id_usuario_responsable || null
  ]);

  return result;
};

// Crear un nuevo proyecto
exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, id_usuario_responsable } = req.body;
    const id_usuario = req.user?.id;

    const result = await this.createProjectAndReturnId(req.body, id_usuario);

    await logEvento({
      tipo_evento: 'CREACIÓN',
      descripcion: `Proyecto creado: ${nombre}`,
      id_usuario,
      id_proyecto: result.insertId
    });

    const [newProject] = await db.query('SELECT * FROM Proyectos WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Proyecto creado correctamente',
      data: newProject[0]
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el proyecto',
      error: error.message
    });
  }
};

// Actualizar un proyecto
exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const projectId = req.params.id;
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, id_usuario_responsable } = req.body;
    const id_usuario = req.user?.id;

    const [existingProjects] = await db.query('SELECT * FROM Proyectos WHERE id = ?', [projectId]);
    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    let query = 'UPDATE Proyectos SET ';
    const updateFields = [];
    const params = [];

    if (nombre !== undefined) { updateFields.push('nombre = ?'); params.push(nombre); }
    if (descripcion !== undefined) { updateFields.push('descripcion = ?'); params.push(descripcion); }
    if (fecha_inicio !== undefined) { updateFields.push('fecha_inicio = ?'); params.push(fecha_inicio); }
    if (fecha_fin !== undefined) { updateFields.push('fecha_fin = ?'); params.push(fecha_fin); }
    if (estado !== undefined) { updateFields.push('estado = ?'); params.push(estado); }
    if (id_usuario_responsable !== undefined) { updateFields.push('id_usuario_responsable = ?'); params.push(id_usuario_responsable); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron campos para actualizar' });
    }

    query += updateFields.join(', ') + ' WHERE id = ?';
    params.push(projectId);

    await db.query(query, params);

    await logEvento({
      tipo_evento: 'ACTUALIZACIÓN',
      descripcion: `Proyecto actualizado: ${nombre || 'ID ' + projectId}`,
      id_usuario,
      id_proyecto: projectId
    });

    const [updatedProject] = await db.query(`
      SELECT p.*, u.nombre as responsable_nombre, u.email as responsable_email
      FROM Proyectos p
      LEFT JOIN Usuarios u ON p.id_usuario_responsable = u.id
      WHERE p.id = ?
    `, [projectId]);

    res.status(200).json({
      success: true,
      message: 'Proyecto actualizado correctamente',
      data: updatedProject[0]
    });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el proyecto',
      error: error.message
    });
  }
};

// Eliminar un proyecto
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const id_usuario = req.user?.id;

    const [existingProjects] = await db.query('SELECT * FROM Proyectos WHERE id = ?', [projectId]);
    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    const nombreProyecto = existingProjects[0].nombre;
    await db.query('DELETE FROM Proyectos WHERE id = ?', [projectId]);

    await logEvento({
      tipo_evento: 'ELIMINACIÓN',
      descripcion: `Proyecto eliminado: ${nombreProyecto}`,
      id_usuario,
      id_proyecto: projectId
    });

    res.status(200).json({
      success: true,
      message: 'Proyecto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el proyecto',
      error: error.message
    });
  }
};

// Cambiar estado de un proyecto
exports.changeProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['activo', 'completado', 'archivado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado no válido' });
    }

    const [existingProjects] = await db.query('SELECT * FROM Proyectos WHERE id = ?', [id]);
    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    await db.query('UPDATE Proyectos SET estado = ? WHERE id = ?', [estado, id]);

    const [updatedProject] = await db.query(`
      SELECT p.*, u.nombre as responsable_nombre, u.email as responsable_email
      FROM Proyectos p
      LEFT JOIN Usuarios u ON p.id_usuario_responsable = u.id
      WHERE p.id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Estado del proyecto actualizado correctamente',
      data: updatedProject[0]
    });
  } catch (error) {
    console.error('Error al cambiar estado del proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del proyecto',
      error: error.message
    });
  }
};

// Obtener estadísticas de proyectos
exports.getProjectStats = async (req, res) => {
  try {
    const [countsByStatus] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados,
        SUM(CASE WHEN estado = 'archivado' THEN 1 ELSE 0 END) as archivados,
        SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as cancelados
      FROM Proyectos
    `);

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [upcomingProjects] = await db.query(`
      SELECT COUNT(*) as proximosAVencer
      FROM Proyectos
      WHERE fecha_fin BETWEEN ? AND ?
      AND estado = 'activo'
    `, [today, nextWeek]);

    res.status(200).json({
      success: true,
      data: {
        total: countsByStatus[0].total,
        activos: countsByStatus[0].activos,
        completados: countsByStatus[0].completados,
        archivados: countsByStatus[0].archivados,
        cancelados: countsByStatus[0].cancelados,
        proximosAVencer: upcomingProjects[0].proximosAVencer
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de proyectos',
      error: error.message
    });
  }
};

/**
 * Obtiene los usuarios asignados a un proyecto
 * @param {number} projectId - ID del proyecto
 * @returns {Promise<Object[]>} - Array de objetos de usuario con información de rol
 */
exports.getProjectUsers = async (projectId) => {
  const query = `
    SELECT pu.id, pu.id_proyecto, pu.id_usuario, pu.rol, pu.fecha_asignacion, 
           u.nombre, u.email
    FROM proyecto_usuarios pu
    JOIN usuarios u ON pu.id_usuario = u.id
    WHERE pu.id_proyecto = ?
    ORDER BY FIELD(pu.rol, 'responsable', 'colaborador', 'observador'), u.nombre
  `;
  
  const [users] = await db.query(query, [projectId]);
  return users;
};

/**
 * Asigna un usuario a un proyecto
 * @param {number} projectId - ID del proyecto
 * @param {number} userId - ID del usuario
 * @param {string} rol - Rol del usuario (responsable, colaborador, observador)
 * @returns {Promise<Object>} - Resultado de la operación
 */
exports.assignUserToProject = async (projectId, userId, rol = 'colaborador') => {
  try {
    const query = `
      INSERT INTO proyecto_usuarios (id_proyecto, id_usuario, rol)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE rol = ?
    `;
    
    const [result] = await db.query(query, [projectId, userId, rol, rol]);
    return result;
  } catch (error) {
    console.error('Error al asignar usuario al proyecto:', error);
    throw error;
  }
};

/**
 * Elimina la asignación de un usuario a un proyecto
 * @param {number} projectId - ID del proyecto
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} - Resultado de la operación
 */
exports.removeUserFromProject = async (projectId, userId) => {
  try {
    const query = `
      DELETE FROM proyecto_usuarios
      WHERE id_proyecto = ? AND id_usuario = ?
    `;
    
    const [result] = await db.query(query, [projectId, userId]);
    return result;
  } catch (error) {
    console.error('Error al eliminar usuario del proyecto:', error);
    throw error;
  }
};

/**
 * Actualiza el rol de un usuario en un proyecto
 * @param {number} projectId - ID del proyecto
 * @param {number} userId - ID del usuario
 * @param {string} newRole - Nuevo rol del usuario
 * @returns {Promise<Object>} - Resultado de la operación
 */
exports.updateUserRoleInProject = async (projectId, userId, newRole) => {
  try {
    const query = `
      UPDATE proyecto_usuarios
      SET rol = ?
      WHERE id_proyecto = ? AND id_usuario = ?
    `;
    
    const [result] = await db.query(query, [newRole, projectId, userId]);
    return result;
  } catch (error) {
    console.error('Error al actualizar rol de usuario en proyecto:', error);
    throw error;
  }
};