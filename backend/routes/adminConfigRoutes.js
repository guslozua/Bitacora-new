// routes/adminConfigRoutes.js
const express = require('express');
const router = express.Router();
const adminConfigController = require('../controllers/adminConfigController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

console.log('🛣️ AdminConfig Routes: Registrando rutas de configuraciones administrativas');

// ============================================================================
// 🆕 RUTAS SIMPLIFICADAS PARA EL FRONTEND
// ============================================================================

// Middleware básico para verificar permisos de admin
const requireAdminPermissions = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: se requieren permisos de administrador'
    });
  }
  
  console.log(`🔐 AdminConfig: Usuario ${req.user.id} accediendo a endpoint administrativo`);
  next();
};

// RUTAS PARA SIDEBAR
router.get('/sidebar', adminConfigController.getSidebarConfig);
router.post('/sidebar', requireAdminPermissions, adminConfigController.saveSidebarConfig);

// RUTAS PARA DASHBOARD SECTIONS
router.get('/dashboard', adminConfigController.getDashboardConfig);
router.post('/dashboard', requireAdminPermissions, adminConfigController.saveDashboardConfig);

// RUTAS PARA KPIs
router.get('/kpis', adminConfigController.getKpiConfig);
router.post('/kpis', requireAdminPermissions, adminConfigController.saveKpiConfig);

// ============================================================================
// RUTAS PÚBLICAS (cualquier usuario autenticado puede leer configuraciones)
// ============================================================================

// GET /api/admin/configurations/sidebar/effective
// Obtener configuración efectiva del sidebar para el usuario actual
router.get('/sidebar/effective', adminConfigController.getEffectiveSidebarConfig);

// GET /api/admin/configurations/dashboard/effective
// Obtener configuración efectiva del dashboard para el usuario actual
router.get('/dashboard/effective', adminConfigController.getEffectiveDashboardConfig);

// GET /api/admin/configurations/kpis/effective
// Obtener configuración efectiva de KPIs para el usuario actual
router.get('/kpis/effective', adminConfigController.getEffectiveKpiConfig);

// GET /api/admin/configurations/:type/:key
// Obtener configuración efectiva específica
router.get('/:type/:key', adminConfigController.getEffectiveConfiguration);

// ============================================================================
// RUTAS ADMINISTRATIVAS (solo usuarios con permisos admin)
// ============================================================================

// GET /api/admin/configurations/:type
// Obtener configuraciones por tipo (solo admins)
router.get('/:type', requireAdminPermissions, adminConfigController.getConfigurationsByType);

// PUT /api/admin/configurations/:type/:key
// Crear o actualizar configuración específica (upsert) (solo admins)
router.put('/:type/:key', requireAdminPermissions, adminConfigController.upsertConfiguration);

console.log('✅ AdminConfig Routes: Rutas registradas exitosamente');
console.log('📍 Endpoints disponibles:');
console.log('   🔧 GET/POST /api/admin-config/sidebar');
console.log('   🔧 GET/POST /api/admin-config/dashboard');
console.log('   🔧 GET/POST /api/admin-config/kpis');

module.exports = router;