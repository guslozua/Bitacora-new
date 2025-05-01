const express = require('express');
const db = require('../config/db'); // Importación añadida para la ruta de conteo
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

// Obtener permisos del usuario autenticado
router.get('/profile/permisos', authMiddleware, getMyPermissions);

// Ruta para obtener solo el número de usuarios (sin restricción de roles)
// IMPORTANTE: Esta ruta debe ir ANTES de las rutas con parámetros (:id)
router.get('/count', authMiddleware, async (req, res) => {
  try {
    console.log('Ejecutando conteo de usuarios');
    
    // Consulta simple para contar usuarios
    const [result] = await db.query('SELECT COUNT(*) as count FROM Usuarios');
    
    const count = result[0].count || result[0]['COUNT(*)'] || 0;
    console.log('Conteo de usuarios:', count);
    
    res.json({ 
      success: true, 
      count: count
    });
  } catch (err) {
    console.error('Error en conteo de usuarios:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo conteo de usuarios',
      error: err.message
    });
  }
});

// Obtener todos los usuarios
router.get('/', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), getAllUsers);

// Rutas con parámetros de URL

// Obtener usuario por ID
router.get('/:id', authMiddleware, getUserById);

// Actualizar perfil del usuario autenticado
router.put('/profile', authMiddleware, updateUserProfile);

// Actualizar usuario
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), updateUser);

// Eliminar usuario
router.delete('/:id', authMiddleware, roleMiddleware(['SuperAdmin']), deleteUser);

// Obtener permisos por ID (Admin o SuperAdmin)
router.get('/:id/permisos', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), getUserPermissions);

module.exports = router;