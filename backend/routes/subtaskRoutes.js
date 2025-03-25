// routes/subtaskRoutes.js
const express = require('express');
const {
  createSubtask,
  getSubtasksByTaskId,
  updateSubtask,
  deleteSubtask
} = require('../controllers/subtaskController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Crear una nueva subtarea asociada a una tarea
router.post('/task/:taskId', authMiddleware, createSubtask);

// Obtener subtareas por ID de tarea
router.get('/task/:taskId', authMiddleware, getSubtasksByTaskId);

// Actualizar subtarea por ID
router.put('/:id', authMiddleware, updateSubtask);

// Eliminar subtarea por ID
router.delete('/:id', authMiddleware, deleteSubtask);

module.exports = router;