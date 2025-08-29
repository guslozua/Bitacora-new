// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

module.exports = async (req, res, next) => {
  console.log('🔍 AuthMiddleware - INICIO. URL:', req.method, req.url);
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
    
    console.log('🔐 AuthMiddleware - Token recibido:', token.substring(0, 20) + '...');
    console.log('🔐 AuthMiddleware - JWT_SECRET disponible:', !!process.env.JWT_SECRET);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔐 AuthMiddleware - Token decodificado. User ID:', decoded.id);
      
      // Convertir callback a Promise para mejor manejo de errores
      const getUserPromise = (userId) => {
        return new Promise((resolve, reject) => {
          UserModel.getUserById(userId, (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
      };

      try {
        const results = await getUserPromise(decoded.id);
        console.log('🔐 AuthMiddleware - Resultado getUserById. Results length:', results?.length);
        
        if (!results || results.length === 0) {
          console.error('Usuario no encontrado para ID:', decoded.id);
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
        
      } catch (dbError) {
        console.error('🔐 AuthMiddleware - Error de base de datos:', dbError);
        
        // Manejar errores específicos de conexión
        const isConnectionError = (
          dbError.code === 'ECONNCLOSED' || 
          dbError.code === 'ENOTOPEN' ||
          dbError.message.includes('Connection is closed') ||
          dbError.message.includes('Connection not yet open')
        );
        
        if (isConnectionError) {
          console.error('🔐 AuthMiddleware - Error de conexión a BD detectado');
          return res.status(503).json({ 
            success: false, 
            message: 'Servicio temporalmente no disponible. Intente nuevamente.',
            error: 'DATABASE_CONNECTION_ERROR'
          });
        }
        
        // Para otros errores de BD
        return res.status(500).json({ 
          success: false, 
          message: 'Error interno del servidor',
          error: 'DATABASE_ERROR'
        });
      }
      
    } catch (jwtError) {
      console.error('🔐 AuthMiddleware - Error específico de JWT:', jwtError.message);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Token inválido: ' + jwtError.message });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expirado' });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('🔐 AuthMiddleware - Error general en autenticación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};