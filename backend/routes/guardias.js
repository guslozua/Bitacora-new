// routes/guardias.js
const express = require('express');
const router = express.Router();
const guardiasController = require('../controllers/guardias.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para la carga de archivos Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/guardias');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `guardias_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10MB
  }
});

// Rutas CRUD básicas
router.get('/', guardiasController.getGuardias);
router.get('/:id', guardiasController.getGuardiaById);
router.post('/', guardiasController.createGuardia);
router.put('/:id', guardiasController.updateGuardia);
router.delete('/:id', guardiasController.deleteGuardia);

// Ruta para importar guardias desde Excel
router.post('/import', upload.single('file'), guardiasController.importGuardias);

module.exports = router;