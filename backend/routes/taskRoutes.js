//routes/taskRoutes.js
const express = require('express');
const { createTask, getAllTasks, getTaskById, updateTask, deleteTask } = require('../controllers/taskController');
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

module.exports = router;