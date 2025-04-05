const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadExcel } = require('../controllers/itrackerController');

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Ruta de carga
router.post('/upload', upload.single('file'), uploadExcel);

module.exports = router;
