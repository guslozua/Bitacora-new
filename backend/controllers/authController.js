// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const UserModel = require('../models/UserModel');
const db = require('../config/db');
const { logSystemEvent } = require('../utils/logEvento'); // 🆕 AGREGADO

// Registro de usuario
const registerUser = async (req, res) => {
  console.log('Ejecutando registerUser');
  console.log('Body recibido:', req.body);
  
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, email, password, rol } = req.body;

  try {
    // Verificar si el email ya existe
    const [existingUsers] = await db.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      console.log('Email ya registrado:', email);
      // 🆕 Log de intento de registro con email duplicado
      await logSystemEvent.logEvento({
        tipo_evento: 'WARNING',
        descripcion: `Intento de registro con email duplicado: ${email}`,
        id_usuario: null,
        nombre_usuario: email
      }, req);
      
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Cifrar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const [result] = await db.query(
      'INSERT INTO Usuarios (nombre, email, password, estado) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, 'activo']
    );

    const userId = result.insertId;
    console.log('Usuario creado con ID:', userId);

    // Si se especificó un rol, asignarlo
    if (rol) {
      // Obtener el ID del rol por nombre
      const [roles] = await db.query('SELECT id FROM Roles WHERE nombre = ?', [rol]);
      
      if (roles.length > 0) {
        const roleId = roles[0].id;
        
        // Asignar rol al usuario
        await db.query(
          'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
          [userId, roleId]
        );
        
        console.log(`Rol "${rol}" asignado al usuario ${userId}`);
      } else {
        console.log(`Rol "${rol}" no encontrado en la base de datos`);
      }
    }

    // 🆕 Log de registro exitoso
    await logSystemEvent.logEvento({
      tipo_evento: 'CREATE',
      descripcion: `Nuevo usuario registrado: ${nombre} (${email})`,
      id_usuario: userId,
      nombre_usuario: nombre
    }, req);

    // Generar token JWT
    const payload = {
      id: userId
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log('Token generado para nuevo usuario');
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error no controlado en registerUser:', err);
    
    // 🆕 Log de error en registro
    await logSystemEvent.apiError('/api/auth/register', err, null, req);
    
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
};

// Login de usuario
const loginUser = async (req, res) => {
  console.log('Ejecutando loginUser');
  console.log('Body recibido:', req.body);
  
  // Validar errores de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Buscar usuario por email - Con esquema completo
    const [users] = await db.query(`
      SELECT u.id, u.nombre, u.email, u.password, u.estado, u.ultimo_acceso,
             (
               SELECT STRING_AGG(r.nombre, ',')
               FROM taskmanagementsystem.usuario_rol ur
               INNER JOIN taskmanagementsystem.roles r ON ur.id_rol = r.id
               WHERE ur.id_usuario = u.id
             ) as roles
      FROM taskmanagementsystem.usuarios u
      WHERE u.email = ?
    `, [email]);

    if (users.length === 0) {
      console.log('Email no encontrado:', email);
      
      // 🆕 Log de intento de login con email no encontrado
      await logSystemEvent.loginFailed(email, req);
      
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    console.log('Usuario encontrado:', { id: user.id, email: user.email });

    // Verificar estado del usuario
    if (user.estado === 'bloqueado') {
      console.log('Usuario bloqueado:', email);
      
      // 🆕 Log de intento de login con cuenta bloqueada
      await logSystemEvent.logEvento({
        tipo_evento: 'WARNING',
        descripcion: `Intento de login con cuenta bloqueada: ${email}`,
        id_usuario: user.id,
        nombre_usuario: user.nombre
      }, req);
      
      return res.status(403).json({ message: 'Cuenta bloqueada. Contacte al administrador.' });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Contraseña incorrecta para usuario:', email);
      
      // 🆕 Log de intento de login con contraseña incorrecta
      await logSystemEvent.loginFailed(email, req);
      
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Preparar roles para el token
    let roles = [];
    if (user.roles) {
      roles = user.roles.split(',');
    }

    // 🆕 Log de login exitoso
    await logSystemEvent.login(user.id, user.nombre, req);

    // Generar token JWT
    const payload = {
      id: user.id,
      roles: roles
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        console.log('Login exitoso, token generado');
        
        // Actualizar último acceso
        db.query('UPDATE taskmanagementsystem.usuarios SET ultimo_acceso = GETDATE() WHERE id = ?', [user.id])
          .then(() => {
            console.log('Último acceso actualizado');
          })
          .catch(err => {
            console.error('Error actualizando último acceso:', err);
          });

        // Devolver información básica del usuario y token
        res.json({
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            roles: roles
          }
        });
      }
    );
  } catch (err) {
    console.error('Error no controlado en loginUser:', err);
    
    // 🆕 Log de error en login
    await logSystemEvent.apiError('/api/auth/login', err, null, req);
    
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  console.log('Ejecutando changePassword');
  
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    // Obtener usuario actual
    const [users] = await db.query('SELECT * FROM Usuarios WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      // 🆕 Log de intento de cambio de contraseña con contraseña actual incorrecta
      await logSystemEvent.logEvento({
        tipo_evento: 'WARNING',
        descripcion: 'Intento de cambio de contraseña con contraseña actual incorrecta',
        id_usuario: userId,
        nombre_usuario: req.user.nombre
      }, req);
      
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Cifrar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await db.query('UPDATE Usuarios SET password = ? WHERE id = ?', [hashedPassword, userId]);

    // 🆕 Log de cambio de contraseña exitoso
    await logSystemEvent.logEvento({
      tipo_evento: 'UPDATE',
      descripcion: 'Contraseña actualizada correctamente',
      id_usuario: userId,
      nombre_usuario: req.user.nombre
    }, req);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en changePassword:', err);
    
    // 🆕 Log de error en cambio de contraseña
    await logSystemEvent.apiError('/api/auth/change-password', err, userId, req);
    
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
};

// Verificar usuario
const verifyUser = (req, res) => {
  res.json({ user: req.user });
};

// Recuperar contraseña (solicitud)
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el email existe
    const [users] = await db.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
    
    if (users.length === 0) {
      // 🆕 Log de solicitud de reset con email no encontrado
      await logSystemEvent.logEvento({
        tipo_evento: 'WARNING',
        descripcion: `Solicitud de reset de contraseña con email no encontrado: ${email}`,
        id_usuario: null,
        nombre_usuario: email
      }, req);
      
      return res.status(404).json({ message: 'No existe una cuenta con ese email' });
    }

    const user = users[0];

    // Generar token de reseteo (válido por 1 hora)
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Guardar token en la base de datos
    await db.query('UPDATE Usuarios SET reset_token = ? WHERE id = ?', [resetToken, user.id]);

    // 🆕 Log de solicitud de reset exitosa
    await logSystemEvent.logEvento({
      tipo_evento: 'INFO',
      descripcion: `Solicitud de reset de contraseña generada para: ${email}`,
      id_usuario: user.id,
      nombre_usuario: user.nombre
    }, req);

    // Aquí se enviaría el email con el enlace para resetear la contraseña
    // Por ahora, solo devolvemos el token para pruebas
    console.log('Token de reseteo generado para:', email);
    
    res.json({ 
      message: 'Se ha enviado un email con instrucciones para recuperar tu contraseña',
      resetToken // Solo para pruebas, en producción no devolver esto
    });
  } catch (err) {
    console.error('Error en requestPasswordReset:', err);
    
    // 🆕 Log de error en solicitud de reset
    await logSystemEvent.apiError('/api/auth/request-password-reset', err, null, req);
    
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
};

// Implementar reseteo de contraseña
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario con ese token
    const [users] = await db.query('SELECT * FROM Usuarios WHERE id = ? AND reset_token = ?', [decoded.id, token]);
    
    if (users.length === 0) {
      // 🆕 Log de intento de reset con token inválido
      await logSystemEvent.logEvento({
        tipo_evento: 'WARNING',
        descripcion: 'Intento de reset de contraseña con token inválido o expirado',
        id_usuario: decoded.id || null,
        nombre_usuario: 'UNKNOWN'
      }, req);
      
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const user = users[0];

    // Cifrar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña y limpiar token
    await db.query('UPDATE Usuarios SET password = ?, reset_token = NULL WHERE id = ?', [hashedPassword, decoded.id]);

    // 🆕 Log de reset de contraseña exitoso
    await logSystemEvent.logEvento({
      tipo_evento: 'UPDATE',
      descripcion: 'Contraseña restablecida correctamente mediante token de reset',
      id_usuario: user.id,
      nombre_usuario: user.nombre
    }, req);

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // 🆕 Log de token expirado
      await logSystemEvent.logEvento({
        tipo_evento: 'WARNING',
        descripcion: 'Intento de reset de contraseña con token expirado',
        id_usuario: null,
        nombre_usuario: 'UNKNOWN'
      }, req);
      
      return res.status(400).json({ message: 'El token ha expirado' });
    }
    
    console.error('Error en resetPassword:', err);
    
    // 🆕 Log de error en reset
    await logSystemEvent.apiError('/api/auth/reset-password', err, null, req);
    
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  verifyUser,
  requestPasswordReset,
  resetPassword
};