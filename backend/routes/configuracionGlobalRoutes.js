// routes/configuracionGlobalRoutes.js
const express = require('express');
const { check } = require('express-validator');
const {
  getConfiguracionesByTipo,
  getConfiguracionByTipoYClave,
  createConfiguracion,
  updateConfiguracion,
  deleteConfiguracion,
  getConfiguracionesUsuario,
  resetConfiguraciones,
  aplicarConfiguracionGlobal
} = require('../controllers/configuracionGlobalController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// MIDDLEWARE DE DEPURACIÓN
router.use((req, res, next) => {
  console.log(`🔧 [ConfigGlobal] ${req.method} ${req.path}`);
  console.log(`👤 Usuario: ${req.user ? req.user.nombre : 'No autenticado'}`);
  next();
});

// ============================================================================
// RUTAS PÚBLICAS (CON AUTENTICACIÓN BÁSICA)
// ============================================================================

// Obtener todas las configuraciones del usuario autenticado
router.get('/usuario', authMiddleware, getConfiguracionesUsuario);

// Obtener configuraciones por tipo específico
router.get('/tipo/:tipo', authMiddleware, getConfiguracionesByTipo);

// Obtener configuración específica por tipo y clave
router.get('/tipo/:tipo/clave/:clave', authMiddleware, getConfiguracionByTipoYClave);

// ============================================================================
// RUTAS RESTRINGIDAS SOLO PARA SUPERADMIN
// ============================================================================

// Ruta de prueba para verificar que las configuraciones globales funcionan
router.get('/test', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de configuraciones globales funcionando',
    user: {
      id: req.user.id,
      nombre: req.user.nombre,
      roles: req.user.roles
    },
    timestamp: new Date().toISOString()
  });
});

// Aplicar configuración local como global (método simplificado)
router.post('/aplicar-global', 
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  [
    check('tipo_configuracion')
      .isIn(['sidebar', 'dashboard_sections', 'dashboard_kpis'])
      .withMessage('Tipo de configuración inválido'),
    check('configuracion_local')
      .notEmpty()
      .withMessage('La configuración local es requerida')
  ],
  aplicarConfiguracionGlobal
);

// Crear nueva configuración global
router.post('/',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  [
    check('tipo_configuracion')
      .isIn(['sidebar', 'dashboard_sections', 'dashboard_kpis'])
      .withMessage('Tipo de configuración debe ser: sidebar, dashboard_sections o dashboard_kpis'),
    check('clave')
      .isLength({ min: 1, max: 100 })
      .withMessage('La clave debe tener entre 1 y 100 caracteres'),
    check('valor')
      .notEmpty()
      .withMessage('El valor es requerido'),
    check('descripcion')
      .optional()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    check('orden')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El orden debe ser un número entero positivo')
  ],
  createConfiguracion
);

// Actualizar configuración existente
router.put('/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  [
    check('id')
      .isInt({ min: 1 })
      .withMessage('ID debe ser un número entero positivo'),
    check('valor')
      .optional()
      .notEmpty()
      .withMessage('El valor no puede estar vacío'),
    check('descripcion')
      .optional()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    check('orden')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El orden debe ser un número entero positivo'),
    check('activo')
      .optional()
      .isBoolean()
      .withMessage('El campo activo debe ser verdadero o falso')
  ],
  updateConfiguracion
);

// Eliminar configuración (desactivar)
router.delete('/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  [
    check('id')
      .isInt({ min: 1 })
      .withMessage('ID debe ser un número entero positivo')
  ],
  deleteConfiguracion
);

// Resetear configuraciones de un tipo a valores por defecto
router.post('/reset/:tipo',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  [
    check('tipo')
      .isIn(['sidebar', 'dashboard_sections', 'dashboard_kpis'])
      .withMessage('Tipo de configuración inválido')
  ],
  resetConfiguraciones
);

// ============================================================================
// RUTAS DE UTILIDAD Y DEBUG (SOLO EN DESARROLLO)
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  // Ruta para obtener todas las configuraciones (solo desarrollo)
  router.get('/debug/all', authMiddleware, roleMiddleware(['SuperAdmin']), async (req, res) => {
    try {
      const ConfiguracionGlobalModel = require('../models/ConfiguracionGlobalModel');
      
      const sidebar = await ConfiguracionGlobalModel.obtenerConfiguracionesPorTipo('sidebar');
      const dashboard_sections = await ConfiguracionGlobalModel.obtenerConfiguracionesPorTipo('dashboard_sections');
      const dashboard_kpis = await ConfiguracionGlobalModel.obtenerConfiguracionesPorTipo('dashboard_kpis');
      
      res.json({
        success: true,
        data: {
          sidebar,
          dashboard_sections,
          dashboard_kpis
        },
        message: 'Debug: Todas las configuraciones obtenidas'
      });
    } catch (error) {
      console.error('❌ Error en debug/all:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });

  // Ruta para limpiar todas las configuraciones (solo desarrollo)
  router.delete('/debug/clear-all', authMiddleware, roleMiddleware(['SuperAdmin']), async (req, res) => {
    try {
      const db = require('../config/db');
      
      await db.query('UPDATE configuraciones_globales SET activo = 0');
      
      res.json({
        success: true,
        message: 'Debug: Todas las configuraciones han sido desactivadas'
      });
    } catch (error) {
      console.error('❌ Error en debug/clear-all:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });
}

// ============================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================================================

router.use((error, req, res, next) => {
  console.error('❌ Error en configuracionGlobalRoutes:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;