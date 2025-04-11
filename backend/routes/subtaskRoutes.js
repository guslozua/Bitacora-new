// routes/subtaskRoutes.js (corregido)
const express = require('express');
const {
  createSubtask,
  getSubtasksByTaskId,
  updateSubtask,
  deleteSubtask
} = require('../controllers/subtaskController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Obtener todas las subtareas (para el Gantt)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = require('../config/db');
    const [subtareas] = await db.query('SELECT * FROM subtareas');
    res.json({ success: true, data: subtareas });
  } catch (error) {
    console.error('Error al obtener las subtareas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

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

module.exports = router;