// Versión final corregida de subtaskController.js

const db = require('../config/db');

exports.createSubtask = async (req, res) => {
  const { titulo, descripcion, fecha_inicio, fecha_vencimiento, prioridad } = req.body;
  const id_tarea = req.params.taskId || req.params.id_tarea;

  try {
    // Verificar que la tarea existe
    const tareaQuery = 'SELECT id FROM tareas WHERE id = ?';
    const [tareaResult] = await db.query(tareaQuery, [id_tarea]);
    if (!tareaResult.length) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    }

    // Construir la consulta SQL con los campos que sí existen en la tabla subtareas
    // Basado en la estructura de tabla mostrada en las imágenes
    const query = `
      INSERT INTO subtareas 
      (titulo, estado, id_tarea, descripcion, fecha_inicio, fecha_vencimiento, prioridad) 
      VALUES (?, 'pendiente', ?, ?, ?, ?, ?)
    `;
    
    // Ejecutar la consulta
    const [result] = await db.query(query, [
      titulo, 
      id_tarea, 
      descripcion || null, 
      fecha_inicio || null, 
      fecha_vencimiento || null, 
      prioridad || null
    ]);

    // Preparar la respuesta
    const responseData = {
      id: result.insertId,
      titulo,
      estado: 'pendiente',
      id_tarea,
      descripcion,
      fecha_inicio,
      fecha_vencimiento,
      prioridad
    };

    // Registrar el evento si es necesario
    console.log(`Subtarea ${titulo} creada para tarea ${id_tarea}`);

    // Enviar respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Subtarea creada con éxito',
      id: result.insertId,
      data: responseData,
    });
  } catch (error) {
    console.error('Error al crear subtarea:', error);
    res.status(500).json({ success: false, message: 'Error al crear subtarea' });
  }
};

exports.getSubtasksByTaskId = async (req, res) => {
  const id_tarea = req.params.taskId;
  
  try {
    const query = 'SELECT * FROM subtareas WHERE id_tarea = ?';
    const [rows] = await db.query(query, [id_tarea]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener subtareas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener subtareas' });
  }
};

exports.updateSubtask = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Construir la consulta de actualización
    const fields = [];
    const values = [];

    // Obtener los campos a actualizar del body
    for (const key in updates) {
      // Solo actualizar campos válidos que existen en la tabla subtareas
      if (['titulo', 'descripcion', 'estado', 'fecha_inicio', 'fecha_vencimiento', 'prioridad', 'id_tarea'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos válidos para actualizar' });
    }

    // Añadir el ID al final para la condición WHERE
    values.push(id);
    
    // Ejecutar la consulta
    const updateQuery = `UPDATE subtareas SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(updateQuery, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }

    console.log(`Subtarea ${id} actualizada`);
    res.status(200).json({ success: true, message: 'Subtarea actualizada con éxito' });
  } catch (error) {
    console.error('Error al actualizar subtarea:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar subtarea' });
  }
};

exports.deleteSubtask = async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = 'DELETE FROM subtareas WHERE id = ?';
    const [result] = await db.query(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Subtarea no encontrada' });
    }

    console.log(`Subtarea ${id} eliminada`);
    res.status(200).json({ success: true, message: 'Subtarea eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar subtarea:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar subtarea' });
  }
};