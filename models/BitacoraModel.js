// models/BitacoraModel.js
const db = require('../config/db');

// Obtener registros de bitácora con información relacionada
const obtenerBitacora = async (filtros) => {
    let sql = `
        SELECT b.*, 
               DATE_FORMAT(b.fecha, '%Y-%m-%d %H:%i:%s') as fecha_formateada,
               u.nombre as nombre_usuario,
               p.nombre as nombre_proyecto,
               t.titulo as nombre_tarea,
               s.titulo as nombre_subtarea
        FROM bitacora b
        LEFT JOIN Usuarios u ON b.id_usuario = u.id
        LEFT JOIN Proyectos p ON b.id_proyecto = p.id
        LEFT JOIN Tareas t ON b.id_tarea = t.id
        LEFT JOIN Subtareas s ON b.id_subtarea = s.id
        WHERE 1=1
    `;
    
    const params = [];
    
    // Agregar filtros si existen
    if (filtros.id_usuario) {
        sql += " AND b.id_usuario = ?";
        params.push(filtros.id_usuario);
    }
    
    if (filtros.id_proyecto) {
        sql += " AND b.id_proyecto = ?";
        params.push(filtros.id_proyecto);
    }
    
    if (filtros.id_tarea) {
        sql += " AND b.id_tarea = ?";
        params.push(filtros.id_tarea);
    }
    
    if (filtros.id_subtarea) {
        sql += " AND b.id_subtarea = ?";
        params.push(filtros.id_subtarea);
    }
    
    sql += " ORDER BY b.fecha DESC";
    
    const [rows] = await db.query(sql, params);
    return rows;
};

// Registrar un nuevo evento en la bitácora
const registrarEvento = async (tipo_evento, descripcion, id_usuario, id_proyecto, id_tarea, id_subtarea) => {
    const sql = `
        INSERT INTO bitacora (tipo_evento, descripcion, id_usuario, id_proyecto, id_tarea, id_subtarea, fecha)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await db.query(sql, [
        tipo_evento, 
        descripcion, 
        id_usuario, 
        id_proyecto || null, 
        id_tarea || null, 
        id_subtarea || null
    ]);
    
    return result;
};

module.exports = {
    obtenerBitacora,
    registrarEvento
};