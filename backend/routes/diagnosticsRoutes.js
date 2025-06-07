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

// Rutas de diagnósticos
router.get('/health', DiagnosticsController.healthCheck);
router.get('/database/connection', DiagnosticsController.testDatabaseConnection);
router.get('/database/performance', DiagnosticsController.testDatabasePerformance);
router.get('/apis/internal', DiagnosticsController.testInternalAPIs);
router.get('/system/info', DiagnosticsController.getSystemInfo);
router.get('/services/external', DiagnosticsController.testExternalServices);
router.get('/filesystem', DiagnosticsController.testFileSystem);
router.get('/logs', DiagnosticsController.getLogs);

module.exports = router;