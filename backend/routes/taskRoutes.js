//routes/taskRoutes.js
const express = require('express');
const { 
    createTask, 
    getAllTasks, 
    getTaskById, 
    updateTask, 
    deleteTask,
    getTaskUsers,
    assignUserToTask,
    removeUserFromTask,
    updateTaskUsers
} = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createSubtask, getSubtasksByTaskId } = require('../controllers/subtaskController');

const router = express.Router();

// Crear una nueva tarea
router.post('/', authMiddleware, createTask);

// Obtener todas las tareas con filtros
router.get('/', authMiddleware, getAllTasks);

// Obtener una tarea por ID
router.get('/:id', authMiddleware, getTaskById);

// Actualizar una tarea por ID (Solo Admin y SuperAdmin)
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), updateTask);

// Eliminar una tarea por ID (Solo Admin y SuperAdmin)
router.delete('/:id', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), deleteTask);

// Rutas para subtareas
router.post('/:id/subtasks', authMiddleware, (req, res) => {
    // Pasamos el id de la tarea en los parámetros
    req.params.taskId = req.params.id;
    createSubtask(req, res);
});

router.get('/:id/subtasks', authMiddleware, (req, res) => {
    req.params.taskId = req.params.id;
    getSubtasksByTaskId(req, res);
});

// ===== NUEVAS RUTAS PARA ASIGNACIÓN DE USUARIOS =====

// Obtener usuarios asignados a una tarea
// GET /api/tasks/:id/users
router.get('/:id/users', authMiddleware, getTaskUsers);

// Asignar un usuario a una tarea
// POST /api/tasks/:id/users
router.post('/:id/users', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), assignUserToTask);

// Eliminar asignación de un usuario a una tarea
// DELETE /api/tasks/:taskId/users/:userId
router.delete('/:taskId/users/:userId', authMiddleware, roleMiddleware(['Admin', 'SuperAdmin']), removeUserFromTask);

// Actualizar todos los usuarios asignados a una tarea
// PUT /api/tasks/:id/users
router.put('/:id/users', 
    authMiddleware, 
    roleMiddleware(['Admin', 'SuperAdmin']),
    updateTaskUsers
);

module.exports = router;