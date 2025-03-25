//controllers/subtaskController.js
const db = require('../config/db');
const logEvento = require('../utils/logEvento');

// Crear subtarea
const createSubtask = async (req, res) => {
    try {
        // Aseguramos que taskId se obtenga correctamente ya sea de params o body
        const taskId = req.params.taskId || req.params.id || req.body.id_tarea;
        
        if (!taskId) {
            return res.status(400).json({ success: false, message: 'ID de tarea no proporcionado' });
        }
        
        const { titulo } = req.body;
        const userId = req.user.id;

        const sqlInsert = 'INSERT INTO Subtareas (titulo, estado, id_tarea) VALUES (?, "pendiente", ?)';
        const [result] = await db.query(sqlInsert, [titulo, taskId]);

        // Obtenemos información del usuario
        const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [userId]);
        const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

        // Obtenemos información de la tarea
        const [tareaInfo] = await db.query('SELECT titulo, id_proyecto FROM Tareas WHERE id = ?', [taskId]);
        let id_proyecto = null;
        let nombreTarea = null;
        
        if (tareaInfo.length > 0) {
            id_proyecto = tareaInfo[0].id_proyecto;
            nombreTarea = tareaInfo[0].titulo;
            
            // Si tenemos id_proyecto, obtenemos su nombre
            if (id_proyecto) {
                const [proyectoInfo] = await db.query('SELECT nombre FROM Proyectos WHERE id = ?', [id_proyecto]);
                var nombreProyecto = proyectoInfo.length > 0 ? proyectoInfo[0].nombre : null;
            }
        }

        // Registramos el evento con todos los datos relacionados
        await logEvento({
            tipo_evento: 'CREACIÓN',
            descripcion: `Subtarea creada: ${titulo}`,
            id_usuario: userId,
            nombre_usuario: nombreUsuario,
            id_proyecto: id_proyecto,
            nombre_proyecto: nombreProyecto,
            id_tarea: taskId,
            nombre_tarea: nombreTarea,
            id_subtarea: result.insertId,
            nombre_subtarea: titulo
        });

        res.status(201).json({ 
            success: true, 
            message: 'Subtarea creada con éxito', 
            id: result.insertId,
            data: { 
                id: result.insertId,
                titulo,
                estado: 'pendiente',
                id_tarea: taskId,
                id_proyecto: id_proyecto
            }
        });
    } catch (error) {
        console.error('Error al crear subtarea:', error);
        res.status(500).json({ success: false, message: 'Error al crear subtarea', error: error.message });
    }
};

// Obtener subtareas de una tarea
const getSubtasksByTaskId = async (req, res) => {
    try {
        // Aseguramos que taskId se obtenga correctamente ya sea de params.taskId o params.id
        const taskId = req.params.taskId || req.params.id;
        
        if (!taskId) {
            return res.status(400).json({ success: false, message: 'ID de tarea no proporcionado' });
        }
        
        const [rows] = await db.query('SELECT * FROM Subtareas WHERE id_tarea = ?', [taskId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener subtareas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener subtareas', error: error.message });
    }
};

// Actualizar subtarea
const updateSubtask = async (req, res) => {
    try {
        const subtaskId = req.params.id;
        const { titulo, estado } = req.body;
        const userId = req.user.id;

        // Obtenemos todos los datos necesarios antes de actualizar
        const [subtareaInfo] = await db.query('SELECT titulo, id_tarea FROM Subtareas WHERE id = ?', [subtaskId]);
        
        if (subtareaInfo.length === 0) {
            return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
        }
        
        const id_tarea = subtareaInfo[0].id_tarea;
        const tituloOriginal = subtareaInfo[0].titulo;
        
        // Obtenemos información del usuario
        const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [userId]);
        const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;
        
        // Obtenemos información de la tarea y proyecto
        const [tareaInfo] = await db.query('SELECT titulo, id_proyecto FROM Tareas WHERE id = ?', [id_tarea]);
        let id_proyecto = null;
        let nombreTarea = null;
        let nombreProyecto = null;
        
        if (tareaInfo.length > 0) {
            id_proyecto = tareaInfo[0].id_proyecto;
            nombreTarea = tareaInfo[0].titulo;
            
            // Si tenemos id_proyecto, obtenemos su nombre
            if (id_proyecto) {
                const [proyectoInfo] = await db.query('SELECT nombre FROM Proyectos WHERE id = ?', [id_proyecto]);
                nombreProyecto = proyectoInfo.length > 0 ? proyectoInfo[0].nombre : null;
            }
        }
        
        // Actualizamos la subtarea
        const sqlUpdate = 'UPDATE Subtareas SET titulo = ?, estado = ? WHERE id = ?';
        const [result] = await db.query(sqlUpdate, [titulo, estado, subtaskId]);

        // Registramos el evento con todos los datos relacionados
        await logEvento({
            tipo_evento: 'ACTUALIZACIÓN',
            descripcion: `Subtarea actualizada: ${titulo} (${estado})`,
            id_usuario: userId,
            nombre_usuario: nombreUsuario,
            id_proyecto: id_proyecto,
            nombre_proyecto: nombreProyecto,
            id_tarea: id_tarea,
            nombre_tarea: nombreTarea,
            id_subtarea: subtaskId,
            nombre_subtarea: titulo
        });

        res.json({ 
            success: true, 
            message: 'Subtarea actualizada correctamente',
            data: {
                id: subtaskId,
                titulo,
                estado,
                id_tarea,
                id_proyecto
            }
        });
    } catch (error) {
        console.error('Error al actualizar subtarea:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar subtarea', error: error.message });
    }
};

// Eliminar subtarea
const deleteSubtask = async (req, res) => {
    try {
        const subtaskId = req.params.id;
        const userId = req.user.id;

        // Obtenemos información del usuario
        const [userInfo] = await db.query('SELECT nombre FROM Usuarios WHERE id = ?', [userId]);
        const nombreUsuario = userInfo.length > 0 ? userInfo[0].nombre : null;

        // Primero obtenemos la información de la subtarea antes de eliminarla
        const [subtareaInfo] = await db.query('SELECT titulo, id_tarea FROM Subtareas WHERE id = ?', [subtaskId]);
        
        if (subtareaInfo.length === 0) {
            return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
        }
        
        const titulo = subtareaInfo[0].titulo || 'Subtarea desconocida';
        const id_tarea = subtareaInfo[0].id_tarea;
        
        // Obtenemos información de la tarea y proyecto
        let id_proyecto = null;
        let nombreTarea = null;
        let nombreProyecto = null;
        
        if (id_tarea) {
            const [tareaInfo] = await db.query('SELECT titulo, id_proyecto FROM Tareas WHERE id = ?', [id_tarea]);
            
            if (tareaInfo.length > 0) {
                id_proyecto = tareaInfo[0].id_proyecto;
                nombreTarea = tareaInfo[0].titulo;
                
                // Si tenemos id_proyecto, obtenemos su nombre
                if (id_proyecto) {
                    const [proyectoInfo] = await db.query('SELECT nombre FROM Proyectos WHERE id = ?', [id_proyecto]);
                    nombreProyecto = proyectoInfo.length > 0 ? proyectoInfo[0].nombre : null;
                }
            }
        }

        // Registramos el evento de eliminación antes de eliminar la subtarea
        await logEvento({
            tipo_evento: 'ELIMINACIÓN',
            descripcion: `Subtarea eliminada: ${titulo}`,
            id_usuario: userId,
            nombre_usuario: nombreUsuario,
            id_proyecto: id_proyecto,
            nombre_proyecto: nombreProyecto,
            id_tarea: id_tarea,
            nombre_tarea: nombreTarea,
            id_subtarea: subtaskId,
            nombre_subtarea: titulo
        });

        // Eliminamos la subtarea
        const sql = 'DELETE FROM Subtareas WHERE id = ?';
        const [result] = await db.query(sql, [subtaskId]);

        res.json({ 
            success: true, 
            message: 'Subtarea eliminada correctamente',
            data: {
                id: subtaskId,
                titulo,
                id_tarea,
                id_proyecto
            }
        });
    } catch (error) {
        console.error("Error en deleteSubtask:", error);
        res.status(500).json({ success: false, message: 'Error eliminando subtarea', error: error.message });
    }
};

module.exports = {
    createSubtask,
    getSubtasksByTaskId,
    updateSubtask,
    deleteSubtask
};