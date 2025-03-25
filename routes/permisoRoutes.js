// routes/permisoRoutes.js
const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Solo usuarios con rol Admin o SuperAdmin pueden manipular permisos
router.use(authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']));

router.get('/', permisoController.getAllPermisos);
router.post('/', permisoController.createPermiso);
router.post('/asignar', permisoController.asignarPermisoARol);
router.get('/rol/:id', permisoController.getPermisosPorRol);

module.exports = router;
