// routes/liquidaciones.routes.js
const express = require('express');
const router = express.Router();
const liquidacionesController = require('../controllers/liquidaciones.controller');

// Rutas para liquidaciones
router.post('/generar', liquidacionesController.generarLiquidacion);
router.get('/', liquidacionesController.getLiquidaciones);
router.get('/:id', liquidacionesController.getLiquidacionById);
router.patch('/:id/estado', liquidacionesController.cambiarEstadoLiquidacion);

module.exports = router;