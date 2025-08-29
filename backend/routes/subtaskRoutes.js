// routes/subtaskRoutes.js
const express = require('express');
const {
  createSubtask,
  getSubtasks,
  getSubtasksByTaskId,
  updateSubtask,
  deleteSubtask,
  getSubtaskUsers,
  assignUserToSubtask,
  removeUserFromSubtask,
  updateSubtaskUsers
} = require('../controllers/subtaskController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// ✅ Obtener todas las subtareas (para el Gantt)
router.get('/', authMiddleware, getSubtasks);

// Crear una nueva subtarea asociada a una tarea
router.post('/task/:taskId', authMiddleware, createSubtask);

// Ruta alternativa para la creación de subtareas (usada en el frontend actual)
router.post('/:taskId/subtasks', authMiddleware, createSubtask);

// Obtener subtareas por ID de tarea
router.get('/task/:taskId', authMiddleware, getSubtasksByTaskId);

// Actualizar subtarea por ID
router.put('/:id', authMiddleware, updateSubtask);

// Eliminar subtarea por ID
router.delete('/:id', authMiddleware, deleteSubtask);

// ===== NUEVAS RUTAS PARA ASIGNACIÓN DE USUARIOS EN SUBTAREAS =====

// Obtener usuarios asignados a una subtarea
// GET /api/subtasks/:id/users
router.get('/:id/users', authMiddleware, (req, res) => {
    console.log(`🔍 [subtaskRoutes] GET /${req.params.id}/users - llamando a getSubtaskUsers`);
    console.log(`🔍 [subtaskRoutes] Parámetros:`, req.params);
    getSubtaskUsers(req, res);
});

// Asignar un usuario a una subtarea
// POST /api/subtasks/:id/users
router.post('/:id/users', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), (req, res) => {
    console.log(`🔍 [subtaskRoutes] POST /${req.params.id}/users - llamando a assignUserToSubtask`);
    console.log(`🔍 [subtaskRoutes] Body:`, req.body);
    assignUserToSubtask(req, res);
});

// Eliminar asignación de un usuario a una subtarea
// DELETE /api/subtasks/:subtaskId/users/:userId
router.delete('/:subtaskId/users/:userId', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), removeUserFromSubtask);

// Actualizar todos los usuarios asignados a una subtarea
// PUT /api/subtasks/:id/users
router.put('/:id/users', 
    authMiddleware, 
    roleMiddleware(['Admin', 'SuperAdmin']),
    updateSubtaskUsers
);

module.exports = router;
