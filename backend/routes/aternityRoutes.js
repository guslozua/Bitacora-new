// routes/aternityRoutes.js
const express = require('express');
const router = express.Router();
const AternityController = require('../controllers/aternityController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Probar conexión con Aternity
router.get('/test-connection', AternityController.testConnection);

// Obtener datos correlacionados VM PIC + Aternity
router.get('/vm-pic-correlation', AternityController.getCorrelatedVMPICData);

// Obtener métricas de rendimiento por call center
router.get('/performance-by-call-center', AternityController.getPerformanceByCallCenter);

module.exports = router;