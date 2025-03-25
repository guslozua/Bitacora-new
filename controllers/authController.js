// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserModel = require('../models/UserModel');
require('dotenv').config();
const { validationResult } = require('express-validator');

// Registro de usuario con validaciones
const registerUser = async (req, res) => {
  console.log('Ejecutando registerUser');
  console.log('Body recibido:', req.body);

  // Validar datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { nombre, email, password, rol } = req.body;
  console.log('Datos a registrar:', { nombre, email, rol });

  try {
    // Verificar si el usuario ya existe
    UserModel.getUserByEmail(email, (err, results) => {
      if (err) {
        console.error('Error en getUserByEmail:', err);
        return res.status(500).json({ message: 'Error al consultar la base de datos', error: err });
      }

      if (results && results.length > 0) {
        console.log('Usuario ya existe');
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      // Crear el nuevo usuario
      UserModel.createUser(nombre, email, password, rol, (err) => {
        if (err) {
          console.error('Error en createUser:', err);
          return res.status(500).json({ message: 'Error registrando usuario', error: err });
        }

        console.log('Usuario registrado exitosamente');
        res.status(201).json({ message: 'Usuario registrado con éxito' });
      });
    });
  } catch (error) {
    console.error('Error no controlado en registerUser:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// Inicio de sesión con generación de JWT
const loginUser = (req, res) => {
  console.log('Ejecutando loginUser');
  console.log('Body recibido:', req.body);

  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Faltan email o password');
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    // Buscar el usuario por email
    UserModel.getUserByEmail(email, (err, results) => {
      if (err) {
        console.error('Error en getUserByEmail (login):', err);
        return res.status(500).json({ message: 'Error al consultar la base de datos', error: err });
      }

      if (!results || results.length === 0) {
        console.log('Usuario no encontrado');
        return res.status(400).json({ message: 'Usuario no encontrado' });
      }

      const user = results[0];
      console.log('Usuario encontrado, verificando contraseña');

      // Verificar la contraseña
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error en bcrypt.compare:', err);
          return res.status(500).json({ message: 'Error en verificación de contraseña', error: err });
        }

        if (!isMatch) {
          console.log('Contraseña incorrecta');
          return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Generar el token JWT
        console.log('Contraseña correcta, generando token');
        const token = jwt.sign(
          { id: user.id, rol: user.rol },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        console.log('Token generado exitosamente');
        res.json({
          token,
          user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
        });
      });
    });
  } catch (error) {
    console.error('Error no controlado en loginUser:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// cambiar pass
const changePassword = async (req, res) => {
    console.log('Ejecutando changePassword');
    console.log('Body recibido:', req.body);
  
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
  
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
    }
  
    try {
      // Buscar el usuario por ID
      UserModel.getUserById(userId, (err, results) => {
        if (err) {
          console.error('Error en getUserById (changePassword):', err);
          return res.status(500).json({ message: 'Error al consultar la base de datos', error: err });
        }
  
        if (!results || results.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }
  
        const user = results[0];
  
        // Verificar la contraseña actual
        bcrypt.compare(oldPassword, user.password, (err, isMatch) => {
          if (err) {
            console.error('Error en bcrypt.compare:', err);
            return res.status(500).json({ message: 'Error en verificación de contraseña', error: err });
          }
  
          if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña actual incorrecta' });
          }
  
          // Cifrar la nueva contraseña
          bcrypt.hash(newPassword, 10, (err, hash) => {
            if (err) {
              console.error('Error cifrando nueva contraseña:', err);
              return res.status(500).json({ message: 'Error al cifrar la nueva contraseña', error: err });
            }
  
            // Actualizar la contraseña en la base de datos utilizando UserModel
            UserModel.updatePassword(userId, hash, (err, result) => {
              if (err) {
                console.error('Error actualizando contraseña:', err);
                return res.status(500).json({ message: 'Error actualizando contraseña', error: err });
              }
              
              console.log('Contraseña actualizada exitosamente');
              return res.json({ message: 'Contraseña actualizada con éxito' });
            });
          });
        });
      });
    } catch (error) {
      console.error('Error no controlado en changePassword:', error);
      return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  };

module.exports = { registerUser, loginUser, changePassword };