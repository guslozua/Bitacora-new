// models/TaskModel.js
const pool = require('../config/db');

const TaskModel = {
    createTask: async (titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado) => {
        const sql = 'INSERT INTO taskmanagementsystem.Tareas (titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado]);
        return result;
    },
    
    getAllTasks: async () => {
        const sql = 'SELECT * FROM taskmanagementsystem.Tareas';
        const [rows] = await pool.query(sql);
        return rows;
    },
    
    getTasksByFilter: async (sql, params) => {
        const [rows] = await pool.query(sql, params);
        return rows;
    },
    
    getTaskById: async (id) => {
        const sql = 'SELECT * FROM taskmanagementsystem.Tareas WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        return rows;
    },
    
    updateTask: async (id, titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_usuario_asignado) => {
        const sql = 'UPDATE taskmanagementsystem.Tareas SET titulo = ?, descripcion = ?, estado = ?, prioridad = ?, fecha_inicio = ?, fecha_vencimiento = ?, id_usuario_asignado = ? WHERE id = ?';
        const [result] = await pool.query(sql, [titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_usuario_asignado, id]);
        return result;
    },
    
    deleteTask: async (id) => {
        const sql = 'DELETE FROM taskmanagementsystem.Tareas WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result;
    },

    // Nuevos métodos para gestionar usuarios asignados a tareas
    getTaskUsers: async (taskId) => {
        const query = `
          SELECT tu.id, tu.id_tarea, tu.id_usuario, tu.fecha_asignacion, 
                 u.nombre, u.email
          FROM taskmanagementsystem.tarea_usuarios tu
          JOIN taskmanagementsystem.usuarios u ON tu.id_usuario = u.id
          WHERE tu.id_tarea = ?
          ORDER BY u.nombre
        `;
        
        const users = await pool.query(query, [taskId]);
        return users[0];
    },
    
    assignUserToTask: async (taskId, userId) => {
        try {
          console.log(`[TaskModel] Asignando usuario ${userId} a tarea ${taskId}`);
          
          // Para SQL Server, primero verificamos si existe
          const checkQuery = `
            SELECT COUNT(*) as count 
            FROM taskmanagementsystem.tarea_usuarios 
            WHERE id_tarea = ? AND id_usuario = ?
          `;
          
          const existing = await pool.query(checkQuery, [taskId, userId]);
          const userExists = existing[0] && existing[0].length > 0 && existing[0][0].count > 0;
          
          if (userExists) {
            // Actualizar fecha si ya existe
            const updateQuery = `
              UPDATE taskmanagementsystem.tarea_usuarios 
              SET fecha_asignacion = GETDATE() 
              WHERE id_tarea = ? AND id_usuario = ?
            `;
            const result = await pool.query(updateQuery, [taskId, userId]);
            console.log(`[TaskModel] Usuario ${userId} actualizado en tarea ${taskId}`);
            return {
              affectedRows: result[0] ? result[0].affectedRows : 1,
              action: 'updated'
            };
          } else {
            // Insertar nuevo registro
            const insertQuery = `
              INSERT INTO taskmanagementsystem.tarea_usuarios (id_tarea, id_usuario, fecha_asignacion)
              VALUES (?, ?, GETDATE())
            `;
            const result = await pool.query(insertQuery, [taskId, userId]);
            console.log(`[TaskModel] Usuario ${userId} insertado en tarea ${taskId}`);
            return {
              affectedRows: result[0] ? result[0].affectedRows : 1,
              action: 'inserted'
            };
          }
        } catch (error) {
          console.error('[TaskModel] Error al asignar usuario a la tarea:', error);
          throw error;
        }
    },
    
    removeUserFromTask: async (taskId, userId) => {
        try {
          console.log(`[TaskModel] Eliminando usuario ${userId} de tarea ${taskId}`);
          
          const query = `
            DELETE FROM taskmanagementsystem.tarea_usuarios
            WHERE id_tarea = ? AND id_usuario = ?
          `;
          
          const result = await pool.query(query, [taskId, userId]);
          console.log(`[TaskModel] Usuario ${userId} eliminado de tarea ${taskId}`);
          
          return {
            affectedRows: result[0] ? result[0].affectedRows : 0
          };
        } catch (error) {
          console.error('[TaskModel] Error al eliminar usuario de la tarea:', error);
          throw error;
        }
    },
    
    updateTaskUsers: async (taskId, userIds) => {
        const connection = await pool.getConnection();
        
        try {
          await connection.beginTransaction();
          
          // Eliminar asignaciones existentes
          await connection.query('DELETE FROM taskmanagementsystem.tarea_usuarios WHERE id_tarea = ?', [taskId]);
          
          // Crear nuevas asignaciones
          if (userIds && userIds.length > 0) {
            for (const userId of userIds) {
              await connection.query(
                'INSERT INTO taskmanagementsystem.tarea_usuarios (id_tarea, id_usuario) VALUES (?, ?)', 
                [taskId, userId]
              );
            }
          }
          
          await connection.commit();
          return { success: true };
        } catch (error) {
          await connection.rollback();
          console.error('Error al actualizar usuarios de la tarea:', error);
          throw error;
        } finally {
          connection.release();
        }
    }
};

module.exports = TaskModel;