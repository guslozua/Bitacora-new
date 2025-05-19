// routes/codigos.routes.js
const express = require('express');
const router = express.Router();
const codigosController = require('../controllers/codigos.controller');

// Rutas para códigos de facturación
router.get('/', codigosController.getCodigos);
router.get('/aplicables', codigosController.getCodigosAplicables);
router.get('/:id', codigosController.getCodigoById);
router.post('/', codigosController.createCodigo);
router.put('/:id', codigosController.updateCodigo);
router.patch('/:id/deactivate', codigosController.deactivateCodigo);
router.delete('/:id', codigosController.deleteCodigo);

module.exports = router;