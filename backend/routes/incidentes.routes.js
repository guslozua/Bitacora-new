// routes/incidentes.routes.js
const express = require('express');
const router = express.Router();
const incidentesController = require('../controllers/incidentes.controller');

// Rutas para incidentes
router.get('/', incidentesController.getIncidentes);
router.get('/:id', incidentesController.getIncidenteById);
router.post('/', incidentesController.createIncidente);
router.put('/:id', incidentesController.updateIncidente);
router.delete('/:id', incidentesController.deleteIncidente);
router.patch('/:id/estado', incidentesController.cambiarEstadoIncidente);
router.get('/guardia/:id_guardia', incidentesController.getIncidentesByGuardia);

module.exports = router;