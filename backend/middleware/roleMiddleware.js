//middleware/roleMiddleware.js

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar si existe el usuario en el request (puesto por authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autorización denegada'
        });
      }
      
      // Verificar si el rol del usuario está en la lista de roles permitidos
      if (!allowedRoles.includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para realizar esta acción'
        });
      }
      
      // Si el usuario tiene el rol adecuado, continúa
      next();
    } catch (error) {
      console.error('Error en middleware de roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  };
};
