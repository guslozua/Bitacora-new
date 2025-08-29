// backend/routes/diagnosticsRoutes.js
const express = require('express');
const router = express.Router();
const DiagnosticsController = require('../controllers/diagnosticsController');

// CAMBIAR ESTA LÍNEA:
// const { authenticateToken } = require('../middleware/authMiddleware');
// POR ESTA:
const authenticateToken = require('../middleware/authMiddleware');

const checkPermission = require('../middleware/roleMiddleware');

// Middleware: solo administradores pueden acceder
router.use(authenticateToken);
router.use(checkPermission(['admin', 'Admin', 'SuperAdmin'])); // Nota: array de roles

// Rutas de diagnósticos - CORREGIDAS PARA COINCIDIR CON EL CONTROLADOR
router.get('/health', DiagnosticsController.healthCheck);
router.get('/database', DiagnosticsController.testDatabaseConnection); // Simplificado
router.get('/database/performance', DiagnosticsController.testDatabasePerformance); // Nueva ruta de rendimiento
router.get('/apis', DiagnosticsController.testInternalAPIs); // Simplificado
router.get('/system', DiagnosticsController.getSystemInfo); // Simplificado
router.get('/external-services', DiagnosticsController.testExternalServices);
router.get('/filesystem', DiagnosticsController.testFileSystem);
router.get('/logs', DiagnosticsController.getLogs);

// Ruta para ejecutar todas las pruebas
router.get('/all', DiagnosticsController.runAllTests);

module.exports = router;