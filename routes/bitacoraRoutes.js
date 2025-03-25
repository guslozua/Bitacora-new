const express = require('express');
const router = express.Router();
const { obtenerBitacora, registrarEvento } = require('../controllers/bitacoraController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta protegida para obtener la bitácora con filtros opcionales
router.get('/', authMiddleware, obtenerBitacora);

// Ruta para registrar un nuevo evento en la bitácora
router.post('/', authMiddleware, registrarEvento);

module.exports = router;