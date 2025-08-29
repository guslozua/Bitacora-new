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
      FROM taskmanagementsystem.proyectos p
      LEFT JOIN taskmanagementsystem.usuarios u ON p.id_usuario_responsable = u.id
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

    const projects = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: projects[0].length,
      data: projects[0]
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
      FROM taskmanagementsystem.proyectos p
      LEFT JOIN taskmanagementsystem.usuarios u ON p.id_usuario_responsable = u.id
      WHERE p.id = ?
    `;

    const projects = await db.query(query, [projectId]);

    if (!projects[0] || projects[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: projects[0][0]
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
  try {
    console.log('🔍 [MODEL DEBUG] Datos recibidos en createProjectAndReturnId:', {
      projectData,
      userId
    });

    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, prioridad, id_usuario_responsable } = projectData;

    console.log('🔍 [MODEL DEBUG] Campos extraídos:', {
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado,
      prioridad, // 🆕 NUEVO CAMPO
      id_usuario_responsable
    });

    const query = `
      INSERT INTO taskmanagementsystem.proyectos 
      (nombre, descripcion, fecha_inicio, fecha_fin, estado, prioridad, id_usuario_responsable)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nombre,
      descripcion || null,
      fecha_inicio || null,
      fecha_fin || null,
      estado || 'activo',
      prioridad || 'media', // 🆕 NUEVO CAMPO CON VALOR POR DEFECTO
      id_usuario_responsable || null
    ];

    console.log('🔍 [MODEL DEBUG] Query a ejecutar:', query);
    console.log('🔍 [MODEL DEBUG] Parámetros:', params);

    const result = await db.query(query, params);

    console.log('🔍 [MODEL DEBUG] Resultado de la query:', result);
    console.log('🔍 [MODEL DEBUG] insertId obtenido:', result[0].insertId);

    if (!result[0].insertId) {
      console.error('❌ [MODEL DEBUG] No se obtuvo insertId de la base de datos');
      throw new Error('La base de datos no retornó un ID válido');
    }

    return { insertId: result[0].insertId };

  } catch (error) {
    console.error('❌ [MODEL DEBUG] Error en createProjectAndReturnId:', {
      message: error.message,
      stack: error.stack,
      projectData,
      userId
    });
    throw error;
  }
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
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, prioridad, id_usuario_responsable } = req.body;
    const id_usuario = req.user?.id;

    const result = await this.createProjectAndReturnId(req.body, id_usuario);

    await logEvento({
      tipo_evento: 'CREACIÓN',
      descripcion: `Proyecto creado: ${nombre}`,
      id_usuario,
      id_proyecto: result.insertId
    });

    const [newProject] = await db.query('SELECT * FROM taskmanagementsystem.proyectos WHERE id = ?', [result.insertId]);

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
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado, prioridad, id_usuario_responsable } = req.body;
    const id_usuario = req.user?.id;

    const [existingProjects] = await db.query('SELECT * FROM taskmanagementsystem.proyectos WHERE id = ?', [projectId]);
    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    let query = 'UPDATE taskmanagementsystem.proyectos SET ';
    const updateFields = [];
    const params = [];

    if (nombre !== undefined) { updateFields.push('nombre = ?'); params.push(nombre); }
    if (descripcion !== undefined) { updateFields.push('descripcion = ?'); params.push(descripcion); }
    if (fecha_inicio !== undefined) { updateFields.push('fecha_inicio = ?'); params.push(fecha_inicio); }
    if (fecha_fin !== undefined) { updateFields.push('fecha_fin = ?'); params.push(fecha_fin); }
    if (estado !== undefined) { updateFields.push('estado = ?'); params.push(estado); }
    if (prioridad !== undefined) { updateFields.push('prioridad = ?'); params.push(prioridad); } // 🆕 NUEVO CAMPO
    if (id_usuario_responsable !== undefined) { updateFields.push('id_usuario_responsable = ?'); params.push(id_usuario_responsable); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron campos para actualizar' });
    }

    query += updateFields.join(', ') + ' WHERE id = ?';
    params.push(projectId);

    const result = await db.query(query, params);
    console.log('🔍 [UPDATE] Resultado de la query:', result);

    await logEvento({
      tipo_evento: 'ACTUALIZACIÓN',
      descripcion: `Proyecto actualizado: ${nombre || 'ID ' + projectId}`,
      id_usuario,
      id_proyecto: projectId
    });

    const [updatedProject] = await db.query(`
      SELECT p.*, u.nombre as responsable_nombre, u.email as responsable_email
      FROM taskmanagementsystem.proyectos p
      LEFT JOIN taskmanagementsystem.usuarios u ON p.id_usuario_responsable = u.id
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

    const [existingProjects] = await db.query('SELECT * FROM taskmanagementsystem.proyectos WHERE id = ?', [projectId]);
    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    const nombreProyecto = existingProjects[0].nombre;
    await db.query('DELETE FROM taskmanagementsystem.proyectos WHERE id = ?', [projectId]);

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

    const [existingProjects] = await db.query('SELECT * FROM taskmanagementsystem.proyectos WHERE id = ?', [id]);
    if (existingProjects.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    await db.query('UPDATE taskmanagementsystem.proyectos SET estado = ? WHERE id = ?', [estado, id]);

    const [updatedProject] = await db.query(`
      SELECT p.*, u.nombre as responsable_nombre, u.email as responsable_email
      FROM taskmanagementsystem.proyectos p
      LEFT JOIN taskmanagementsystem.usuarios u ON p.id_usuario_responsable = u.id
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
      FROM taskmanagementsystem.proyectos
    `);

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [upcomingProjects] = await db.query(`
      SELECT COUNT(*) as proximosAVencer
      FROM taskmanagementsystem.proyectos
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
    FROM taskmanagementsystem.proyecto_usuarios pu
    JOIN taskmanagementsystem.usuarios u ON pu.id_usuario = u.id
    WHERE pu.id_proyecto = ?
    ORDER BY 
      CASE pu.rol 
        WHEN 'responsable' THEN 1
        WHEN 'colaborador' THEN 2 
        WHEN 'observador' THEN 3
        ELSE 4
      END, u.nombre
  `;
  
  const users = await db.query(query, [projectId]);
  return users[0];
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
    console.log(`[ProjectModel] Asignando usuario ${userId} al proyecto ${projectId} con rol ${rol}`);
    
    // Verificar si el usuario ya está asignado
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM taskmanagementsystem.proyecto_usuarios 
      WHERE id_proyecto = ? AND id_usuario = ?
    `;
    
    const existingUser = await db.query(checkQuery, [projectId, userId]);
    const userExists = existingUser[0] && existingUser[0].length > 0 && existingUser[0][0].count > 0;
    
    if (userExists) {
      // Si existe, actualizar el rol
      const updateQuery = `
        UPDATE taskmanagementsystem.proyecto_usuarios 
        SET rol = ?, fecha_asignacion = GETDATE()
        WHERE id_proyecto = ? AND id_usuario = ?
      `;
      const result = await db.query(updateQuery, [rol, projectId, userId]);
      console.log(`[ProjectModel] Usuario ${userId} actualizado en proyecto ${projectId}`);
      return { 
        affectedRows: result[0] ? result[0].affectedRows : 1, 
        action: 'updated' 
      };
    } else {
      // Si no existe, insertar nuevo registro
      const insertQuery = `
        INSERT INTO taskmanagementsystem.proyecto_usuarios 
        (id_proyecto, id_usuario, rol, fecha_asignacion) 
        VALUES (?, ?, ?, GETDATE())
      `;
      const result = await db.query(insertQuery, [projectId, userId, rol]);
      console.log(`[ProjectModel] Usuario ${userId} insertado en proyecto ${projectId}`);
      return { 
        affectedRows: result[0] ? result[0].affectedRows : 1, 
        action: 'inserted' 
      };
    }
  } catch (error) {
    console.error('[ProjectModel] Error al asignar usuario al proyecto:', error);
    console.error('[ProjectModel] Error details:', {
      projectId,
      userId,
      rol,
      message: error.message,
      stack: error.stack
    });
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
    console.log(`[ProjectModel] Eliminando usuario ${userId} del proyecto ${projectId}`);
    
    const query = `
      DELETE FROM taskmanagementsystem.proyecto_usuarios
      WHERE id_proyecto = ? AND id_usuario = ?
    `;
    
    const result = await db.query(query, [projectId, userId]);
    console.log(`[ProjectModel] Usuario ${userId} eliminado del proyecto ${projectId}`);
    
    return { 
      affectedRows: result[0] ? result[0].affectedRows : 0 
    };
  } catch (error) {
    console.error('[ProjectModel] Error al eliminar usuario del proyecto:', error);
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
    console.log(`[ProjectModel] Actualizando rol de usuario ${userId} en proyecto ${projectId} a ${newRole}`);
    
    const query = `
      UPDATE taskmanagementsystem.proyecto_usuarios
      SET rol = ?, fecha_asignacion = GETDATE()
      WHERE id_proyecto = ? AND id_usuario = ?
    `;
    
    const result = await db.query(query, [newRole, projectId, userId]);
    console.log(`[ProjectModel] Rol actualizado para usuario ${userId} en proyecto ${projectId}`);
    
    return { 
      affectedRows: result[0] ? result[0].affectedRows : 0 
    };
  } catch (error) {
    console.error('[ProjectModel] Error al actualizar rol de usuario en proyecto:', error);
    throw error;
  }
};