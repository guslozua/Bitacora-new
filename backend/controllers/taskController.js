//controllers/taskController.js
const TaskModel = require('../models/TaskModel');
const db = require('../config/db');
const logEvento = require('../utils/logEvento');

// Crear una nueva tarea
exports.createTask = async (req, res) => {
    try {
        console.log("Body recibido:", req.body);
        console.log("Usuario autenticado:", req.user);

        const { titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado } = req.body;
        const userId = id_usuario_asignado || req.user.id;

        // Obtener nombre del usuario
        const [userInfo] = await db.query('SELECT nombre FROM taskmanagementsystem.Usuarios WHERE id = ?', [req.user.id]);
        const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

        // Obtener nombre del proyecto
        const [projectInfo] = await db.query('SELECT nombre FROM taskmanagementsystem.Proyectos WHERE id = ?', [id_proyecto]);
        const nombreProyecto = projectInfo.length > 0 ? projectInfo[0].nombre : null;

        console.log({
            titulo,
            descripcion,
            estado,
            prioridad,
            fecha_inicio,
            fecha_vencimiento,
            id_proyecto,
            userId
          });

          const formatFecha = (fecha) => {
            if (!fecha) return null;
            const parsed = new Date(fecha);
            return isNaN(parsed) ? null : parsed.toISOString().split('T')[0]; // YYYY-MM-DD
        };
        
        const result = await TaskModel.createTask(
            titulo,
            descripcion,
            estado,
            prioridad,
            formatFecha(fecha_inicio),
            formatFecha(fecha_vencimiento),
            id_proyecto,
            userId
        );

        await logEvento({
            tipo_evento: 'CREACIÓN',
            descripcion: `Tarea creada: ${titulo}`,
            id_usuario: req.user.id,
            nombre_usuario: nombreUsuario,
            id_proyecto: id_proyecto,
            nombre_proyecto: nombreProyecto,
            id_tarea: result.insertId,
            nombre_tarea: titulo,
            id_subtarea: null,
            nombre_subtarea: null
        });

        res.status(201).json({ success: true, message: 'Tarea creada con éxito', taskId: result.insertId });
    } catch (error) {
        console.error("Excepción en createTask:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
};

// Obtener todas las tareas con filtros
exports.getAllTasks = async (req, res) => {
    try {
        const { estado, prioridad, usuario } = req.query;
        let sql = 'SELECT * FROM taskmanagementsystem.Tareas WHERE 1=1';
        const params = [];

        if (estado) {
            sql += ' AND estado = ?';
            params.push(estado);
        }
        if (prioridad) {
            sql += ' AND prioridad = ?';
            params.push(prioridad);
        }
        if (usuario) {
            sql += ' AND id_usuario_asignado = ?';
            params.push(usuario);
        }

        const results = await TaskModel.getTasksByFilter(sql, params);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Excepción en getAllTasks:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
};

// Obtener una tarea por ID
exports.getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id;

        const results = await TaskModel.getTaskById(taskId);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }
        res.json({ success: true, data: results[0] });
    } catch (error) {
        console.error("Excepción en getTaskById:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
};

// Actualizar una tarea por ID
exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_usuario_asignado, id_proyecto } = req.body;

        // Obtener información actual de la tarea
        const [currentTask] = await TaskModel.getTaskById(taskId);
        if (!currentTask) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }
        
        // Usar el id_proyecto del cuerpo de la solicitud si está presente, 
        // de lo contrario usar el existente en la tarea actual
        const projectId = id_proyecto || currentTask.id_proyecto;
        
        // Obtener nombre del usuario
        const [userInfo] = await db.query('SELECT nombre FROM taskmanagementsystem.Usuarios WHERE id = ?', [req.user.id]);
        const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

        // Obtener nombre del proyecto
        const [projectInfo] = await db.query('SELECT nombre FROM taskmanagementsystem.Proyectos WHERE id = ?', [projectId]);
        const nombreProyecto = projectInfo.length > 0 ? projectInfo[0].nombre : null;

        const result = await TaskModel.updateTask(
            taskId,
            titulo,
            descripcion,
            estado,
            prioridad,
            fecha_inicio,
            fecha_vencimiento,
            id_usuario_asignado
        );

        // Usar el título actualizado o el actual si no se proporcionó
        const nombreTarea = titulo || currentTask.titulo;

        await logEvento({
            tipo_evento: 'ACTUALIZACIÓN',
            descripcion: `Tarea actualizada: ${nombreTarea} (${estado || currentTask.estado})`,
            id_usuario: req.user.id,
            nombre_usuario: nombreUsuario,
            id_proyecto: projectId,
            nombre_proyecto: nombreProyecto,
            id_tarea: taskId,
            nombre_tarea: nombreTarea,
            id_subtarea: null,
            nombre_subtarea: null
        });

        res.json({ 
            success: true, 
            message: 'Tarea actualizada correctamente',
            data: {
                id: taskId,
                titulo: nombreTarea,
                descripcion,
                estado,
                prioridad,
                fecha_inicio,
                fecha_vencimiento,
                id_usuario_asignado,
                id_proyecto: projectId
            }
        });
    } catch (error) {
        console.error("Excepción en updateTask:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
};

// Eliminar una tarea por ID
exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;

        // Obtener información de la tarea antes de eliminarla
        const [tarea] = await TaskModel.getTaskById(taskId);
        if (!tarea) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }
        
        const titulo = tarea.titulo || 'Tarea desconocida';
        const id_proyecto = tarea.id_proyecto;
        
        // Obtener nombre del usuario
        const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [req.user.id]);
        const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

        // Obtener nombre del proyecto
        const [projectInfo] = await db.query('SELECT nombre FROM Proyectos WHERE id = ?', [id_proyecto]);
        const nombreProyecto = projectInfo.length > 0 ? projectInfo[0].nombre : null;

        // Registrar el evento antes de eliminar
        try {
            await logEvento({
                tipo_evento: 'ELIMINACIÓN',
                descripcion: `Tarea eliminada: ${titulo}`,
                id_usuario: req.user.id,
                nombre_usuario: nombreUsuario,
                id_proyecto: id_proyecto,
                nombre_proyecto: nombreProyecto,
                id_tarea: taskId,
                nombre_tarea: titulo,
                id_subtarea: null,
                nombre_subtarea: null
            });
        } catch (logError) {
            console.error('⚠️ Error al registrar evento de eliminación en bitácora:', logError);
        }

        // Eliminar la tarea
        const result = await TaskModel.deleteTask(taskId);

        res.json({ success: true, message: 'Tarea eliminada correctamente' });
    } catch (error) {
        console.error("Excepción en deleteTask:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
};

// FUNCIONES PARA GESTIÓN DE USUARIOS DE TAREAS

/**
 * Obtiene todos los usuarios asignados a una tarea
 */
exports.getTaskUsers = async (req, res) => {
    try {
      const taskId = req.params.id;
      
      // Verificar que la tarea existe
      const [task] = await TaskModel.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ 
          success: false, 
          message: 'Tarea no encontrada' 
        });
      }
      
      // Obtener usuarios asignados
      const users = await TaskModel.getTaskUsers(taskId);
      
      return res.json({ 
        success: true, 
        data: users 
      });
    } catch (error) {
      console.error('Error al obtener usuarios de la tarea:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios de la tarea',
        error: error.message
      });
    }
};

// ===== FUNCIÓN FALTANTE PARA ASIGNAR USUARIOS A TAREAS =====

/**
 * Asigna un usuario a una tarea
 */
exports.assignUserToTask = async (req, res) => {
  console.log('🚨 [INICIO assignUserToTask] FUNCIÓN EJECUTÁNDOSE');
  try {
    console.log('🔎 [assignUserToTask] Iniciando asignación');
    console.log('🔎 [assignUserToTask] Params:', req.params);
    console.log('🔎 [assignUserToTask] Body:', req.body);
    console.log('🔎 [assignUserToTask] User:', req.user);
    
    const taskId = req.params.id;
    // Intentar extraer el ID del usuario con diferentes nombres de campos
    const { usuario_id, userId, user_id, id } = req.body;
    const finalUserId = usuario_id || userId || user_id || id;
    
    console.log('🔎 [assignUserToTask] taskId extraído:', taskId);
    console.log('🔎 [assignUserToTask] IDs intentados:', { usuario_id, userId, user_id, id });
    console.log('🔎 [assignUserToTask] finalUserId seleccionado:', finalUserId);
    
    if (!taskId || !finalUserId) {
      console.log('❌ [assignUserToTask] Faltan parámetros');
      return res.status(400).json({ 
        success: false, 
        message: 'ID de tarea y usuario son requeridos',
        received: { taskId, finalUserId, body: req.body }
      });
    }
    
    // Verificar que la tarea existe
    console.log('🔎 [assignUserToTask] Verificando tarea...');
    const [task] = await TaskModel.getTaskById(taskId);
    if (!task) {
      console.log('❌ [assignUserToTask] Tarea no encontrada:', taskId);
      return res.status(404).json({ 
        success: false, 
        message: 'Tarea no encontrada' 
      });
    }
    console.log('✅ [assignUserToTask] Tarea encontrada:', task.titulo);
    
    // Verificar que el usuario existe
    console.log('🔎 [assignUserToTask] Verificando usuario...');
    const userCheck = await db.query('SELECT id FROM taskmanagementsystem.usuarios WHERE id = ?', [finalUserId]);
    if (!userCheck[0] || userCheck[0].length === 0) {
      console.log('❌ [assignUserToTask] Usuario no encontrado:', finalUserId);
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    console.log('✅ [assignUserToTask] Usuario encontrado');
    
    // Verificar si ya está asignado
    console.log('🔎 [assignUserToTask] Verificando asignación existente...');
    const existingUsers = await TaskModel.getTaskUsers(taskId);
    const isAlreadyAssigned = existingUsers.some(user => user.id === parseInt(finalUserId));
    
    if (isAlreadyAssigned) {
      console.log('⚠️ [assignUserToTask] Usuario ya asignado');
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario ya está asignado a esta tarea' 
      });
    }
    
    // Asignar usuario usando el modelo
    console.log('🔎 [assignUserToTask] Asignando usuario...');
    await TaskModel.assignUserToTask(taskId, finalUserId);
    console.log('✅ [assignUserToTask] Usuario asignado exitosamente');
    
    res.status(201).json({
      success: true,
      message: 'Usuario asignado a la tarea exitosamente'
    });
  } catch (error) {
    console.error('❌ [assignUserToTask] Error:', error);
    console.error('❌ [assignUserToTask] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al asignar usuario a la tarea: ' + error.message
    });
  }
};

  
/**
 * Elimina la asignación de un usuario de una tarea
 */
exports.removeUserFromTask = async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const userId = req.params.userId;
      
      // Verificar que la tarea existe
      const [task] = await TaskModel.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ 
          success: false, 
          message: 'Tarea no encontrada' 
        });
      }
      
      // Eliminar la asignación
      const result = await TaskModel.removeUserFromTask(taskId, userId);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'El usuario no está asignado a esta tarea'
        });
      }
      
      return res.json({
        success: true,
        message: 'Usuario eliminado de la tarea con éxito'
      });
    } catch (error) {
      console.error('Error al eliminar usuario de la tarea:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar usuario de la tarea',
        error: error.message
      });
    }
};
  
/**
 * Actualiza todos los usuarios asignados a una tarea
 */
exports.updateTaskUsers = async (req, res) => {
    try {
      const taskId = req.params.id;
      const { userIds } = req.body;
      
      if (!Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          message: 'El campo userIds debe ser un array'
        });
      }
      
      // Verificar que la tarea existe
      const [task] = await TaskModel.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ 
          success: false, 
          message: 'Tarea no encontrada' 
        });
      }
      
      // Actualizar usuarios
      await TaskModel.updateTaskUsers(taskId, userIds);
      
      // Obtener la lista actualizada de usuarios
      const updatedUsers = await TaskModel.getTaskUsers(taskId);
      
      // Obtener nombre del proyecto
      const projectId = task.id_proyecto;
      const [projectInfo] = await db.query('SELECT nombre FROM taskmanagementsystem.Proyectos WHERE id = ?', [projectId]);
      const nombreProyecto = projectInfo.length > 0 ? projectInfo[0].nombre : null;
      
      // Registrar el evento en la bitácora
      await logEvento({
        tipo_evento: 'ACTUALIZACIÓN',
        descripcion: `Usuarios de la tarea actualizados: ${task.titulo}`,
        id_usuario: req.user.id,
        nombre_usuario: req.user.nombre,
        id_proyecto: projectId,
        nombre_proyecto: nombreProyecto,
        id_tarea: taskId,
        nombre_tarea: task.titulo,
        id_subtarea: null,
        nombre_subtarea: null
      });
      
      return res.json({
        success: true,
        message: 'Usuarios de la tarea actualizados con éxito',
        data: updatedUsers
      });
    } catch (error) {
      console.error('Error al actualizar usuarios de la tarea:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar usuarios de la tarea',
        error: error.message
      });
    }
};