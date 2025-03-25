// controllers/projectController.js
const projectModel = require('../models/ProjectModel');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const logEvento = require('../utils/logEvento');

// Obtener todos los proyectos con filtros
exports.getProjects = async (req, res) => {
  try {
    // Usar directamente el método del modelo SQL
    return await projectModel.getProjects(req, res);
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
    // Usar directamente el método del modelo SQL
    return await projectModel.getProjectById(req, res);
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el proyecto',
      error: error.message
    });
  }
};

// Crear un nuevo proyecto
exports.createProject = async (req, res) => {
  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    // Extraer información relevante del cuerpo de la solicitud
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado } = req.body;
    const userId = req.user.id;

    // Obtener nombre del usuario
    const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [userId]);
    const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

    // Obtener nombre del proyecto
    const nombreProyecto = nombre || 'Proyecto sin nombre';

    // Llamar al método del modelo para crear el proyecto
    const result = await projectModel.createProjectAndReturnId(req.body, userId);
    
    // Si no tenemos un ID de proyecto válido, manejamos el error
    if (!result || !result.insertId) {
      throw new Error('No se pudo obtener el ID del proyecto creado');
    }

    // Registrar el evento en la bitácora
    await logEvento({
      tipo_evento: 'CREACIÓN',
      descripcion: `Proyecto creado: ${nombreProyecto}`,
      id_usuario: userId,
      nombre_usuario: nombreUsuario,
      id_proyecto: result.insertId,
      nombre_proyecto: nombreProyecto,
      id_tarea: null,
      nombre_tarea: null,
      id_subtarea: null,
      nombre_subtarea: null
    });

    // Enviar respuesta al cliente
    return res.status(201).json({
      success: true,
      message: 'Proyecto creado con éxito',
      data: {
        id: result.insertId,
        ...req.body
      }
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
  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const projectId = req.params.id;
    const { nombre, descripcion, fecha_inicio, fecha_fin, estado } = req.body;
    const userId = req.user.id;

    // Obtener información actual del proyecto
    const [currentProject] = await db.query('SELECT * FROM Proyectos WHERE id = ?', [projectId]);
    
    if (!currentProject || currentProject.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Obtener nombre del usuario
    const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [userId]);
    const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

    // Usar el nombre actualizado o el actual si no se proporcionó
    const nombreProyecto = nombre || currentProject[0].nombre;
    
    // Actualizar el proyecto en la base de datos
    const [result] = await db.query(
      'UPDATE Proyectos SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?',
      [
        nombre || currentProject[0].nombre,
        descripcion || currentProject[0].descripcion,
        fecha_inicio || currentProject[0].fecha_inicio,
        fecha_fin || currentProject[0].fecha_fin,
        estado || currentProject[0].estado,
        projectId
      ]
    );

    // Registrar el evento en la bitácora
    await logEvento({
      tipo_evento: 'ACTUALIZACIÓN',
      descripcion: `Proyecto actualizado: ${nombreProyecto} (${estado || currentProject[0].estado})`,
      id_usuario: userId,
      nombre_usuario: nombreUsuario,
      id_proyecto: projectId,
      nombre_proyecto: nombreProyecto,
      id_tarea: null,
      nombre_tarea: null,
      id_subtarea: null,
      nombre_subtarea: null
    });

    // Enviar respuesta al cliente
    return res.json({
      success: true,
      message: 'Proyecto actualizado con éxito',
      data: {
        id: projectId,
        nombre: nombre || currentProject[0].nombre,
        descripcion: descripcion || currentProject[0].descripcion,
        fecha_inicio: fecha_inicio || currentProject[0].fecha_inicio,
        fecha_fin: fecha_fin || currentProject[0].fecha_fin,
        estado: estado || currentProject[0].estado
      }
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
    const userId = req.user.id;

    // Obtener información del proyecto antes de eliminarlo
    const [projectResult] = await db.query('SELECT * FROM Proyectos WHERE id = ?', [projectId]);
    
    if (!projectResult || projectResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Corregir cómo se accede al nombre del proyecto
    const project = projectResult[0];
    const nombreProyecto = project.nombre || 'Proyecto sin nombre';

    // Obtener nombre del usuario
    const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [userId]);
    const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

    // Registrar el evento de eliminación en la bitácora
    await logEvento({
      tipo_evento: 'ELIMINACIÓN',
      descripcion: `Proyecto eliminado: ${nombreProyecto}`,
      id_usuario: userId,
      nombre_usuario: nombreUsuario,
      id_proyecto: projectId,
      nombre_proyecto: nombreProyecto,
      id_tarea: null,
      nombre_tarea: null,
      id_subtarea: null,
      nombre_subtarea: null
    });

    // Eliminar el proyecto
    const [result] = await db.query('DELETE FROM Proyectos WHERE id = ?', [projectId]);

    // Enviar respuesta al cliente
    return res.json({
      success: true,
      message: 'Proyecto eliminado con éxito'
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
    const projectId = req.params.id;
    const { estado } = req.body;
    const userId = req.user.id;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el estado'
      });
    }

    // Obtener información actual del proyecto
    const [currentProject] = await db.query('SELECT * FROM Proyectos WHERE id = ?', [projectId]);
    
    if (!currentProject || currentProject.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Obtener nombre del usuario
    const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [userId]);
    const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

    // Actualizar el estado del proyecto
    const [result] = await db.query(
      'UPDATE Proyectos SET estado = ? WHERE id = ?',
      [estado, projectId]
    );

    // Registrar el evento en la bitácora
    await logEvento({
      tipo_evento: 'ACTUALIZACIÓN',
      descripcion: `Estado de proyecto cambiado: ${currentProject[0].nombre} (${estado})`,
      id_usuario: userId,
      nombre_usuario: nombreUsuario,
      id_proyecto: projectId,
      nombre_proyecto: currentProject[0].nombre,
      id_tarea: null,
      nombre_tarea: null,
      id_subtarea: null,
      nombre_subtarea: null
    });

    // Enviar respuesta al cliente
    return res.json({
      success: true,
      message: 'Estado del proyecto actualizado con éxito',
      data: {
        id: projectId,
        nombre: currentProject[0].nombre,
        estado: estado
      }
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
    // Usar directamente el método del modelo SQL
    return await projectModel.getProjectStats(req, res);
  } catch (error) {
    console.error('Error al obtener estadísticas de proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de proyectos',
      error: error.message
    });
  }
};