// SERVIDOR ATERNITY SEPARADO DESHABILITADO
// Este archivo se mantiene como referencia pero ya no se usa
// Todas las rutas de Aternity ahora están integradas en server.js

/*
const express = require('express');
const cors = require('cors');
const AternityController = require('./controllers/aternityController');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Logging de todas las requests
app.use('*', (req, res, next) => {
  console.log(`🚀 ATERNITY SERVER: ${req.method} ${req.originalUrl}`);
  next();
});

// Rutas mejoradas
app.get('/test-connection', async (req, res) => {
  console.log('🔍 Test connection alcanzado');
  try {
    await AternityController.testConnection(req, res);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/vm-pic-correlation', async (req, res) => {
  console.log('🔍 VM PIC correlation MEJORADO alcanzado');
  try {
    await AternityController.getCorrelatedVMPICData(req, res);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/performance-by-call-center', async (req, res) => {
  console.log('🔍 Performance by call center MEJORADO alcanzado');
  try {
    await AternityController.getPerformanceByCallCenter(req, res);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor Aternity MEJORADO funcionando',
    timestamp: new Date().toISOString(),
    improvements: [
      'Límite aumentado de 50 a 500 VM PIC',
      'Correlación múltiple por prioridad',
      'Limpieza robusta de nombres',
      'Manejo de formatos de usuario E/u',
      'Filtrado de IPs válidas',
      'Estadísticas detalladas de matching'
    ]
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada en servidor Aternity',
    url: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Aternity MEJORADO corriendo en puerto ${PORT}`);
  console.log(`🧪 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test-connection`);
  console.log(`📊 Correlación: http://localhost:${PORT}/vm-pic-correlation`);
});

module.exports = app;
*/