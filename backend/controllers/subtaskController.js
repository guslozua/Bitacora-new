// controllers/subtaskController.js

const db = require('../config/db');
const SubtaskModel = require('../models/SubtaskModel');
const logEvento = require('../utils/logEvento');

exports.createSubtask = async (req, res) => {
  const { titulo, descripcion, fecha_inicio, fecha_vencimiento, prioridad } = req.body;
  const id_tarea = req.params.taskId || req.params.id_tarea;

  try {
    // Verificar que la tarea existe
    const tareaQuery = 'SELECT id FROM tareas WHERE id = ?';
    const [tareaResult] = await db.query(tareaQuery, [id_tarea]);
    if (!tareaResult.length) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    }

    // Construir la consulta SQL con los campos que sí existen en la tabla subtareas
    // Basado en la estructura de tabla mostrada en las imágenes
    const query = `
      INSERT INTO subtareas 
      (titulo, estado, id_tarea, descripcion, fecha_inicio, fecha_vencimiento, prioridad) 
      VALUES (?, 'pendiente', ?, ?, ?, ?, ?)
    `;
    
    // Ejecutar la consulta
    const [result] = await db.query(query, [
      titulo, 
      id_tarea, 
      descripcion || null, 
      fecha_inicio || null, 
      fecha_vencimiento || null, 
      prioridad || null
    ]);

    // Preparar la respuesta
    const responseData = {
      id: result.insertId,
      titulo,
      estado: 'pendiente',
      id_tarea,
      descripcion,
      fecha_inicio,
      fecha_vencimiento,
      prioridad
    };

    // Registrar el evento si es necesario
    console.log(`Subtarea ${titulo} creada para tarea ${id_tarea}`);

    // Enviar respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Subtarea creada con éxito',
      id: result.insertId,
      data: responseData,
    });
  } catch (error) {
    console.error('Error al crear subtarea:', error);
    res.status(500).json({ success: false, message: 'Error al crear subtarea' });
  }
};

exports.getSubtasksByTaskId = async (req, res) => {
  const id_tarea = req.params.taskId;
  
  try {
    const query = 'SELECT * FROM subtareas WHERE id_tarea = ?';
    const [rows] = await db.query(query, [id_tarea]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener subtareas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener subtareas' });
  }
};

exports.updateSubtask = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Construir la consulta de actualización
    const fields = [];
    const values = [];

    // Obtener los campos a actualizar del body
    for (const key in updates) {
      // Solo actualizar campos válidos que existen en la tabla subtareas
      if (['titulo', 'descripcion', 'estado', 'fecha_inicio', 'fecha_vencimiento', 'prioridad', 'id_tarea'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos válidos para actualizar' });
    }

    // Añadir el ID al final para la condición WHERE
    values.push(id);
    
    // Ejecutar la consulta
    const updateQuery = `UPDATE subtareas SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(updateQuery, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }

    console.log(`Subtarea ${id} actualizada`);
    res.status(200).json({ success: true, message: 'Subtarea actualizada con éxito' });
  } catch (error) {
    console.error('Error al actualizar subtarea:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar subtarea' });
  }
};

exports.deleteSubtask = async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = 'DELETE FROM subtareas WHERE id = ?';
    const [result] = await db.query(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }

    console.log(`Subtarea ${id} eliminada`);
    res.status(200).json({ success: true, message: 'Subtarea eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar subtarea:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar subtarea' });
  }
};

// FUNCIONES PARA GESTIÓN DE USUARIOS DE SUBTAREAS

/**
 * Obtiene todos los usuarios asignados a una subtarea
 */
exports.getSubtaskUsers = async (req, res) => {
  try {
    const subtaskId = req.params.id;
    
    // Verificar que la subtarea existe
    const [result] = await db.query('SELECT * FROM subtareas WHERE id = ?', [subtaskId]);
    if (!result || result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subtarea no encontrada' 
      });
    }
    
    // Obtener usuarios asignados
    const users = await SubtaskModel.getSubtaskUsers(subtaskId);
    
    return res.json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    console.error('Error al obtener usuarios de la subtarea:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios de la subtarea',
      error: error.message
    });
  }
};

/**
 * Asigna un usuario a una subtarea
 */
exports.assignUserToSubtask = async (req, res) => {
  try {
    const subtaskId = req.params.id;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar el ID de usuario'
      });
    }
    
    // Verificar que la subtarea existe
    const [subtask] = await db.query('SELECT * FROM subtareas WHERE id = ?', [subtaskId]);
    if (!subtask || subtask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtarea no encontrada'
      });
    }
    
    // Verificar que el usuario existe
    const [user] = await db.query('SELECT * FROM Usuarios WHERE id = ?', [userId]);
    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Realizar la asignación
    await SubtaskModel.assignUserToSubtask(subtaskId, userId);
    
    // Obtener la información completa del usuario para la respuesta
    const [userInfo] = await db.query('SELECT id, nombre, email FROM Usuarios WHERE id = ?', [userId]);
    
    return res.status(201).json({
      success: true,
      message: 'Usuario asignado a la subtarea con éxito',
      data: {
        id_subtarea: subtaskId,
        id_usuario: userId,
        usuario: userInfo[0]
      }
    });
  } catch (error) {
    console.error('Error al asignar usuario a la subtarea:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asignar usuario a la subtarea',
      error: error.message
    });
  }
};

/**
 * Elimina la asignación de un usuario de una subtarea
 */
exports.removeUserFromSubtask = async (req, res) => {
  try {
    const subtaskId = req.params.subtaskId;
    const userId = req.params.userId;
    
    // Verificar que la subtarea existe
    const [subtask] = await db.query('SELECT * FROM subtareas WHERE id = ?', [subtaskId]);
    if (!subtask || subtask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtarea no encontrada'
      });
    }
    
    // Eliminar la asignación
    const result = await SubtaskModel.removeUserFromSubtask(subtaskId, userId);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no está asignado a esta subtarea'
      });
    }
    
    return res.json({
      success: true,
      message: 'Usuario eliminado de la subtarea con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar usuario de la subtarea:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario de la subtarea',
      error: error.message
    });
  }
};

/**
 * Actualiza todos los usuarios asignados a una subtarea
 */
exports.updateSubtaskUsers = async (req, res) => {
  try {
    const subtaskId = req.params.id;
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'El campo userIds debe ser un array'
      });
    }
    
    // Verificar que la subtarea existe
    const [subtask] = await db.query('SELECT * FROM subtareas WHERE id = ?', [subtaskId]);
    if (!subtask || subtask.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtarea no encontrada'
      });
    }
    
    // Actualizar usuarios
    await SubtaskModel.updateSubtaskUsers(subtaskId, userIds);
    
    // Obtener la lista actualizada de usuarios
    const updatedUsers = await SubtaskModel.getSubtaskUsers(subtaskId);
    
    // Obtener información de la tarea padre para registrar evento
    const [tareaInfo] = await db.query('SELECT t.id, t.titulo, t.id_proyecto, p.nombre as nombre_proyecto FROM tareas t JOIN proyectos p ON t.id_proyecto = p.id WHERE t.id = ?', [subtask[0].id_tarea]);
    
    if (tareaInfo && tareaInfo.length > 0) {
      // Registrar evento en bitácora
      await logEvento({
        tipo_evento: 'ACTUALIZACIÓN',
        descripcion: `Usuarios de subtarea actualizados: ${subtask[0].titulo}`,
        id_usuario: req.user.id,
        nombre_usuario: req.user.nombre,
        id_proyecto: tareaInfo[0].id_proyecto,
        nombre_proyecto: tareaInfo[0].nombre_proyecto,
        id_tarea: tareaInfo[0].id,
        nombre_tarea: tareaInfo[0].titulo,
        id_subtarea: subtaskId,
        nombre_subtarea: subtask[0].titulo
      });
    }
    
    return res.json({
      success: true,
      message: 'Usuarios de la subtarea actualizados con éxito',
      data: updatedUsers
    });
  } catch (error) {
    console.error('Error al actualizar usuarios de la subtarea:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar usuarios de la subtarea',
      error: error.message
    });
  }
};