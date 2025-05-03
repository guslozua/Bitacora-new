const express = require('express');
const { 
  getUserProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserProfile,
  deleteUser,
  getUserPermissions,
  getMyPermissions,
  getUserCount
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Verificar que las funciones están importadas
if (!getUserProfile || !getAllUsers || !getUserById || !createUser || !updateUser || !updateUserProfile || !deleteUser || !getUserCount) {
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

// Obtener permisos del usuario autenticado
router.get('/profile/permisos', authMiddleware, getMyPermissions);

// Ruta para obtener solo el número de usuarios
// IMPORTANTE: Esta ruta debe ir ANTES de las rutas con parámetros (:id)
router.get('/count', authMiddleware, getUserCount);

// Obtener todos los usuarios
router.get('/', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), getAllUsers);

// Crear nuevo usuario
router.post('/', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), createUser);

// Actualizar perfil del usuario autenticado
router.put('/profile', authMiddleware, updateUserProfile);

// Rutas con parámetros de URL

// Obtener usuario por ID
router.get('/:id', authMiddleware, getUserById);

// Actualizar usuario
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), updateUser);

// Eliminar usuario
router.delete('/:id', authMiddleware, roleMiddleware(['SuperAdmin']), deleteUser);

// Obtener permisos por ID (Admin o SuperAdmin)
router.get('/:id/permisos', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), getUserPermissions);

module.exports = router;