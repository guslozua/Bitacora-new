// routes/notificaciones.routes.js
const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificaciones.controller');

// Rutas para notificaciones
router.get('/usuario/:id_usuario', notificacionesController.getNotificacionesUsuario);
router.get('/usuario/:id_usuario/contador', notificacionesController.getContadorNoLeidas);
router.patch('/:id/leida', notificacionesController.marcarComoLeida);
router.patch('/usuario/:id_usuario/marcar-todas-leidas', notificacionesController.marcarTodasComoLeidas);

module.exports = router;