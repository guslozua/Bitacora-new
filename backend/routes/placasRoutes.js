// routes/placasRoutes.js
const express = require('express');
const router = express.Router();
const placasController = require('../controllers/placasController');

// Rutas para operaciones CRUD de placas
router.get('/list', placasController.getPlacas);
router.get('/stats', placasController.getPlacasStats);
router.get('/:id', placasController.getPlacaById);
router.post('/', placasController.createPlaca);
router.put('/:id', placasController.updatePlaca);
router.delete('/:id', placasController.deletePlaca);

module.exports = router;