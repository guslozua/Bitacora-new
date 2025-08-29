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
const tarifasRoutes = require('./routes/tarifas.routes');
const contactosRoutes = require('./routes/contactosRoutes');
const diagnosticsRoutes = require('./routes/diagnosticsRoutes'); //sistema de diagnósticos
const announcementsRoutes = require('./routes/announcementsRoutes'); // Sistema completo de gestión de anuncios dinámicos
const sessionAnalysisRoutes = require('./routes/sessionAnalysisRoutes'); // Análisis de sesiones
const aternityRoutes = require('./routes/aternityRoutes'); // Integración con Aternity API


// 🔔 AGREGAR IMPORT DE HITOS
const hitosRoutes = require('./routes/hitos');

// 🔔 AGREGAR IMPORT DE NOTIFICACIONES
const notificacionesRoutes = require('./routes/notificaciones.routes');

// 🆕 AGREGAR IMPORT DE CONFIGURACIONES GLOBALES
const configuracionGlobalRoutes = require('./routes/configuracionGlobalRoutes');

// Importar el programador de limpieza
const { scheduleCleanup, cleanupUploadsFolder } = require('./utils/cleanupScheduler');

// 🆕 IMPORTAR SISTEMA DE LOGS
const { logSystemEvent } = require('./utils/logEvento');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🚀 RUTAS DE ATERNITY PRIMERO (antes que otros middlewares)
// 🔍 MIDDLEWARE DE DEBUG GLOBAL
app.use('/api/aternity*', (req, res, next) => {
  console.log(`🔥 INTERCEPTOR GLOBAL: ${req.method} ${req.originalUrl}`);
  console.log('🔥 Path:', req.path);
  console.log('🔥 Headers:', req.headers.authorization ? 'Auth present' : 'No auth');
  next();
});

app.use('/api/aternity', (req, res, next) => {
  console.log(`🔍 ATERNITY ROUTE: ${req.method} ${req.path}`);
  console.log('🔍 Headers:', req.headers.authorization ? 'Authorization present' : 'No authorization');
  next();
}, aternityRoutes);

// 🆘 RUTA DE EMERGENCIA SIN MIDDLEWARE
app.get('/api/aternity/test-connection-emergency', async (req, res) => {
  console.log('🆘 RUTA DE EMERGENCIA ALCANZADA');
  try {
    const AternityController = require('./controllers/aternityController');
    
    // Simular usuario autenticado para el test
    req.user = { id: 1, name: 'emergency-test' };
    
    await AternityController.testConnection(req, res);
  } catch (error) {
    console.error('❌ Error en ruta de emergencia:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      stack: error.stack,
      message: 'Error en ruta de emergencia'
    });
  }
});

// Asegurar que la carpeta uploads exista
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Carpeta de uploads creada');
}

// reportes
app.use('/api/reports', reportRoutes);

// Middleware de debug para routes
app.use('/api/tasks*', (req, res, next) => {
  console.log(`🔥 TASK ROUTE HIT: ${req.method} ${req.originalUrl}`);
  console.log('🔥 Body:', req.body);
  console.log('🔥 Params:', req.params);
  next();
});

app.use('/api/subtasks*', (req, res, next) => {
  console.log(`🔥 SUBTASK ROUTE HIT: ${req.method} ${req.originalUrl}`);
  console.log('🔥 Body:', req.body);
  console.log('🔥 Params:', req.params);
  next();
});

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
// 🔧 DEBUG MIDDLEWARE ESPECÍFICO PARA PERMISSIONS
app.use('/api/permissions*', (req, res, next) => {
  console.log('🔍 INTERCEPTOR PERMISSIONS:');
  console.log('   Method:', req.method);
  console.log('   URL:', req.originalUrl);
  console.log('   Path:', req.path);
  console.log('   Body:', req.body);
  console.log('   Headers Authorization:', req.headers.authorization ? 'PRESENT' : 'MISSING');
  console.log('   Content-Type:', req.headers['content-type']);
  next();
});

app.use('/api/permisos', require('./routes/permisoRoutes'));
app.use('/api/permissions', require('./routes/permisoRoutes')); // Alias en inglés
app.use('/api/roles', roleRoutes);
app.use('/api/eventos', eventosRoutes); // ruta de eventos al servidor
app.use('/api/guardias', guardiasRoutes);
app.use('/api/glosario', glosarioRoutes);
app.use('/api/enlaces', enlacesRoutes);
app.use('/api/incidentes', incidentesRoutes);
app.use('/api/codigos', codigosRoutes);
app.use('/api/informes', informesRoutes);
app.use('/api/tarifas', tarifasRoutes);
app.use('/api/contactos', contactosRoutes);
app.use('/api/diagnostics', diagnosticsRoutes); // Ruta del sistema de diagnósticos
app.use('/api/announcements', announcementsRoutes); // Ruta del sistema de anuncios dinámicos
app.use('/api/session-analysis', sessionAnalysisRoutes); // Ruta del análisis de sesiones
// app.use('/api/aternity', aternityRoutes); // MOVIDO ARRIBA


// 🔔 RUTA DE HITOS
app.use('/api/hitos', hitosRoutes);

// 🔔 RUTA DE NOTIFICACIONES
app.use('/api/notificaciones', notificacionesRoutes);

// 🆕 RUTA DE CONFIGURACIONES GLOBALES
app.use('/api/configuraciones-globales', configuracionGlobalRoutes);

console.log('\n🔍 === ANÁLISIS DE RUTAS REGISTRADAS ===');

// Función para extraer rutas de un router
function extractRoutes(stack, basePath = '') {
  const routes = [];
  
  stack.forEach((layer) => {
    if (layer.route) {
      // Ruta directa
      const methods = Object.keys(layer.route.methods);
      methods.forEach(method => {
        routes.push({
          method: method.toUpperCase(),
          path: basePath + layer.route.path,
          name: layer.route.path
        });
      });
    } else if (layer.name === 'router' && layer.regexp) {
      // Sub-router
      const match = layer.regexp.source.match(/^\^\\?\/([^\\]+)/);
      const prefix = match ? '/' + match[1] : '';
      
      if (layer.handle && layer.handle.stack) {
        const subRoutes = extractRoutes(layer.handle.stack, basePath + prefix);
        routes.push(...subRoutes);
      }
    }
  });
  
  return routes;
}

// Extraer todas las rutas de la aplicación
const allRoutes = extractRoutes(app._router.stack);

// Agrupar por prefijo
const routesByPrefix = {};
allRoutes.forEach(route => {
  const prefix = route.path.split('/')[1] || 'root';
  if (!routesByPrefix[prefix]) {
    routesByPrefix[prefix] = [];
  }
  routesByPrefix[prefix].push(route);
});

// Mostrar rutas organizadas
Object.keys(routesByPrefix).sort().forEach(prefix => {
  console.log(`\n📁 /${prefix}:`);
  routesByPrefix[prefix].forEach(route => {
    console.log(`   ${route.method.padEnd(6)} ${route.path}`);
  });
});

// Buscar específicamente rutas que contengan palabras clave
console.log('\n🔍 BÚSQUEDA DE RUTAS ESPECÍFICAS:');
const searchTerms = ['notificacion', 'contacto', 'placa', 'informe', 'tabulacion'];

searchTerms.forEach(term => {
  console.log(`\n🔍 Rutas que contienen "${term}":`);
  const matchingRoutes = allRoutes.filter(route => 
    route.path.toLowerCase().includes(term)
  );
  
  if (matchingRoutes.length > 0) {
    matchingRoutes.forEach(route => {
      console.log(`   ✅ ${route.method} ${route.path}`);
    });
  } else {
    console.log(`   ❌ No se encontraron rutas con "${term}"`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('💡 RECOMENDACIONES:');
console.log('1. Verifica si las rutas requieren parámetros (ej: /notificaciones/usuario/:id)');
console.log('2. Algunos endpoints podrían usar POST en lugar de GET');
console.log('3. Revisa si hay rutas similares con nombres diferentes');
console.log('='.repeat(80) + '\n');


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

// 🔧 RUTA DE DEBUG TEMPORAL PARA ATERNITY
app.get('/api/aternity-debug', async (req, res) => {
  console.log('🔧 Ruta de debug de Aternity alcanzada');
  try {
    const AternityController = require('./controllers/aternityController');
    await AternityController.testConnection(req, res);
  } catch (error) {
    console.error('❌ Error en debug:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// 🆕 MIDDLEWARE GLOBAL DE LOGGING PARA ERRORES NO MANEJADOS
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  try {
    await logSystemEvent.logEvento({
      tipo_evento: 'ERROR_SYSTEM',
      descripcion: `Excepción no manejada: ${error.message}`,
      id_usuario: null,
      nombre_usuario: 'SYSTEM'
    });
  } catch (logError) {
    console.error('Error logging uncaught exception:', logError);
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    const { logEvento } = require('./utils/logEvento');
    await logEvento({
      tipo_evento: 'ERROR_SYSTEM',
      descripcion: `Promise rechazada no manejada: ${reason}`,
      id_usuario: null,
      nombre_usuario: 'SYSTEM'
    });
  } catch (logError) {
    console.error('Error logging unhandled rejection:', logError);
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT} 🚀`);

  // 🆕 REGISTRAR INICIO DEL SISTEMA EN LA BITÁCORA
  try {
    await logSystemEvent.systemStart();
    console.log('✅ Evento de inicio del sistema registrado en bitácora');
  } catch (error) {
    console.error('❌ Error registrando inicio del sistema:', error);
  }

  // Ejecutar limpieza inicial al iniciar el servidor
  console.log('Ejecutando limpieza inicial de la carpeta uploads...');
  cleanupUploadsFolder();

  // Programar limpiezas periódicas
  scheduleCleanup();
  console.log('Sistema de limpieza automática de archivos configurado 🧹');

  // 🔔 MENSAJE DE CONFIRMACIÓN PARA HITOS
  console.log('✅ Rutas de hitos registradas correctamente');

  // 🔔 MENSAJE DE CONFIRMACIÓN PARA NOTIFICACIONES
  console.log('✅ Rutas de notificaciones registradas correctamente');

  // 🆕 MENSAJE DE CONFIRMACIÓN PARA SISTEMA DE LOGS
  console.log('✅ Sistema de logs integrado con bitácora');

  

  // 🆕 REGISTRAR FINALIZACIÓN DE CONFIGURACIÓN
  try {
    const { logEvento } = require('./utils/logEvento');
    await logEvento({
      tipo_evento: 'SYSTEM_START',
      descripcion: `Servidor TaskManager iniciado correctamente en puerto ${PORT}`,
      id_usuario: null,
      nombre_usuario: 'SYSTEM'
    });
  } catch (error) {
    console.error('Error registrando configuración completa:', error);
  }
});