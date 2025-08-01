// routes/hitos.js - Versión con debug
const express = require('express');
const router = express.Router();
const hitoController = require('../controllers/hitoController');
const hitoExportController = require('../controllers/hitoExportAll'); // Nuevo controlador
const { check } = require('express-validator');
const auth = require('../middleware/authMiddleware');

// Middleware de logging para debug
router.use((req, res, next) => {
  console.log(`📡 Hitos API: ${req.method} ${req.path}`);
  console.log('📋 Headers:', {
    'x-auth-token': req.headers['x-auth-token'] ? 'Presente' : 'Ausente',
    'authorization': req.headers.authorization ? 'Presente' : 'Ausente'
  });
  next();
});

// Middleware de autenticación para todas las rutas
router.use(auth);

// @route   GET /api/hitos
// @desc    Obtener todos los hitos con filtros opcionales
// @access  Private
router.get('/', hitoController.getHitos);

// @route   GET /api/hitos/:id
// @desc    Obtener un hito por ID
// @access  Private
router.get('/:id', hitoController.getHitoById);

// @route   POST /api/hitos
// @desc    Crear un nuevo hito
// @access  Private
router.post('/', [
  check('nombre', 'El nombre del hito es obligatorio').not().isEmpty(),
], hitoController.createHito);

// @route   PUT /api/hitos/:id
// @desc    Actualizar un hito existente
// @access  Private
router.put('/:id', [
  check('nombre', 'El nombre del hito es obligatorio').optional().not().isEmpty(),
], hitoController.updateHito);

// @route   DELETE /api/hitos/:id
// @desc    Eliminar un hito
// @access  Private
router.delete('/:id', hitoController.deleteHito);

// @route   POST /api/hitos/proyecto/:id
// @desc    Convertir un proyecto a hito
// @access  Private
router.post('/proyecto/:id', hitoController.convertProjectToHito);

// @route   POST /api/hitos/:id/usuarios
// @desc    Gestionar usuarios de un hito (agregar/eliminar)
// @access  Private
router.post('/:id/usuarios', [
  check('action', 'La acción es obligatoria').isIn(['add', 'remove']),
  check('userId', 'El ID de usuario es obligatorio').isNumeric(),
], hitoController.manageHitoUsers);

// @route   POST /api/hitos/:id/tareas
// @desc    Gestionar tareas de un hito (agregar/actualizar/eliminar)
// @access  Private
router.post('/:id/tareas', [
  check('action', 'La acción es obligatoria').isIn(['add', 'update', 'remove']),
], hitoController.manageHitoTasks);

// @route   GET /api/hitos/:id/exportar
// @desc    Exportar hito a PDF
// @access  Private
router.get('/:id/exportar', hitoController.exportHitoToPDF);

// @route   GET /api/hitos/exportar/todos
// @desc    Exportar todos los hitos a PDF
// @access  Private
router.get('/exportar/todos', hitoExportController.exportAllHitosToPDF);

module.exports = router;