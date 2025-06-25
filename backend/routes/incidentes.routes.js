// routes/incidentes.routes.js
const express = require('express');
const router = express.Router();
const incidentesController = require('../controllers/incidentes.controller');

// Rutas básicas de incidentes
router.get('/', incidentesController.getIncidentes);
router.get('/:id', incidentesController.getIncidenteById);
router.post('/', incidentesController.createIncidente);
router.put('/:id', incidentesController.updateIncidente);
router.delete('/:id', incidentesController.deleteIncidente);

// Rutas específicas de workflow y estados
router.patch('/:id/estado', incidentesController.cambiarEstadoIncidente);
router.get('/:id/historial', incidentesController.getHistorialEstados);

// Rutas de consultas específicas
router.get('/guardia/:id_guardia', incidentesController.getIncidentesByGuardia);
router.post('/guardias/resumen', incidentesController.getResumenIncidentesGuardias);


// Rutas de estadísticas y reportes
router.get('/estadisticas/estados', incidentesController.getEstadisticasEstados);

router.get('/stats', incidentesController.getIncidentesStats);

module.exports = router;