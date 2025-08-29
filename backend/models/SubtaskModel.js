// models/SubtaskModel.js

const db = require('../config/db');

const SubtaskModel = {
  /**
   * Obtiene información de una subtarea por ID
   * @param {number} subtaskId - ID de la subtarea
   * @returns {Promise<Object[]>} - Información de la subtarea
   */
  getSubtaskById: async (subtaskId) => {
    const query = 'SELECT * FROM taskmanagementsystem.subtareas WHERE id = ?';
    const rows = await db.query(query, [subtaskId]);
    return rows[0];
  },

  /**
   * Obtiene los usuarios asignados a una subtarea
   * @param {number} subtaskId - ID de la subtarea
   * @returns {Promise<Object[]>} - Array de objetos de usuario
   */
  getSubtaskUsers: async (subtaskId) => {
    const query = `
      SELECT su.id, su.id_subtarea, su.id_usuario, su.fecha_asignacion, 
             u.nombre, u.email
      FROM taskmanagementsystem.subtarea_usuarios su
      JOIN taskmanagementsystem.usuarios u ON su.id_usuario = u.id
      WHERE su.id_subtarea = ?
      ORDER BY u.nombre
    `;
    
    const users = await db.query(query, [subtaskId]);
    return users[0];
  },

  /**
   * Asigna un usuario a una subtarea
   * @param {number} subtaskId - ID de la subtarea
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la operación
   */
  assignUserToSubtask: async (subtaskId, userId) => {
    try {
      console.log(`[SubtaskModel] Asignando usuario ${userId} a subtarea ${subtaskId}`);
      
      // Verificar si el usuario ya está asignado
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM taskmanagementsystem.subtarea_usuarios 
        WHERE id_subtarea = ? AND id_usuario = ?
      `;
      
      const existingUser = await db.query(checkQuery, [subtaskId, userId]);
      const userExists = existingUser[0] && existingUser[0].length > 0 && existingUser[0][0].count > 0;
      
      if (userExists) {
        // Si existe, actualizar fecha
        const updateQuery = `
          UPDATE taskmanagementsystem.subtarea_usuarios 
          SET fecha_asignacion = GETDATE()
          WHERE id_subtarea = ? AND id_usuario = ?
        `;
        const result = await db.query(updateQuery, [subtaskId, userId]);
        console.log(`[SubtaskModel] Usuario ${userId} actualizado en subtarea ${subtaskId}`);
        return { 
          affectedRows: result[0] ? result[0].affectedRows : 1, 
          action: 'updated' 
        };
      } else {
        // Si no existe, insertar nuevo registro
        const insertQuery = `
          INSERT INTO taskmanagementsystem.subtarea_usuarios 
          (id_subtarea, id_usuario, fecha_asignacion) 
          VALUES (?, ?, GETDATE())
        `;
        const result = await db.query(insertQuery, [subtaskId, userId]);
        console.log(`[SubtaskModel] Usuario ${userId} insertado en subtarea ${subtaskId}`);
        return { 
          affectedRows: result[0] ? result[0].affectedRows : 1, 
          action: 'inserted' 
        };
      }
    } catch (error) {
      console.error('[SubtaskModel] Error al asignar usuario a la subtarea:', error);
      console.error('[SubtaskModel] Error details:', {
        subtaskId,
        userId,
        message: error.message
      });
      throw error;
    }
  },

  /**
   * Elimina la asignación de un usuario a una subtarea
   * @param {number} subtaskId - ID de la subtarea
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la operación
   */
  removeUserFromSubtask: async (subtaskId, userId) => {
    try {
      console.log(`[SubtaskModel] Eliminando usuario ${userId} de subtarea ${subtaskId}`);
      
      const query = `
        DELETE FROM taskmanagementsystem.subtarea_usuarios
        WHERE id_subtarea = ? AND id_usuario = ?
      `;
      
      const result = await db.query(query, [subtaskId, userId]);
      console.log(`[SubtaskModel] Usuario ${userId} eliminado de subtarea ${subtaskId}`);
      
      return { 
        affectedRows: result[0] ? result[0].affectedRows : 0 
      };
    } catch (error) {
      console.error('[SubtaskModel] Error al eliminar usuario de la subtarea:', error);
      throw error;
    }
  },

  /**
   * Actualiza la lista completa de usuarios asignados a una subtarea
   * @param {number} subtaskId - ID de la subtarea
   * @param {number[]} userIds - Array de IDs de usuarios
   * @returns {Promise<Object>} - Resultado de la operación
   */
  updateSubtaskUsers: async (subtaskId, userIds) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Eliminar asignaciones existentes
      await connection.query('DELETE FROM taskmanagementsystem.subtarea_usuarios WHERE id_subtarea = ?', [subtaskId]);
      
      // Crear nuevas asignaciones - SQL Server no soporta INSERT VALUES ?
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          await connection.query(
            'INSERT INTO taskmanagementsystem.subtarea_usuarios (id_subtarea, id_usuario, fecha_asignacion) VALUES (?, ?, GETDATE())', 
            [subtaskId, userId]
          );
        }
      }
      
      await connection.commit();
      console.log(`[SubtaskModel] Usuarios actualizados para subtarea ${subtaskId}`);
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('[SubtaskModel] Error al actualizar usuarios de la subtarea:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = SubtaskModel;