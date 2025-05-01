// routes/authRoutes.js
const express = require('express');
const { check } = require('express-validator');
const {
  registerUser,
  loginUser,
  changePassword,
  verifyUser,
  requestPasswordReset,
  resetPassword
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// MIDDLEWARE DE DEPURACIÓN
router.use((req, res, next) => {
  console.log('Entrando a ruta', req.path);
  console.log('Body:', req.body);
  next();
});

// Registro de usuario
router.post(
  '/register',
  [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'Por favor incluya un email válido').isEmail(),
    check('password', 'Por favor ingrese una contraseña con 6 o más caracteres').isLength({ min: 6 })
  ],
  registerUser
);

// Login de usuario
router.post(
  '/login',
  [
    check('email', 'Por favor incluya un email válido').isEmail(),
    check('password', 'La contraseña es obligatoria').exists()
  ],
  loginUser
);

// Cambiar contraseña (requiere autenticación)
router.put(
  '/password',
  authMiddleware,
  [
    check('currentPassword', 'La contraseña actual es obligatoria').exists(),
    check('newPassword', 'La nueva contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
  ],
  changePassword
);

// Verificar usuario (ruta protegida para pruebas)
router.get('/verify', authMiddleware, verifyUser);

// Solicitar recuperación de contraseña
router.post(
  '/forgot-password',
  [
    check('email', 'Por favor incluya un email válido').isEmail()
  ],
  requestPasswordReset
);

// Resetear contraseña
router.post(
  '/reset-password',
  [
    check('token', 'Token es requerido').not().isEmpty(),
    check('newPassword', 'La nueva contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
  ],
  resetPassword
);

module.exports = router;