// routes/tarifas.routes.js - RUTAS DE TARIFAS SIGUIENDO PATRÓN DEL PROYECTO
const express = require('express');
const router = express.Router();
const tarifasController = require('../controllers/tarifas.controller');

// Middleware de autenticación (opcional - descomenta si necesitas autenticación)
// const authMiddleware = require('../middleware/authMiddleware');
// const roleMiddleware = require('../middleware/roleMiddleware');

// ===== RUTAS BÁSICAS CRUD =====

// GET /api/tarifas - Obtener todas las tarifas
router.get('/', tarifasController.getTarifas);

// GET /api/tarifas/:id - Obtener una tarifa por ID
router.get('/:id', tarifasController.getTarifaById);

// POST /api/tarifas - Crear nueva tarifa
router.post('/', tarifasController.createTarifa);

// PUT /api/tarifas/:id - Actualizar tarifa existente
router.put('/:id', tarifasController.updateTarifa);

// PATCH /api/tarifas/:id/deactivate - Desactivar tarifa
router.patch('/:id/deactivate', tarifasController.deactivateTarifa);

// DELETE /api/tarifas/:id - Eliminar tarifa
router.delete('/:id', tarifasController.deleteTarifa);

// ===== RUTAS ESPECIALIZADAS =====

// GET /api/tarifas/vigente?fecha=YYYY-MM-DD - Obtener tarifa vigente para una fecha específica
router.get('/vigente', tarifasController.getTarifaVigente);

// POST /api/tarifas/simular - Simulador de cálculos
router.post('/simular', tarifasController.simularCalculo);

// GET /api/tarifas/analizar-codigos?fecha=X&hora_inicio=X&hora_fin=X - Analizar códigos aplicables
router.get('/analizar-codigos', tarifasController.analizarCodigosAplicables);

// GET /api/tarifas/ejemplos - Obtener ejemplos pre-calculados
router.get('/ejemplos', tarifasController.obtenerEjemplos);

// GET /api/tarifas/estadisticas - Obtener estadísticas de tarifas
router.get('/estadisticas', tarifasController.getEstadisticasTarifas);

// ===== RUTAS CON AUTENTICACIÓN (OPCIONAL) =====
// Descomenta estas líneas si necesitas autenticación para ciertas operaciones

/*
// Rutas que requieren autenticación básica
router.use(authMiddleware);

// Rutas que requieren roles específicos para modificación
router.post('/', roleMiddleware(['Admin', 'SuperAdmin']), tarifasController.createTarifa);
router.put('/:id', roleMiddleware(['Admin', 'SuperAdmin']), tarifasController.updateTarifa);
router.patch('/:id/deactivate', roleMiddleware(['Admin', 'SuperAdmin']), tarifasController.deactivateTarifa);
router.delete('/:id', roleMiddleware(['Admin', 'SuperAdmin']), tarifasController.deleteTarifa);
*/

module.exports = router;