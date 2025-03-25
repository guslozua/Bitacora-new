//routes/reportRoutes.js
const express = require('express');
const { generatePDFReport, generateExcelReport, getStatistics } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Generar reporte en PDF
router.get('/pdf', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), generatePDFReport);

// Generar reporte en Excel
router.get('/excel', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), generateExcelReport);

// Obtener estadísticas
router.get('/stats', authMiddleware, getStatistics);

module.exports = router;
