// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

module.exports = async (req, res, next) => {
  try {
    // Buscar el token en x-auth-token o en Authorization
    let token = req.header('x-auth-token');
    
    // Si no hay token en x-auth-token, buscar en el encabezado Authorization
    if (!token) {
      const authHeader = req.header('Authorization');
      // Verificar si existe el encabezado Authorization y comienza con "Bearer "
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extraer el token (quitar "Bearer " del inicio)
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No hay token, autorización denegada' });
    }
    
    console.log('Token recibido:', token.substring(0, 20) + '...');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      UserModel.getUserById(decoded.id, (err, results) => {
        if (err || results.length === 0) {
          console.error('Error o usuario no encontrado:', err);
          return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        const user = results[0];
        console.log('Usuario autenticado:', {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          estado: user.estado,
          roles: user.roles
        });
        
        if (user.estado === 'bloqueado') {
          return res.status(403).json({ success: false, message: 'Cuenta bloqueada' });
        }
        
        // Asignar el usuario al request para uso posterior
        req.user = user;
        next();
      });
    } catch (jwtError) {
      console.error('Error específico de JWT:', jwtError.message);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Token inválido: ' + jwtError.message });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expirado' });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};