// =============================================
// RUTAS: announcementsRoutes.js
// Sistema completo de gestión de anuncios dinámicos
// =============================================

const express = require('express');
const router = express.Router();
const AnnouncementsController = require('../controllers/announcementsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ===============================
// RUTAS PÚBLICAS (SOLO LECTURA)
// ===============================

// Obtener anuncios activos para el carrusel (sin autenticación)
router.get('/active', AnnouncementsController.getActiveAnnouncements);

// Registrar clic en un anuncio (sin autenticación)
router.post('/:id/click', AnnouncementsController.incrementClick);

// Verificar estado de salud del módulo
router.get('/health', AnnouncementsController.healthCheck);

// ===============================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// ===============================

// Búsqueda de anuncios (requiere autenticación)
router.get('/search', authMiddleware, AnnouncementsController.searchAnnouncements);

// Obtener estadísticas (requiere autenticación)
router.get('/stats', authMiddleware, AnnouncementsController.getStatistics);

// Obtener anuncios próximos a expirar (requiere autenticación)
router.get('/expiring', authMiddleware, AnnouncementsController.getExpiringAnnouncements);

// ===============================
// RUTAS ADMINISTRATIVAS (REQUIEREN PERMISOS DE ADMIN/EDITOR)
// ===============================

// Obtener todos los anuncios con filtros y paginación
router.get('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'SuperAdmin', 'Editor']), 
  AnnouncementsController.getAllAnnouncements
);

// Crear nuevo anuncio
router.post('/', 
  authMiddleware, 
  roleMiddleware(['Admin', 'SuperAdmin', 'Editor']), 
  AnnouncementsController.createAnnouncement
);

// ===============================
// RUTAS CON PARÁMETROS ID
// ===============================

// Obtener anuncio por ID (requiere autenticación)
router.get('/:id', 
  authMiddleware, 
  AnnouncementsController.getAnnouncementById
);

// Actualizar anuncio existente
router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['Admin', 'SuperAdmin', 'Editor']), 
  AnnouncementsController.updateAnnouncement
);

// Eliminar anuncio (solo Admin y SuperAdmin)
router.delete('/:id', 
  authMiddleware, 
  roleMiddleware(['Admin', 'SuperAdmin']), 
  AnnouncementsController.deleteAnnouncement
);

// Activar/Desactivar anuncio
router.patch('/:id/toggle', 
  authMiddleware, 
  roleMiddleware(['Admin', 'SuperAdmin', 'Editor']), 
  AnnouncementsController.toggleAnnouncementStatus
);

// Actualizar prioridad
router.patch('/:id/priority', 
  authMiddleware, 
  roleMiddleware(['Admin', 'SuperAdmin', 'Editor']), 
  AnnouncementsController.updatePriority
);

// Duplicar anuncio
router.post('/:id/duplicate', 
  authMiddleware, 
  roleMiddleware(['Admin', 'SuperAdmin', 'Editor']), 
  AnnouncementsController.duplicateAnnouncement
);

// ===============================
// MIDDLEWARE DE VALIDACIÓN DE PARÁMETROS
// ===============================

// Middleware para validar que el ID sea un número válido
router.param('id', (req, res, next, id) => {
  const announcementId = parseInt(id);
  
  if (isNaN(announcementId) || announcementId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de anuncio inválido'
    });
  }
  
  req.announcementId = announcementId;
  next();
});

// ===============================
// MIDDLEWARE DE LOGGING
// ===============================

// Middleware para logging de peticiones administrativas
router.use((req, res, next) => {
  // Solo logear operaciones administrativas (no las consultas públicas)
  const isAdminOperation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  const isPublicRoute = req.path === '/active' || req.path.endsWith('/click') || req.path === '/health';
  
  if (isAdminOperation && !isPublicRoute) {
    console.log(`📝 Operación administrativa en anuncios: ${req.method} ${req.path}`, {
      user: req.user?.nombre || 'Anónimo',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
});

// ===============================
// EXPORTAR ROUTER
// ===============================

module.exports = router;