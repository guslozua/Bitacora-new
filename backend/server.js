const express = require('express');
const cors = require('cors');
const path = require('path');
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
const tabulacionesRoutes = require('./routes/tabulaciones');
const tabulacionesStatsRoutes = require('./routes/tabulacionesStats');
const placasRoutes = require('./routes/placasRoutes');
const roleRoutes = require('./routes/roleRoutes');
const eventosRoutes = require('./routes/eventos'); // Agregar la ruta de eventos
const guardiasRoutes = require('./routes/guardias');
const glosarioRoutes = require('./routes/glosarioRoutes');
const enlacesRoutes = require('./routes/enlacesRoutes');
const incidentesRoutes = require('./routes/incidentes.routes');
const codigosRoutes = require('./routes/codigos.routes');
const informesRoutes = require('./routes/informes.routes');

// Importar el programador de limpieza
const { scheduleCleanup, cleanupUploadsFolder } = require('./utils/cleanupScheduler');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Asegurar que la carpeta uploads exista
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Carpeta de uploads creada');
}

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
app.use('/api/tabulaciones', tabulacionesRoutes);
app.use('/api/tabulaciones/stats', tabulacionesStatsRoutes);
app.use('/api/abm/social', require('./routes/abmSocial'));
app.use('/api/abm/pic', require('./routes/abmPic'));
app.use('/api/abm/stats', require('./routes/abmStats'));
app.use('/api/placas', placasRoutes);
app.use('/api/permisos', require('./routes/permisoRoutes'));
app.use('/api/roles', roleRoutes);
app.use('/api/eventos', eventosRoutes); // Agregar la ruta de eventos al servidor
app.use('/api/guardias', guardiasRoutes);
app.use('/api/glosario', glosarioRoutes);
app.use('/api/enlaces', enlacesRoutes);
app.use('/api/incidentes', incidentesRoutes);
app.use('/api/codigos', codigosRoutes);
app.use('/api/informes', informesRoutes);

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
  
  // Ejecutar limpieza inicial al iniciar el servidor
  console.log('Ejecutando limpieza inicial de la carpeta uploads...');
  cleanupUploadsFolder();
  
  // Programar limpiezas periódicas
  scheduleCleanup();
  console.log('Sistema de limpieza automática de archivos configurado 🧹');
});