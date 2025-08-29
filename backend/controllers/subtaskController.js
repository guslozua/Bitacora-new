// controllers/subtaskController.js

const db = require('../config/db');
const SubtaskModel = require('../models/SubtaskModel');
const logEvento = require('../utils/logEvento');

exports.createSubtask = async (req, res) => {
  const { titulo, descripcion, fecha_inicio, fecha_vencimiento, prioridad } = req.body;
  const id_tarea = req.params.taskId || req.params.id_tarea;

  try {
    // Verificar que la tarea existe
    const tareaQuery = 'SELECT id FROM taskmanagementsystem.tareas WHERE id = ?';
    const tareaResult = await db.query(tareaQuery, [id_tarea]);
    if (!tareaResult[0] || tareaResult[0].length === 0) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    }

    // Construir la consulta SQL con los campos que sí existen en la tabla subtareas
    // Basado en la estructura de tabla mostrada en las imágenes
    const query = `
      INSERT INTO taskmanagementsystem.subtareas 
      (titulo, estado, id_tarea, descripcion, fecha_inicio, fecha_vencimiento, prioridad) 
      VALUES (?, 'pendiente', ?, ?, ?, ?, ?)
    `;
    
    // Ejecutar la consulta
    const result = await db.query(query, [
      titulo, 
      id_tarea, 
      descripcion || null, 
      fecha_inicio || null, 
      fecha_vencimiento || null, 
      prioridad || null
    ]);

    // Preparar la respuesta - usar rowsAffected para SQL Server
    const responseData = {
      id: result.recordset ? result.recordset[0]?.id : null,
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

    res.status(201).json({
      success: true,
      message: 'Subtarea creada exitosamente',
      data: responseData
    });

  } catch (error) {
    console.error('Error creando subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear subtarea',
      error: error.message
    });
  }
};

exports.getSubtasks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM taskmanagementsystem.subtareas');
    
    res.json({
      success: true,
      data: result[0] || []
    });
  } catch (error) {
    console.error('❌ Error obteniendo subtareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener subtareas: ' + error.message
    });
  }
};

exports.getSubtasksByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await db.query(
      'SELECT * FROM taskmanagementsystem.subtareas WHERE id_tarea = ?',
      [taskId]
    );
    
    res.json({
      success: true,
      data: result[0] || []
    });
  } catch (error) {
    console.error('❌ Error obteniendo subtareas por tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener subtareas: ' + error.message
    });
  }
};

exports.updateSubtask = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, estado, fecha_inicio, fecha_vencimiento, prioridad } = req.body;

  try {
    const query = `
      UPDATE taskmanagementsystem.subtareas 
      SET titulo = ?, descripcion = ?, estado = ?, fecha_inicio = ?, fecha_vencimiento = ?, prioridad = ?
      WHERE id = ?
    `;
    
    const result = await db.query(query, [
      titulo, descripcion, estado, fecha_inicio, fecha_vencimiento, prioridad, id
    ]);

    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }

    res.json({
      success: true,
      message: 'Subtarea actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar subtarea: ' + error.message
    });
  }
};

exports.deleteSubtask = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM taskmanagementsystem.subtareas WHERE id = ?', [id]);

    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }

    res.json({
      success: true,
      message: 'Subtarea eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar subtarea: ' + error.message
    });
  }
};

// ===== NUEVAS FUNCIONES PARA MANEJO DE USUARIOS EN SUBTAREAS =====

exports.getSubtaskUsers = async (req, res) => {
  try {
    const subtaskId = req.params.id;
    
    const query = `
      SELECT u.id, u.nombre, u.email, su.fecha_asignacion
      FROM taskmanagementsystem.usuarios u
      INNER JOIN taskmanagementsystem.subtarea_usuarios su ON u.id = su.id_usuario
      WHERE su.id_subtarea = ?
    `;
    
    const result = await db.query(query, [subtaskId]);
    
    res.json({
      success: true,
      data: result[0] || []
    });
  } catch (error) {
    console.error('Error obteniendo usuarios de subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios de la subtarea: ' + error.message
    });
  }
};

exports.assignUserToSubtask = async (req, res) => {
  try {
    console.log('🔎 [assignUserToSubtask] Iniciando asignación');
    console.log('🔎 [assignUserToSubtask] Params:', req.params);
    console.log('🔎 [assignUserToSubtask] Body:', req.body);
    
    const subtaskId = req.params.id;
    // Intentar extraer el ID del usuario con diferentes nombres de campos
    const { usuario_id, userId, user_id, id } = req.body;
    const finalUserId = usuario_id || userId || user_id || id;
    
    console.log('🔎 [assignUserToSubtask] subtaskId extraído:', subtaskId);
    console.log('🔎 [assignUserToSubtask] IDs intentados:', { usuario_id, userId, user_id, id });
    console.log('🔎 [assignUserToSubtask] finalUserId seleccionado:', finalUserId);
    
    if (!subtaskId || !finalUserId) {
      console.log('❌ [assignUserToSubtask] Faltan parámetros');
      return res.status(400).json({ 
        success: false, 
        message: 'ID de subtarea y usuario son requeridos',
        received: { subtaskId, finalUserId, body: req.body }
      });
    }
    
    // Verificar que la subtarea existe
    const subtaskCheck = await db.query('SELECT id FROM taskmanagementsystem.subtareas WHERE id = ?', [subtaskId]);
    if (!subtaskCheck[0] || subtaskCheck[0].length === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }
    
    // Verificar que el usuario existe
    console.log('🔎 [assignUserToSubtask] Verificando usuario...');
    const userCheck = await db.query('SELECT id FROM taskmanagementsystem.usuarios WHERE id = ?', [finalUserId]);
    if (!userCheck[0] || userCheck[0].length === 0) {
      console.log('❌ [assignUserToSubtask] Usuario no encontrado:', finalUserId);
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    console.log('✅ [assignUserToSubtask] Usuario encontrado');
    
    // Verificar si ya está asignado
    console.log('🔎 [assignUserToSubtask] Verificando asignación existente...');
    const existingAssignment = await db.query(
      'SELECT id FROM taskmanagementsystem.subtarea_usuarios WHERE id_subtarea = ? AND id_usuario = ?',
      [subtaskId, finalUserId]
    );
    
    if (existingAssignment[0] && existingAssignment[0].length > 0) {
      console.log('⚠️ [assignUserToSubtask] Usuario ya asignado');
      return res.status(400).json({ success: false, message: 'El usuario ya está asignado a esta subtarea' });
    }
    
    // Asignar usuario (sin rol, con fecha actual)
    console.log('🔎 [assignUserToSubtask] Insertando asignación...');
    const insertQuery = `
      INSERT INTO taskmanagementsystem.subtarea_usuarios (id_subtarea, id_usuario, fecha_asignacion)
      VALUES (?, ?, GETDATE())
    `;
    
    await db.query(insertQuery, [subtaskId, finalUserId]);
    console.log('✅ [assignUserToSubtask] Usuario asignado exitosamente');
    
    res.status(201).json({
      success: true,
      message: 'Usuario asignado a la subtarea exitosamente'
    });
  } catch (error) {
    console.error('Error asignando usuario a subtarea:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al asignar usuario a la subtarea: ' + error.message
    });
  }
};

exports.removeUserFromSubtask = async (req, res) => {
  try {
    const { subtaskId, userId } = req.params;
    
    const result = await db.query(
      'DELETE FROM taskmanagementsystem.subtarea_usuarios WHERE id_subtarea = ? AND id_usuario = ?',
      [subtaskId, userId]
    );
    
    if (result.rowsAffected && result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    }
    
    res.json({
      success: true,
      message: 'Usuario removido de la subtarea exitosamente'
    });
  } catch (error) {
    console.error('Error removiendo usuario de subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover usuario de la subtarea: ' + error.message
    });
  }
};

exports.updateSubtaskUsers = async (req, res) => {
  try {
    console.log('🔎 [updateSubtaskUsers] Iniciando actualización');
    console.log('🔎 [updateSubtaskUsers] Params:', req.params);
    console.log('🔎 [updateSubtaskUsers] Body:', req.body);
    
    const subtaskId = req.params.id;
    const { usuarios } = req.body; // Array de usuarios
    
    console.log('🔎 [updateSubtaskUsers] subtaskId:', subtaskId);
    console.log('🔎 [updateSubtaskUsers] usuarios recibidos:', usuarios);
    
    // Verificar que la subtarea existe
    const subtaskCheck = await db.query('SELECT id FROM taskmanagementsystem.subtareas WHERE id = ?', [subtaskId]);
    if (!subtaskCheck[0] || subtaskCheck[0].length === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }
    
    // Eliminar todas las asignaciones actuales
    await db.query('DELETE FROM taskmanagementsystem.subtarea_usuarios WHERE id_subtarea = ?', [subtaskId]);
    
    // Insertar las nuevas asignaciones
    if (usuarios && usuarios.length > 0) {
      console.log('🔎 [updateSubtaskUsers] Insertando nuevas asignaciones...');
      for (const usuario of usuarios) {
        // Extraer el ID del usuario - puede venir como 'id', 'usuario_id', 'userId', etc.
        const userId = usuario.id || usuario.usuario_id || usuario.userId || usuario.user_id;
        
        console.log('🔎 [updateSubtaskUsers] Insertando usuario:', userId);
        
        if (userId) {
          await db.query(
            'INSERT INTO taskmanagementsystem.subtarea_usuarios (id_subtarea, id_usuario, fecha_asignacion) VALUES (?, ?, GETDATE())',
            [subtaskId, userId]
          );
        } else {
          console.warn('⚠️ [updateSubtaskUsers] Usuario sin ID válido:', usuario);
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Usuarios de la subtarea actualizados exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando usuarios de subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuarios de la subtarea: ' + error.message
    });
  }
};
