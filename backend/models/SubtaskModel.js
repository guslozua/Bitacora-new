// models/SubtaskModel.js

const db = require('../config/db');

const SubtaskModel = {
  /**
   * Obtiene información de una subtarea por ID
   * @param {number} subtaskId - ID de la subtarea
   * @returns {Promise<Object[]>} - Información de la subtarea
   */
  getSubtaskById: async (subtaskId) => {
    const query = 'SELECT * FROM subtareas WHERE id = ?';
    const [rows] = await db.query(query, [subtaskId]);
    return rows;
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
      FROM subtarea_usuarios su
      JOIN usuarios u ON su.id_usuario = u.id
      WHERE su.id_subtarea = ?
      ORDER BY u.nombre
    `;
    
    const [users] = await db.query(query, [subtaskId]);
    return users;
  },

  /**
   * Asigna un usuario a una subtarea
   * @param {number} subtaskId - ID de la subtarea
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la operación
   */
  assignUserToSubtask: async (subtaskId, userId) => {
    try {
      const query = `
        INSERT INTO subtarea_usuarios (id_subtarea, id_usuario)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE fecha_asignacion = CURRENT_TIMESTAMP
      `;
      
      const [result] = await db.query(query, [subtaskId, userId]);
      return result;
    } catch (error) {
      console.error('Error al asignar usuario a la subtarea:', error);
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
      const query = `
        DELETE FROM subtarea_usuarios
        WHERE id_subtarea = ? AND id_usuario = ?
      `;
      
      const [result] = await db.query(query, [subtaskId, userId]);
      return result;
    } catch (error) {
      console.error('Error al eliminar usuario de la subtarea:', error);
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
      await connection.query('DELETE FROM subtarea_usuarios WHERE id_subtarea = ?', [subtaskId]);
      
      // Crear nuevas asignaciones
      if (userIds && userIds.length > 0) {
        const values = userIds.map(userId => [subtaskId, userId]);
        await connection.query(
          'INSERT INTO subtarea_usuarios (id_subtarea, id_usuario) VALUES ?', 
          [values]
        );
      }
      
      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar usuarios de la subtarea:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = SubtaskModel;