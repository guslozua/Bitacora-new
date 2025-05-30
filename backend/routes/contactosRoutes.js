// =============================================
// RUTAS COMPLETAS: contactosRoutes.js
// =============================================

const express = require('express');
const router = express.Router();
const ContactosController = require('../controllers/contactosController');
const authMiddleware = require('../middleware/authMiddleware');

// ===============================
// RUTAS PÚBLICAS (SOLO LECTURA)
// ===============================

// Obtener todos los equipos con sus integrantes y sistemas
router.get('/equipos', ContactosController.getAllEquipos);

// Obtener un equipo específico
router.get('/equipos/:id', ContactosController.getEquipoById);

// Obtener todos los integrantes
router.get('/integrantes', ContactosController.getAllIntegrantes);

// Obtener todos los sistemas
router.get('/sistemas', ContactosController.getAllSistemas);

// Simulador de respuesta a incidentes
router.get('/simulador/:sistemaId', ContactosController.simularRespuesta);

// Búsqueda general de contactos
router.get('/buscar', ContactosController.buscarContactos);

// Historial de contactos (lectura)
router.get('/historial', ContactosController.getHistorialContactos);

// ===============================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// ===============================

// === EQUIPOS ===
// Crear nuevo equipo
router.post('/equipos', authMiddleware, ContactosController.createEquipo);

// Actualizar equipo
router.put('/equipos/:id', authMiddleware, ContactosController.updateEquipo);

// Eliminar equipo
router.delete('/equipos/:id', authMiddleware, ContactosController.deleteEquipo);

// === INTEGRANTES ===
// Crear nuevo integrante
router.post('/integrantes', authMiddleware, ContactosController.createIntegrante);

// Actualizar integrante
router.put('/integrantes/:id', authMiddleware, ContactosController.updateIntegrante);

// ✅ NUEVO: Eliminar integrante
router.delete('/integrantes/:id', authMiddleware, ContactosController.deleteIntegrante);

// === SISTEMAS ===
// Crear nuevo sistema
router.post('/sistemas', authMiddleware, ContactosController.createSistema);

// ✅ NUEVO: Actualizar sistema
router.put('/sistemas/:id', authMiddleware, ContactosController.updateSistema);

// ✅ NUEVO: Eliminar sistema
router.delete('/sistemas/:id', authMiddleware, ContactosController.deleteSistema);

// === HISTORIAL ===
// Registrar contacto en historial
router.post('/historial', authMiddleware, ContactosController.registrarContacto);

// ===============================
// RUTAS DE ASIGNACIÓN
// ===============================

// ✅ NUEVO: Asignar integrantes a equipo
router.post('/equipos/:id/integrantes', authMiddleware, ContactosController.asignarIntegrantes);

// ✅ NUEVO: Asignar sistemas a equipo
router.post('/equipos/:id/sistemas', authMiddleware, ContactosController.asignarSistemas);

// ✅ NUEVO: Asignar equipos a sistema
router.post('/sistemas/:id/equipos', authMiddleware, ContactosController.asignarEquipos);

// ===============================
// RUTAS ADICIONALES (OPCIONALES)
// ===============================

// Obtener estadísticas generales
router.get('/stats', (req, res) => {
  // Esta ruta podría implementarse para obtener estadísticas
  res.json({
    success: true,
    message: 'Endpoint de estadísticas - por implementar',
    data: {
      total_equipos: 0,
      total_integrantes: 0,
      total_sistemas: 0
    }
  });
});

// Verificar estado de salud del módulo
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo de contactos funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ===============================
// EXPORTAR ROUTER
// ===============================

module.exports = router;