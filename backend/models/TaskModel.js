// models/TaskModel.js
const pool = require('../config/db');

const TaskModel = {
    createTask: async (titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado) => {
        const sql = 'INSERT INTO Tareas (titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_proyecto, id_usuario_asignado]);
        return result;
    },
    
    getAllTasks: async () => {
        const sql = 'SELECT * FROM Tareas';
        const [rows] = await pool.query(sql);
        return rows;
    },
    
    getTasksByFilter: async (sql, params) => {
        const [rows] = await pool.query(sql, params);
        return rows;
    },
    
    getTaskById: async (id) => {
        const sql = 'SELECT * FROM Tareas WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        return rows;
    },
    
    updateTask: async (id, titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_usuario_asignado) => {
        const sql = 'UPDATE Tareas SET titulo = ?, descripcion = ?, estado = ?, prioridad = ?, fecha_inicio = ?, fecha_vencimiento = ?, id_usuario_asignado = ? WHERE id = ?';
        const [result] = await pool.query(sql, [titulo, descripcion, estado, prioridad, fecha_inicio, fecha_vencimiento, id_usuario_asignado, id]);
        return result;
    },
    
    deleteTask: async (id) => {
        const sql = 'DELETE FROM Tareas WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result;
    },

    // Nuevos métodos para gestionar usuarios asignados a tareas
    getTaskUsers: async (taskId) => {
        const query = `
          SELECT tu.id, tu.id_tarea, tu.id_usuario, tu.fecha_asignacion, 
                 u.nombre, u.email
          FROM tarea_usuarios tu
          JOIN usuarios u ON tu.id_usuario = u.id
          WHERE tu.id_tarea = ?
          ORDER BY u.nombre
        `;
        
        const [users] = await pool.query(query, [taskId]);
        return users;
    },
    
    assignUserToTask: async (taskId, userId) => {
        try {
          const query = `
            INSERT INTO tarea_usuarios (id_tarea, id_usuario)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE fecha_asignacion = CURRENT_TIMESTAMP
          `;
          
          const [result] = await pool.query(query, [taskId, userId]);
          return result;
        } catch (error) {
          console.error('Error al asignar usuario a la tarea:', error);
          throw error;
        }
    },
    
    removeUserFromTask: async (taskId, userId) => {
        try {
          const query = `
            DELETE FROM tarea_usuarios
            WHERE id_tarea = ? AND id_usuario = ?
          `;
          
          const [result] = await pool.query(query, [taskId, userId]);
          return result;
        } catch (error) {
          console.error('Error al eliminar usuario de la tarea:', error);
          throw error;
        }
    },
    
    updateTaskUsers: async (taskId, userIds) => {
        const connection = await pool.getConnection();
        
        try {
          await connection.beginTransaction();
          
          // Eliminar asignaciones existentes
          await connection.query('DELETE FROM tarea_usuarios WHERE id_tarea = ?', [taskId]);
          
          // Crear nuevas asignaciones
          if (userIds && userIds.length > 0) {
            const values = userIds.map(userId => [taskId, userId]);
            await connection.query(
              'INSERT INTO tarea_usuarios (id_tarea, id_usuario) VALUES ?', 
              [values]
            );
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