const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Middleware para proteger rutas
router.use(authMiddleware);

// Obtener todos los proyectos (con filtros opcionales)
// GET /api/projects?estado=activo&responsable=5
router.get(
  '/',
  projectController.getProjects
);

// Obtener estadísticas de proyectos
// GET /api/projects/stats
router.get(
  '/stats',
  projectController.getProjectStats
);

// Obtener un proyecto por ID
// GET /api/projects/:id
router.get(
  '/:id',
  projectController.getProjectById
);

// Crear un nuevo proyecto
// POST /api/projects
router.post(
  '/',
  [
    check('nombre', 'El nombre del proyecto es obligatorio').not().isEmpty(),
    check('fecha_inicio', 'Formato de fecha de inicio inválido').optional().isDate(),
    check('fecha_fin', 'Formato de fecha de fin inválido').optional().isDate()
  ],
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.createProject
);

// Actualizar un proyecto existente
// PUT /api/projects/:id
router.put(
  '/:id',
  [
    check('nombre', 'El nombre del proyecto es obligatorio').optional().not().isEmpty(),
    check('fecha_inicio', 'Formato de fecha de inicio inválido').optional().isDate(),
    check('fecha_fin', 'Formato de fecha de fin inválido').optional().isDate()
  ],
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.updateProject
);

// Eliminar un proyecto
// DELETE /api/projects/:id
router.delete(
  '/:id',
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.deleteProject
);

// Cambiar el estado de un proyecto
// PATCH /api/projects/:id/status
router.patch(
  '/:id/status',
  [
    check('estado', 'El estado es obligatorio').not().isEmpty(),
    check('estado', 'Estado no válido').isIn(['activo', 'completado', 'archivado', 'cancelado'])
  ],
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.changeProjectStatus
);

module.exports = router;