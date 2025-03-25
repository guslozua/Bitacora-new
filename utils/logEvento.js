const db = require('../config/db');

/**
 * Registra un evento en la bitácora con manejo simplificado de datos
 * @param {Object} params - Parámetros del evento
 */
const logEvento = async (params) => {
    try {
        const {
            tipo_evento,
            descripcion,
            id_usuario,
            nombre_usuario = null,
            id_proyecto = null,
            nombre_proyecto = null,
            id_tarea = null,
            nombre_tarea = null,
            id_subtarea = null,
            nombre_subtarea = null
        } = params;

        // Validación básica
        if (!tipo_evento || !descripcion || !id_usuario) {
            console.error('Error en logEvento: Faltan parámetros obligatorios', params);
            throw new Error('Tipo de evento, descripción y usuario son obligatorios');
        }

        // Log para depuración
        console.log('Insertando en bitácora:', {
            tipo_evento,
            descripcion,
            id_usuario,
            nombre_usuario,
            id_proyecto,
            nombre_proyecto,
            id_tarea,
            nombre_tarea,
            id_subtarea,
            nombre_subtarea
        });

        // Inserción en la tabla bitácora
        const sql = `
        INSERT INTO bitacora
        (tipo_evento, descripcion, id_usuario, nombre_usuario, id_proyecto, nombre_proyecto,
         id_tarea, nombre_tarea, id_subtarea, nombre_subtarea, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await db.query(sql, [
            tipo_evento,
            descripcion,
            id_usuario,
            nombre_usuario, // Este valor debe coincidir con la columna 'nombre_usuario'
            id_proyecto,
            nombre_proyecto, // Este valor debe coincidir con la columna 'nombre_proyecto'
            id_tarea,
            nombre_tarea, // Este valor debe coincidir con la columna 'nombre_tarea'
            id_subtarea,
            nombre_subtarea // Este valor debe coincidir con la columna 'nombre_subtarea'
        ]);

        return result;
    } catch (error) {
        console.error('Error al registrar evento en bitácora:', error);
    }
};

module.exports = logEvento;
