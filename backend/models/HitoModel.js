// models/HitoModel.js - VERSIÓN SIMPLIFICADA PARA SQL SERVER
const db = require('../config/db');

const HitoModel = {
  /**
   * Obtener un hito por ID - MIGRADO A SQL SERVER CON USUARIOS
   * @param {number} id - ID del hito
   * @returns {Promise<Object|null>} - Hito encontrado con usuarios asignados o null
   */
  getHitoById: async (id) => {
    try {
      // Obtener datos básicos del hito
      const hitoResult = await db.query(
        'SELECT * FROM taskmanagementsystem.hitos WHERE id = ?',
        [id]
      );
      
      if (!hitoResult[0] || hitoResult[0].length === 0) {
        return null;
      }

      const hito = hitoResult[0][0];

      // Obtener usuarios asignados al hito con información del usuario
      const usuariosResult = await db.query(
        `SELECT 
           hu.id_usuario, 
           hu.rol, 
           hu.fecha_asignacion,
           u.nombre as usuario_nombre,
           u.email as usuario_email
         FROM taskmanagementsystem.hito_usuarios hu
         LEFT JOIN taskmanagementsystem.usuarios u ON hu.id_usuario = u.id
         WHERE hu.id_hito = ?
         ORDER BY hu.fecha_asignacion`,
        [id]
      );

      // Agregar usuarios al objeto hito
      hito.usuarios = usuariosResult[0] || [];
      
      return hito;
    } catch (error) {
      console.error('❌ Error obteniendo hito por ID:', error);
      throw error;
    }
  },

  /**
   * Obtener todos los hitos con filtros - MIGRADO A SQL SERVER CON USUARIOS
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} - Lista de hitos con usuarios asignados
   */
  getHitos: async (filters = {}) => {
    try {
      // Obtener todos los hitos
      const hitosResult = await db.query(
        'SELECT * FROM taskmanagementsystem.hitos ORDER BY fecha_creacion DESC'
      );
      
      const hitos = hitosResult[0] || [];
      
      // Para cada hito, obtener sus usuarios asignados
      for (let hito of hitos) {
        const usuariosResult = await db.query(
          `SELECT 
             hu.id_usuario, 
             hu.rol, 
             hu.fecha_asignacion,
             u.nombre as usuario_nombre,
             u.email as usuario_email
           FROM taskmanagementsystem.hito_usuarios hu
           LEFT JOIN taskmanagementsystem.usuarios u ON hu.id_usuario = u.id
           WHERE hu.id_hito = ?
           ORDER BY hu.fecha_asignacion`,
          [hito.id]
        );
        
        hito.usuarios = usuariosResult[0] || [];
      }
      
      return hitos;
    } catch (error) {
      console.error('❌ Error obteniendo hitos:', error);
      throw error;
    }
  },

  /**
   * Crear un nuevo hito - MIGRADO A SQL SERVER
   * @param {Object} hitoData - Datos del hito
   * @returns {Promise<Object>} - Resultado de la operación
   */
  createHito: async (hitoData) => {
    try {
      const {
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        impacto,
        id_proyecto_origen
      } = hitoData;

      const query = `
        INSERT INTO taskmanagementsystem.hitos 
        (nombre, fecha_inicio, fecha_fin, descripcion, impacto, id_proyecto_origen, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, GETDATE())
      `;

      const result = await db.query(query, [
        nombre,
        fecha_inicio || null,
        fecha_fin || null,
        descripcion || null,
        impacto || null,
        id_proyecto_origen || null
      ]);

      // El wrapper de db.js maneja insertId correctamente
      return { insertId: result[0].insertId };
    } catch (error) {
      console.error('❌ Error al crear hito:', error);
      throw error;
    }
  },

  /**
   * Actualizar un hito - MIGRADO A SQL SERVER CON MANEJO DE USUARIOS
   * @param {number} id - ID del hito
   * @param {Object} hitoData - Datos del hito
   * @returns {Promise<Object>} - Resultado de la operación
   */
  updateHito: async (id, hitoData) => {
    try {
      const {
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        impacto,
        usuarios = [] // Array de usuarios asignados con sus roles
      } = hitoData;

      // Iniciar transacción para mantener consistencia
      const connection = await db.getConnection();
      const transaction = await connection.beginTransaction();

      try {
        // 1. Actualizar datos básicos del hito
        const updateHitoQuery = `
          UPDATE taskmanagementsystem.hitos 
          SET nombre = ?, fecha_inicio = ?, fecha_fin = ?, descripcion = ?, impacto = ?, fecha_actualizacion = GETDATE()
          WHERE id = ?
        `;

        const hitoUpdateResult = await transaction.query(updateHitoQuery, [
          nombre,
          fecha_inicio || null,
          fecha_fin || null,
          descripcion || null,
          impacto || null,
          id
        ]);

        // Verificar que el hito existe y fue actualizado
        if (hitoUpdateResult[0].affectedRows === 0) {
          await transaction.rollback();
          return { affectedRows: 0 };
        }

        // 2. Eliminar usuarios asignados existentes
        await transaction.query(
          'DELETE FROM taskmanagementsystem.hito_usuarios WHERE id_hito = ?',
          [id]
        );

        // 3. Insertar nuevos usuarios asignados si los hay
        if (usuarios && usuarios.length > 0) {
          for (const usuario of usuarios) {
            const { id_usuario, rol = 'colaborador' } = usuario;
            
            if (id_usuario) {
              await transaction.query(
                `INSERT INTO taskmanagementsystem.hito_usuarios (id_hito, id_usuario, rol, fecha_asignacion) 
                 VALUES (?, ?, ?, GETDATE())`,
                [id, id_usuario, rol]
              );
            }
          }
        }

        // Confirmar transacción
        await transaction.commit();
        console.log(`Hito ${id} actualizado correctamente con ${usuarios.length} usuarios asignados`);
        
        return { affectedRows: 1 };

      } catch (transactionError) {
        // Revertir transacción en caso de error
        await transaction.rollback();
        throw transactionError;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('❌ Error al actualizar hito:', error);
      throw error;
    }
  },

  /**
   * Eliminar un hito - MIGRADO A SQL SERVER
   * @param {number} id - ID del hito
   * @returns {Promise<Object>} - Resultado de la operación
   */
  deleteHito: async (id) => {
    try {
      const result = await db.query(
        'DELETE FROM taskmanagementsystem.hitos WHERE id = ?',
        [id]
      );

      // El wrapper de db.js ahora maneja correctamente affectedRows para DELETE
      return { affectedRows: result[0].affectedRows };
    } catch (error) {
      console.error('❌ Error al eliminar hito:', error);
      throw error;
    }
  }
};

module.exports = HitoModel;
