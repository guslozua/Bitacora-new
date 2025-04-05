const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const subtaskRoutes = require('./routes/subtaskRoutes');
const reportRoutes = require('./routes/reportRoutes');
const bitacoraRoutes = require('./routes/bitacoraRoutes');
const itrackerRoutes = require('./routes/itracker');
const itrackerStatsRoutes = require('./routes/itrackerStats');
const itrackerListRoutes = require('./routes/itrackerList');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// reportes
app.use('/api/reports', reportRoutes);


// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/bitacora', bitacoraRoutes);
app.use('/api/itracker', itrackerRoutes);
app.use('/api/itracker/stats', itrackerStatsRoutes);
app.use('/api/itracker', itrackerListRoutes);
app.use('/api/permisos', require('./routes/permisoRoutes'));

// Depuración: Listar rutas registradas en Express
app._router.stack.forEach((middleware) => {
  if (middleware.route) { 
      console.log(middleware.route.path);
  } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
              console.log(handler.route.path);
          }
      });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API del Task Manager funcionando correctamente' });
});

// test - ruta de prueba servidor
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'La API está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} 🚀`);
});