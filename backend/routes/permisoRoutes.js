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
router.use(authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']));

// Rutas para permisos
router.get('/', getAllPermisos);
router.post('/', createPermiso);
router.put('/:id', updatePermiso);
router.delete('/:id', deletePermiso);

// Rutas para permisos por categoría
router.get('/by-category', getPermisosByCategoria);

// Rutas para permisos de roles (compatible con frontend)
router.get('/role/:id', getPermisosPorRol);

// Rutas para asignar/quitar permisos (compatible con frontend)
router.post('/assign', asignarPermisoARol);
router.delete('/remove', quitarPermisoDeRol);

// Mantener rutas legacy por compatibilidad
router.get('/categoria', getPermisosByCategoria);
router.get('/rol/:id', getPermisosPorRol);
router.post('/asignar', asignarPermisoARol);
router.delete('/quitar', quitarPermisoDeRol);

module.exports = router;