// controllers/configuracionGlobalController.js
const ConfiguracionGlobalModel = require('../models/ConfiguracionGlobalModel');
const { validationResult } = require('express-validator');

const configuracionGlobalController = {

  // Obtener configuraciones por tipo
  getConfiguracionesByTipo: async (req, res) => {
    try {
      const { tipo } = req.params;
      
      // Validar que el tipo sea válido
      const tiposValidos = ['sidebar', 'dashboard_sections', 'dashboard_kpis'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de configuración inválido. Tipos válidos: ${tiposValidos.join(', ')}`
        });
      }

      console.log(`🔍 Solicitando configuraciones del tipo: ${tipo}`);
      
      const configuraciones = await ConfiguracionGlobalModel.obtenerConfiguracionesPorTipo(tipo);
      
      res.json({
        success: true,
        data: configuraciones,
        message: `Configuraciones del tipo ${tipo} obtenidas correctamente`
      });

    } catch (error) {
      console.error('❌ Error en getConfiguracionesByTipo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener configuración específica por tipo y clave
  getConfiguracionByTipoYClave: async (req, res) => {
    try {
      const { tipo, clave } = req.params;
      
      console.log(`🔍 Solicitando configuración: ${tipo} - ${clave}`);
      
      const configuracion = await ConfiguracionGlobalModel.obtenerConfiguracionPorClave(tipo, clave);
      
      if (!configuracion) {
        return res.status(404).json({
          success: false,
          message: `No se encontró configuración del tipo '${tipo}' con clave '${clave}'`
        });
      }
      
      res.json({
        success: true,
        data: configuracion,
        message: 'Configuración obtenida correctamente'
      });

    } catch (error) {
      console.error('❌ Error en getConfiguracionByTipoYClave:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Crear nueva configuración global (solo SuperAdmin)
  createConfiguracion: async (req, res) => {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { tipo_configuracion, clave, valor, descripcion, orden } = req.body;
      const usuario_creacion = req.user.id;

      // Verificar que el usuario sea SuperAdmin
      if (!req.user.roles || !req.user.roles.includes('SuperAdmin')) {
        return res.status(403).json({
          success: false,
          message: 'Solo los SuperAdmin pueden crear configuraciones globales'
        });
      }

      console.log(`👤 SuperAdmin ${req.user.nombre} creando configuración global:`, { tipo_configuracion, clave });

      // Verificar si ya existe la configuración
      const existe = await ConfiguracionGlobalModel.existeConfiguracion(tipo_configuracion, clave);
      if (existe) {
        return res.status(409).json({
          success: false,
          message: `Ya existe una configuración del tipo '${tipo_configuracion}' con la clave '${clave}'`
        });
      }

      const nuevaConfiguracion = await ConfiguracionGlobalModel.crearConfiguracion({
        tipo_configuracion,
        clave,
        valor,
        descripcion,
        usuario_creacion,
        orden
      });

      res.status(201).json({
        success: true,
        data: nuevaConfiguracion,
        message: 'Configuración global creada correctamente'
      });

    } catch (error) {
      console.error('❌ Error en createConfiguracion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Actualizar configuración existente (solo SuperAdmin)
  updateConfiguracion: async (req, res) => {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { valor, descripcion, orden, activo } = req.body;

      // Verificar que el usuario sea SuperAdmin
      if (!req.user.roles || !req.user.roles.includes('SuperAdmin')) {
        return res.status(403).json({
          success: false,
          message: 'Solo los SuperAdmin pueden actualizar configuraciones globales'
        });
      }

      console.log(`👤 SuperAdmin ${req.user.nombre} actualizando configuración ID: ${id}`);

      // Verificar que la configuración existe
      const configuracionExistente = await ConfiguracionGlobalModel.obtenerConfiguracionPorId(id);
      if (!configuracionExistente) {
        return res.status(404).json({
          success: false,
          message: `No se encontró configuración con ID: ${id}`
        });
      }

      const configuracionActualizada = await ConfiguracionGlobalModel.actualizarConfiguracion(id, {
        valor,
        descripcion,
        orden,
        activo
      });

      res.json({
        success: true,
        data: configuracionActualizada,
        message: 'Configuración global actualizada correctamente'
      });

    } catch (error) {
      console.error('❌ Error en updateConfiguracion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Eliminar configuración (solo SuperAdmin)
  deleteConfiguracion: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el usuario sea SuperAdmin
      if (!req.user.roles || !req.user.roles.includes('SuperAdmin')) {
        return res.status(403).json({
          success: false,
          message: 'Solo los SuperAdmin pueden eliminar configuraciones globales'
        });
      }

      console.log(`👤 SuperAdmin ${req.user.nombre} eliminando configuración ID: ${id}`);

      // Verificar que la configuración existe
      const configuracionExistente = await ConfiguracionGlobalModel.obtenerConfiguracionPorId(id);
      if (!configuracionExistente) {
        return res.status(404).json({
          success: false,
          message: `No se encontró configuración con ID: ${id}`
        });
      }

      await ConfiguracionGlobalModel.eliminarConfiguracion(id);

      res.json({
        success: true,
        message: 'Configuración global eliminada correctamente'
      });

    } catch (error) {
      console.error('❌ Error en deleteConfiguracion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtener todas las configuraciones de un usuario (globales + overrides)
  getConfiguracionesUsuario: async (req, res) => {
    try {
      const userId = req.user.id;
      
      console.log(`👤 Obteniendo configuraciones para usuario: ${req.user.nombre} (ID: ${userId})`);
      
      const configuraciones = await ConfiguracionGlobalModel.obtenerConfiguracionesUsuario(userId);
      
      res.json({
        success: true,
        data: configuraciones,
        message: 'Configuraciones de usuario obtenidas correctamente'
      });

    } catch (error) {
      console.error('❌ Error en getConfiguracionesUsuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Resetear configuraciones a valores por defecto (solo SuperAdmin)
  resetConfiguraciones: async (req, res) => {
    try {
      const { tipo } = req.params;
      
      // Verificar que el usuario sea SuperAdmin
      if (!req.user.roles || !req.user.roles.includes('SuperAdmin')) {
        return res.status(403).json({
          success: false,
          message: 'Solo los SuperAdmin pueden resetear configuraciones globales'
        });
      }

      console.log(`👤 SuperAdmin ${req.user.nombre} reseteando configuraciones del tipo: ${tipo}`);
      
      await ConfiguracionGlobalModel.resetearConfiguraciones(tipo, req.user.id);
      
      res.json({
        success: true,
        message: `Configuraciones del tipo '${tipo}' reseteadas correctamente`
      });

    } catch (error) {
      console.error('❌ Error en resetConfiguraciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Aplicar configuración local como global (solo SuperAdmin)
  aplicarConfiguracionGlobal: async (req, res) => {
    try {
      console.log('👍 [DEBUG] Iniciando aplicarConfiguracionGlobal');
      console.log('👍 [DEBUG] req.user:', req.user);
      console.log('👍 [DEBUG] req.body:', req.body);
      
      const { tipo_configuracion, configuracion_local } = req.body;
      
      // Verificar que el usuario sea SuperAdmin
      if (!req.user.roles || !req.user.roles.includes('SuperAdmin')) {
        console.log('❌ [DEBUG] Usuario no es SuperAdmin. Roles:', req.user.roles);
        return res.status(403).json({
          success: false,
          message: 'Solo los SuperAdmin pueden aplicar configuraciones globales'
        });
      }

      console.log(`👤 SuperAdmin ${req.user.nombre} aplicando configuración local como global:`, tipo_configuracion);
      
      const clave = `global_${tipo_configuracion}`;
      const descripcion = `Configuración global de ${tipo_configuracion} aplicada por ${req.user.nombre}`;
      
      console.log('👍 [DEBUG] Verificando si existe configuración:', tipo_configuracion, clave);
      
      // Verificar si ya existe una configuración global de este tipo
      const existe = await ConfiguracionGlobalModel.existeConfiguracion(tipo_configuracion, clave);
      
      console.log('👍 [DEBUG] Configuración existe:', existe);
      
      let resultado;
      
      if (existe) {
        console.log('👍 [DEBUG] Actualizando configuración existente');
        // Actualizar la configuración existente
        const configExistente = await ConfiguracionGlobalModel.obtenerConfiguracionPorClave(tipo_configuracion, clave);
        console.log('👍 [DEBUG] Configuración existente:', configExistente);
        
        resultado = await ConfiguracionGlobalModel.actualizarConfiguracion(configExistente.id, {
          valor: configuracion_local,
          descripcion: descripcion + ' (actualizada)',
          activo: 1
        });
        console.log('👍 [DEBUG] Resultado actualización:', resultado);
      } else {
        console.log('👍 [DEBUG] Creando nueva configuración global');
        // Crear nueva configuración global
        resultado = await ConfiguracionGlobalModel.crearConfiguracion({
          tipo_configuracion,
          clave,
          valor: configuracion_local,
          descripcion,
          usuario_creacion: req.user.id,
          orden: 1
        });
        console.log('👍 [DEBUG] Resultado creación:', resultado);
      }
      
      console.log('👍 [DEBUG] Enviando respuesta exitosa');
      res.json({
        success: true,
        data: resultado,
        message: `Configuración de ${tipo_configuracion} aplicada globalmente`
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error en aplicarConfiguracionGlobal:', error);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

};

module.exports = configuracionGlobalController;