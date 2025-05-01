// middleware/roleMiddleware.js

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
      
      console.log('Usuario roles:', req.user.roles);
      console.log('Roles permitidos:', allowedRoles);
      
      // Si el usuario no tiene roles, asignarle un array vacío
      if (!req.user.roles) {
        req.user.roles = [];
      } 
      // Si roles es un string, convertirlo a array
      else if (typeof req.user.roles === 'string') {
        req.user.roles = req.user.roles.split(',');
      }
      
      // Verificar si alguno de los roles del usuario está en la lista de roles permitidos
      const hasPermission = 
        Array.isArray(req.user.roles) && 
        req.user.roles.some(rol => allowedRoles.includes(rol));
      
      if (!hasPermission) {
        console.log('Acceso denegado. Usuario no tiene roles permitidos');
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para realizar esta acción'
        });
      }
      
      // Si el usuario tiene al menos un rol adecuado, continúa
      console.log('Acceso permitido. Usuario tiene rol(es) autorizado(s)');
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