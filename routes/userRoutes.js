const express = require('express');
const { 
  getUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserProfile,
  deleteUser,
  getUserPermissions,
  getMyPermissions
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Verificar que las funciones están importadas
if (!getUserProfile || !getAllUsers || !getUserById || !updateUser || !updateUserProfile || !deleteUser) {
    throw new Error("Error en importaciones: Alguna función no está definida en userController.js");
}

// MIDDLEWARE DE DEPURACIÓN
router.use('/profile', (req, res, next) => {
    console.log('Headers:', req.headers);
    console.log('Body completo recibido:', req.body);
    console.log('Método:', req.method);
    next();
  });

// Obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, getUserProfile);

// Obtener todos los usuarios
router.get('/', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), getAllUsers);

// Obtener usuario por ID
router.get('/:id', authMiddleware, getUserById);

// Actualizar perfil del usuario autenticado
router.put('/profile', authMiddleware, updateUserProfile);

// Actualizar usuario
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), updateUser);


// Eliminar usuario
router.delete('/:id', authMiddleware, roleMiddleware(['SuperAdmin']), deleteUser);

// Obtener permisos del usuario autenticado
router.get('/profile/permisos', authMiddleware, getMyPermissions);

// Obtener permisos por ID (Admin o SuperAdmin)
router.get('/:id/permisos', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), getUserPermissions);


module.exports = router;
