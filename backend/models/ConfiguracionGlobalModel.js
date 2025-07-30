// models/ConfiguracionGlobalModel.js
const db = require('../config/db');

const ConfiguracionGlobalModel = {
  
  // Obtener todas las configuraciones de un tipo específico
  obtenerConfiguracionesPorTipo: async (tipo) => {
    try {
      console.log(`📋 Obteniendo configuraciones globales del tipo: ${tipo}`);
      
      const sql = `
        SELECT 
          cg.id,
          cg.tipo_configuracion,
          cg.clave,
          cg.valor,
          cg.activo,
          cg.orden,
          cg.descripcion,
          cg.usuario_creacion,
          cg.fecha_creacion,
          cg.fecha_actualizacion,
          u.nombre as usuario_nombre
        FROM configuraciones_globales cg
        LEFT JOIN usuarios u ON cg.usuario_creacion = u.id
        WHERE cg.tipo_configuracion = ? AND cg.activo = 1
        ORDER BY cg.orden ASC, cg.fecha_creacion ASC
      `;
      
      const [results] = await db.query(sql, [tipo]);
      
      // Parsear valores JSON
      const configuraciones = results.map(config => ({
        ...config,
        valor: typeof config.valor === 'string' ? JSON.parse(config.valor) : config.valor
      }));
      
      console.log(`✅ Encontradas ${configuraciones.length} configuraciones del tipo ${tipo}`);
      return configuraciones;
      
    } catch (error) {
      console.error(`❌ Error obteniendo configuraciones del tipo ${tipo}:`, error);
      throw error;
    }
  },

  // Obtener una configuración específica por tipo y clave
  obtenerConfiguracionPorClave: async (tipo, clave) => {
    try {
      console.log(`🔍 Buscando configuración: ${tipo} - ${clave}`);
      
      const sql = `
        SELECT 
          cg.id,
          cg.tipo_configuracion,
          cg.clave,
          cg.valor,
          cg.activo,
          cg.orden,
          cg.descripcion,
          cg.usuario_creacion,
          cg.fecha_creacion,
          cg.fecha_actualizacion,
          u.nombre as usuario_nombre
        FROM configuraciones_globales cg
        LEFT JOIN usuarios u ON cg.usuario_creacion = u.id
        WHERE cg.tipo_configuracion = ? AND cg.clave = ? AND cg.activo = 1
        LIMIT 1
      `;
      
      const [results] = await db.query(sql, [tipo, clave]);
      
      if (results.length === 0) {
        console.log(`⚠️ No se encontró configuración: ${tipo} - ${clave}`);
        return null;
      }
      
      const config = {
        ...results[0],
        valor: typeof results[0].valor === 'string' ? JSON.parse(results[0].valor) : results[0].valor
      };
      
      console.log(`✅ Configuración encontrada: ${tipo} - ${clave}`);
      return config;
      
    } catch (error) {
      console.error(`❌ Error obteniendo configuración ${tipo} - ${clave}:`, error);
      throw error;
    }
  },

  // Crear una nueva configuración global
  crearConfiguracion: async (datos) => {
    try {
      console.log('📝 Creando nueva configuración global:', datos);
      
      const { tipo_configuracion, clave, valor, descripcion, usuario_creacion, orden = null } = datos;
      
      const sql = `
        INSERT INTO configuraciones_globales 
        (tipo_configuracion, clave, valor, descripcion, usuario_creacion, orden, activo)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `;
      
      const valorJson = typeof valor === 'object' ? JSON.stringify(valor) : valor;
      
      const [result] = await db.query(sql, [
        tipo_configuracion,
        clave,
        valorJson,
        descripcion,
        usuario_creacion,
        orden
      ]);
      
      console.log(`✅ Configuración creada con ID: ${result.insertId}`);
      return {
        id: result.insertId,
        ...datos,
        valor: typeof valor === 'object' ? valor : JSON.parse(valor)
      };
      
    } catch (error) {
      console.error('❌ Error creando configuración global:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Ya existe una configuración del tipo '${datos.tipo_configuracion}' con la clave '${datos.clave}'`);
      }
      
      throw error;
    }
  },

  // Actualizar una configuración existente
  actualizarConfiguracion: async (id, datos) => {
    try {
      console.log(`📝 Actualizando configuración ID: ${id}`, datos);
      
      const { valor, descripcion, orden = null, activo = 1 } = datos;
      
      const sql = `
        UPDATE configuraciones_globales 
        SET valor = ?, descripcion = ?, orden = ?, activo = ?
        WHERE id = ?
      `;
      
      const valorJson = typeof valor === 'object' ? JSON.stringify(valor) : valor;
      
      const [result] = await db.query(sql, [valorJson, descripcion, orden, activo, id]);
      
      if (result.affectedRows === 0) {
        throw new Error(`No se encontró configuración con ID: ${id}`);
      }
      
      console.log(`✅ Configuración ID: ${id} actualizada correctamente`);
      return await ConfiguracionGlobalModel.obtenerConfiguracionPorId(id);
      
    } catch (error) {
      console.error(`❌ Error actualizando configuración ID: ${id}:`, error);
      throw error;
    }
  },

  // Obtener configuración por ID
  obtenerConfiguracionPorId: async (id) => {
    try {
      const sql = `
        SELECT 
          cg.id,
          cg.tipo_configuracion,
          cg.clave,
          cg.valor,
          cg.activo,
          cg.orden,
          cg.descripcion,
          cg.usuario_creacion,
          cg.fecha_creacion,
          cg.fecha_actualizacion,
          u.nombre as usuario_nombre
        FROM configuraciones_globales cg
        LEFT JOIN usuarios u ON cg.usuario_creacion = u.id
        WHERE cg.id = ?
        LIMIT 1
      `;
      
      const [results] = await db.query(sql, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return {
        ...results[0],
        valor: typeof results[0].valor === 'string' ? JSON.parse(results[0].valor) : results[0].valor
      };
      
    } catch (error) {
      console.error(`❌ Error obteniendo configuración por ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar una configuración (soft delete)
  eliminarConfiguracion: async (id) => {
    try {
      console.log(`🗑️ Eliminando configuración ID: ${id}`);
      
      const sql = `
        UPDATE configuraciones_globales 
        SET activo = 0
        WHERE id = ?
      `;
      
      const [result] = await db.query(sql, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error(`No se encontró configuración con ID: ${id}`);
      }
      
      console.log(`✅ Configuración ID: ${id} eliminada (desactivada)`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error eliminando configuración ID: ${id}:`, error);
      throw error;
    }
  },

  // Verificar si existe una configuración
  existeConfiguracion: async (tipo, clave) => {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM configuraciones_globales 
        WHERE tipo_configuracion = ? AND clave = ? AND activo = 1
      `;
      
      const [results] = await db.query(sql, [tipo, clave]);
      return results[0].count > 0;
      
    } catch (error) {
      console.error(`❌ Error verificando existencia de configuración ${tipo} - ${clave}:`, error);
      throw error;
    }
  },

  // Obtener todas las configuraciones para un usuario (combinando globales y overrides)
  obtenerConfiguracionesUsuario: async (userId) => {
    try {
      console.log(`👤 Obteniendo todas las configuraciones para usuario ID: ${userId}`);
      
      // Por ahora solo devolvemos las configuraciones globales
      // En el futuro se podrán agregar los overrides de usuario
      const sql = `
        SELECT 
          cg.id,
          cg.tipo_configuracion,
          cg.clave,
          cg.valor,
          cg.activo,
          cg.orden,
          cg.descripcion,
          cg.fecha_actualizacion
        FROM configuraciones_globales cg
        WHERE cg.activo = 1
        ORDER BY cg.tipo_configuracion, cg.orden ASC, cg.fecha_creacion ASC
      `;
      
      const [results] = await db.query(sql);
      
      // Agrupar por tipo y parsear JSON
      const configuracionesPorTipo = {};
      
      results.forEach(config => {
        if (!configuracionesPorTipo[config.tipo_configuracion]) {
          configuracionesPorTipo[config.tipo_configuracion] = [];
        }
        
        configuracionesPorTipo[config.tipo_configuracion].push({
          ...config,
          valor: typeof config.valor === 'string' ? JSON.parse(config.valor) : config.valor
        });
      });
      
      console.log(`✅ Configuraciones obtenidas para usuario ${userId}:`, Object.keys(configuracionesPorTipo));
      return configuracionesPorTipo;
      
    } catch (error) {
      console.error(`❌ Error obteniendo configuraciones para usuario ${userId}:`, error);
      throw error;
    }
  },

  // Resetear configuraciones a valores por defecto (para desarrollo/testing)
  resetearConfiguraciones: async (tipo, usuarioId) => {
    try {
      console.log(`🔄 Reseteando configuraciones del tipo: ${tipo}`);
      
      // Desactivar configuraciones existentes del tipo
      const sqlDesactivar = `
        UPDATE configuraciones_globales 
        SET activo = 0 
        WHERE tipo_configuracion = ?
      `;
      
      await db.query(sqlDesactivar, [tipo]);
      
      // Aquí podrías insertar configuraciones por defecto según el tipo
      // Por ahora solo desactivamos las existentes
      
      console.log(`✅ Configuraciones del tipo ${tipo} reseteadas`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error reseteando configuraciones del tipo ${tipo}:`, error);
      throw error;
    }
  }

};

module.exports = ConfiguracionGlobalModel;