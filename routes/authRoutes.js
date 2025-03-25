const express = require('express');
const { registerUser, loginUser, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Ruta de test simple
router.post('/test', (req, res) => {
  console.log('Test en auth route recibido');
  console.log('Body:', req.body);
  res.json({ message: 'Auth test route OK', body: req.body });
});

// Agregar logs a las rutas existentes
router.post('/register', (req, res, next) => {
  console.log('Entrando a ruta /register');
  console.log('Body:', req.body);
  next();
}, registerUser);

router.post('/login', (req, res, next) => {
  console.log('Entrando a ruta /login');
  console.log('Body:', req.body);
  next();
}, loginUser);

// cambiar pass
router.put('/change-password', authMiddleware, (req, res, next) => {
  console.log('Entrando a ruta /change-password');
  console.log('Body:', req.body);
  next();
}, changePassword);

module.exports = router;