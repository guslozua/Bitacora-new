// routes/informes.routes.js
const express = require('express');
const router = express.Router();
const informesController = require('../controllers/informes.controller');

// Rutas para obtener informes
router.get('/incidentes', informesController.getInformeIncidentes);
router.get('/guardias', informesController.getInformeGuardias);
router.get('/liquidaciones', informesController.getInformeLiquidaciones);
router.get('/resumen', informesController.getInformeResumen);

// Rutas para exportar informes
router.get('/incidentes/exportar/:formato', informesController.exportarInformeIncidentes);
router.get('/guardias/exportar/:formato', informesController.exportarInformeGuardias);
router.get('/liquidaciones/exportar/:formato', informesController.exportarInformeLiquidaciones);

module.exports = router;