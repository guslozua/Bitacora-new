// routes/sessionAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const SessionAnalysisController = require('../controllers/sessionAnalysisController');
const authMiddleware = require('../middleware/authMiddleware');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'session-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo CSV y Excel.'), false);
    }
  }
});

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Rutas principales
router.post('/upload', upload.single('sessionFile'), SessionAnalysisController.processSessionFile);
router.get('/stats/current', SessionAnalysisController.getCurrentStats);
router.get('/stats/historical', SessionAnalysisController.getHistoricalData);

// Gestión de rangos IP
router.get('/ip-ranges', SessionAnalysisController.manageIpRanges);
router.post('/ip-ranges', SessionAnalysisController.manageIpRanges);
router.put('/ip-ranges/:id', SessionAnalysisController.updateIpRange);
router.delete('/ip-ranges/:id', SessionAnalysisController.deleteIpRange);

// Manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 50MB permitido.'
      });
    }
  }
  
  if (error.message === 'Tipo de archivo no permitido. Solo CSV y Excel.') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;