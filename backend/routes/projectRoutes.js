const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Middleware para proteger rutas
router.use(authMiddleware);

// Obtener todos los proyectos (con filtros opcionales)
// GET /api/projects
router.get('/', projectController.getProjects);

// Obtener estadísticas de proyectos
// GET /api/projects/stats
router.get('/stats', projectController.getProjectStats);

// Obtener un proyecto por ID
// GET /api/projects/:id
router.get('/:id', projectController.getProjectById);

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
router.delete('/:id', roleMiddleware(['Admin', 'SuperAdmin']), projectController.deleteProject);

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

// ===== RUTAS DE USUARIOS ASOCIADOS AL PROYECTO =====

// Obtener usuarios asignados
// GET /api/projects/:id/users
router.get('/:id/users', projectController.getProjectUsers);

// Asignar usuario
// POST /api/projects/:id/users
router.post(
  '/:id/users',
  [
    check('userId', 'El ID de usuario es obligatorio').not().isEmpty(),
    check('rol', 'Rol no válido').optional().isIn(['responsable', 'colaborador', 'observador'])
  ],
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.assignUserToProject
);

// Eliminar usuario del proyecto
// DELETE /api/projects/:projectId/users/:userId
router.delete(
  '/:projectId/users/:userId',
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.removeUserFromProject
);

// Actualizar rol de usuario en proyecto
// PUT /api/projects/:projectId/users/:userId
router.put(
  '/:projectId/users/:userId',
  [
    check('rol', 'El rol es obligatorio').not().isEmpty(),
    check('rol', 'Rol no válido').isIn(['responsable', 'colaborador', 'observador'])
  ],
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.updateUserRoleInProject
);

// Actualizar todos los usuarios asignados
// PUT /api/projects/:id/users
router.put(
  '/:id/users',
  [
    check('usuarios', 'El campo usuarios debe ser un array').isArray()
  ],
  roleMiddleware(['Admin', 'SuperAdmin']),
  projectController.updateProjectUsers
);

module.exports = router;
