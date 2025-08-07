// routes/permisoRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getAllPermisos,
    createPermiso,
    updatePermiso,
    deletePermiso,
    getPermisosByCategoria,
    getPermisosPorRol,
    asignarPermisoARol,
    quitarPermisoDeRol
} = require('../controllers/permisoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Solo usuarios con rol Admin o SuperAdmin pueden manipular permisos
router.use((req, res, next) => {
  console.log('🔧 DEBUG: Middleware de permisoRoutes - ANTES de authMiddleware');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  next();
}, authMiddleware, (req, res, next) => {
  console.log('🔧 DEBUG: Middleware de permisoRoutes - DESPUÉS de authMiddleware');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   User:', req.user ? req.user.nombre : 'NO USER');
  next();
}, roleMiddleware(['Admin', 'SuperAdmin']), (req, res, next) => {
  console.log('🔧 DEBUG: Middleware de permisoRoutes - DESPUÉS de roleMiddleware');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   User roles:', req.user ? req.user.roles : 'NO ROLES');
  next();
});

// 🚨 RUTAS ESPECÍFICAS PRIMERO (antes que las rutas con parámetros)
// 🔧 DEBUG: Verificar que la ruta se registre
console.log('🔧 REGISTRANDO RUTA DELETE /remove');

// Rutas para asignar/quitar permisos (compatible con frontend)
router.post('/assign', asignarPermisoARol);

// 🔧 DEBUG: Agregar middleware específico para /remove
router.delete('/remove', (req, res, next) => {
  console.log('🎯 ENDPOINT /remove ALCANZADO!');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   Body:', req.body);
  next();
}, quitarPermisoDeRol);

// RUTAS BÁSICAS DE PERMISOS
router.get('/', getAllPermisos);
router.post('/', createPermiso);
router.put('/:id', updatePermiso);
router.delete('/:id', deletePermiso);

// Rutas para permisos por categoría
router.get('/by-category', getPermisosByCategoria);

// Rutas para permisos de roles (compatible con frontend)
router.get('/role/:id', getPermisosPorRol);

// Mantener rutas legacy por compatibilidad
router.get('/categoria', getPermisosByCategoria);
router.get('/rol/:id', getPermisosPorRol);
router.post('/asignar', asignarPermisoARol);
router.delete('/quitar', quitarPermisoDeRol);

// 🔧 DEBUG: Catch-all para rutas no encontradas
router.use('*', (req, res, next) => {
  console.log('🚫 RUTA NO ENCONTRADA en permisoRoutes:');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   Original URL:', req.originalUrl);
  console.log('   Params:', req.params);
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.path} no encontrada en permisoRoutes`
  });
});

module.exports = router;