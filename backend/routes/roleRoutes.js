// routes/roleRoutes.js
const express = require('express');
const { 
    getAllRoles, 
    createRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
    removeRoleFromUser,
    getUserRoles,
    assignPermissionsToRole,
    getRolePermissions
} = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Obtener todos los roles
router.get('/', authMiddleware, getAllRoles);

// Crear un nuevo rol
router.post('/', authMiddleware, roleMiddleware(['SuperAdmin']), createRole);

// Actualizar un rol existente
router.put('/:id', authMiddleware, roleMiddleware(['SuperAdmin']), updateRole);

// Eliminar un rol
router.delete('/:id', authMiddleware, roleMiddleware(['SuperAdmin']), deleteRole);

// Asignar un rol a un usuario
router.put('/assign', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), assignRoleToUser);

// Quitar un rol a un usuario
router.delete('/assign', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), removeRoleFromUser);

// Obtener roles de un usuario
router.get('/user/:userId', authMiddleware, getUserRoles);

// Asignar permisos a un rol
router.put('/:id/permissions', authMiddleware, roleMiddleware(['SuperAdmin']), assignPermissionsToRole);

// Obtener permisos de un rol
router.get('/:id/permissions', authMiddleware, getRolePermissions);

module.exports = router;