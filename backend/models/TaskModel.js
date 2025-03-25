//models/TaskModel.js
const pool = require('../config/db');

const TaskModel = {
    createTask: async (titulo, descripcion, estado, prioridad, fecha_vencimiento, id_proyecto, id_usuario_asignado) => {
        const sql = 'INSERT INTO Tareas (titulo, descripcion, estado, prioridad, fecha_vencimiento, id_proyecto, id_usuario_asignado) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [titulo, descripcion, estado, prioridad, fecha_vencimiento, id_proyecto, id_usuario_asignado]);
        return result;
    },
    
    getAllTasks: async () => {
        const sql = 'SELECT * FROM Tareas';
        const [rows] = await pool.query(sql);
        return rows;
    },
    
    getTasksByFilter: async (sql, params) => {
        const [rows] = await pool.query(sql, params);
        return rows;
    },
    
    getTaskById: async (id) => {
        const sql = 'SELECT * FROM Tareas WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        return rows;
    },
    
    updateTask: async (id, titulo, descripcion, estado, prioridad, fecha_vencimiento, id_usuario_asignado) => {
        const sql = 'UPDATE Tareas SET titulo = ?, descripcion = ?, estado = ?, prioridad = ?, fecha_vencimiento = ?, id_usuario_asignado = ? WHERE id = ?';
        const [result] = await pool.query(sql, [titulo, descripcion, estado, prioridad, fecha_vencimiento, id_usuario_asignado, id]);
        return result;
    },
    
    deleteTask: async (id) => {
        const sql = 'DELETE FROM Tareas WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result;
    }
};

module.exports = TaskModel;