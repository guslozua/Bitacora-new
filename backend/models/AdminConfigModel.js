// models/AdminConfigModel.js
const db = require('../config/db');

const AdminConfigModel = {
  // Obtener configuración efectiva (específica del usuario o global)
  getEffectiveConfig: async (configType, configKey, userId = null) => {
    try {
      // Primero buscar configuración específica del usuario
      if (userId) {
        const userConfigSql = `
          SELECT config_value FROM admin_configurations 
          WHERE config_type = ? AND config_key = ? AND user_id = ? AND is_active = 1
          LIMIT 1
        `;
        const [userResults] = await db.query(userConfigSql, [configType, configKey, userId]);
        
        if (userResults.length > 0) {
          return JSON.parse(userResults[0].config_value);
        }
      }
      
      // Si no hay configuración específica, buscar la global
      const globalConfigSql = `
        SELECT config_value FROM admin_configurations 
        WHERE config_type = ? AND config_key = ? AND is_global = 1 AND is_active = 1
        LIMIT 1
      `;
      const [globalResults] = await db.query(globalConfigSql, [configType, configKey]);
      
      if (globalResults.length > 0) {
        return JSON.parse(globalResults[0].config_value);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting effective config:', error);
      throw error;
    }
  },

  // Obtener todas las configuraciones de un tipo específico
  getConfigsByType: async (configType, includeInactive = false) => {
    try {
      const sql = `
        SELECT * FROM admin_configurations 
        WHERE config_type = ? 
        ${includeInactive ? '' : 'AND is_active = 1'}
        ORDER BY is_global DESC, user_id, created_at DESC
      `;
      const [results] = await db.query(sql, [configType]);
      return results.map(config => ({
        ...config,
        config_value: JSON.parse(config.config_value)
      }));
    } catch (error) {
      console.error('Error getting configs by type:', error);
      throw error;
    }
  },

  // Crear nueva configuración
  createConfig: async (configData, createdBy) => {
    try {
      const {
        config_type,
        config_key,
        config_value,
        is_global = 1,
        user_id = null,
        description = null
      } = configData;

      const sql = `
        INSERT INTO admin_configurations 
        (config_type, config_key, config_value, is_global, user_id, created_by, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(sql, [
        config_type,
        config_key,
        JSON.stringify(config_value),
        is_global,
        user_id,
        createdBy,
        description
      ]);

      return result.insertId;
    } catch (error) {
      console.error('Error creating config:', error);
      throw error;
    }
  },

  // Actualizar configuración existente
  updateConfig: async (id, configData) => {
    try {
      const {
        config_value,
        description = null
      } = configData;

      const sql = `
        UPDATE admin_configurations 
        SET config_value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const [result] = await db.query(sql, [
        JSON.stringify(config_value),
        description,
        id
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  },

  // Crear o actualizar configuración (upsert)
  upsertConfig: async (configType, configKey, configValue, userId, createdBy, description = null) => {
    try {
      // Verificar si existe
      const existingSql = `
        SELECT id FROM admin_configurations 
        WHERE config_type = ? AND config_key = ? 
        AND (user_id = ? OR (user_id IS NULL AND ? IS NULL))
        AND is_active = 1
      `;
      
      const [existing] = await db.query(existingSql, [configType, configKey, userId, userId]);
      
      if (existing.length > 0) {
        // Actualizar existente
        return await AdminConfigModel.updateConfig(existing[0].id, {
          config_value: configValue,
          description
        });
      } else {
        // Crear nueva
        return await AdminConfigModel.createConfig({
          config_type: configType,
          config_key: configKey,
          config_value: configValue,
          is_global: userId ? 0 : 1,
          user_id: userId,
          description
        }, createdBy);
      }
    } catch (error) {
      console.error('Error upserting config:', error);
      throw error;
    }
  },

  // Obtener configuración por ID
  getConfigById: async (id) => {
    try {
      const sql = 'SELECT * FROM admin_configurations WHERE id = ?';
      const [results] = await db.query(sql, [id]);
      
      if (results.length > 0) {
        return {
          ...results[0],
          config_value: JSON.parse(results[0].config_value)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting config by id:', error);
      throw error;
    }
  },

  // Activar/desactivar configuración
  toggleConfigStatus: async (id, isActive) => {
    try {
      const sql = `
        UPDATE admin_configurations 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const [result] = await db.query(sql, [isActive ? 1 : 0, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error toggling config status:', error);
      throw error;
    }
  },

  // Eliminar configuración
  deleteConfig: async (id) => {
    try {
      const sql = 'DELETE FROM admin_configurations WHERE id = ?';
      const [result] = await db.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting config:', error);
      throw error;
    }
  }
};

module.exports = AdminConfigModel;