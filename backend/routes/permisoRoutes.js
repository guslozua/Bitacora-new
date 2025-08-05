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
router.get('/categoria', getPermisosByCategoria);

// Rutas para permisos de roles
router.get('/rol/:id', getPermisosPorRol);

// Rutas para asignar/quitar permisos (individuales)
router.post('/asignar', asignarPermisoARol);
router.delete('/quitar', quitarPermisoDeRol);

module.exports = router;