// routes/eventos.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const EventModel = require('../models/EventModel');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración de Multer para subir archivos CSV, JSON y Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/eventos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Permitir CSV, JSON y Excel
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.json' || ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV, JSON y Excel'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10MB
  }
});

// Primero las rutas específicas (sin parámetros de URL variables)
// @route   GET /api/eventos/stats
// @desc    Obtener estadísticas de eventos
// @access  Public (temporalmente)
router.get('/stats', EventModel.getEventStats);

// @route   GET /api/eventos/conflicts
// @desc    Verificar conflictos de eventos
// @access  Public
router.get('/conflicts', EventModel.checkConflicts);

// @route   GET /api/eventos/export/:format
// @desc    Exportar eventos a diferentes formatos (CSV, JSON, Excel)
// @access  Public
router.get('/export/:format', EventModel.exportEvents);

// Mantener la ruta original para compatibilidad
// @route   GET /api/eventos/export
// @desc    Exportar eventos a un archivo CSV (versión anterior)
// @access  Public (temporalmente)
router.get('/export', EventModel.exportEventsToCSV);

// @route   POST /api/eventos/import
// @desc    Importar eventos desde un archivo
// @access  Public (temporalmente)
router.post('/import', upload.single('file'), EventModel.importEvents);

// Luego la ruta raíz
// @route   GET /api/eventos
// @desc    Obtener todos los eventos con filtros opcionales
// @access  Public
router.get('/', EventModel.getEvents);

// @route   POST /api/eventos
// @desc    Crear un nuevo evento
// @access  Public (temporalmente)
router.post('/', 
  [
    check('title', 'El título es obligatorio').not().isEmpty(),
    check('start', 'La fecha de inicio es obligatoria').not().isEmpty(),
    check('end', 'La fecha de fin es obligatoria').not().isEmpty(),
    check('type', 'El tipo debe ser "task", "event" o "holiday"').isIn(['task', 'event', 'holiday'])
  ],
  EventModel.createEvent
);

// Finalmente las rutas con parámetros de URL variables
// @route   GET /api/eventos/:id
// @desc    Obtener un evento por ID
// @access  Public
router.get('/:id', EventModel.getEventById);

// @route   PUT /api/eventos/:id
// @desc    Actualizar un evento existente
// @access  Public (temporalmente)
router.put('/:id',
  [
    check('type', 'El tipo debe ser "task", "event" o "holiday"').optional().isIn(['task', 'event', 'holiday'])
  ],
  EventModel.updateEvent
);

// @route   DELETE /api/eventos/:id
// @desc    Eliminar un evento
// @access  Public (temporalmente)
router.delete('/:id', EventModel.deleteEvent);

// @route   PATCH /api/eventos/:id/complete
// @desc    Marcar una tarea como completada
// @access  Public (temporalmente)
router.patch('/:id/complete', EventModel.completeTask);

module.exports = router;