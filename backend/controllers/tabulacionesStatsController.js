const pool = require('../config/db');

exports.getTabulacionesStats = async (req, res) => {
  try {
    const year = req.query.year;
    const month = req.query.month;

    const filtros = [];
    const params = [];

    if (year && year !== 'all') {
      filtros.push('YEAR(fecha_finalizacion) = ?');
      params.push(year);
    }

    if (month && month !== 'all') {
      filtros.push('MONTH(fecha_finalizacion) = ?');
      params.push(month);
    }

    const whereClause = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    
    // Modificado para incluir sólo registros con fecha_finalizacion válida
    const baseWhere = whereClause || 'WHERE 1=1';
    const whereFinalizadas = `${baseWhere} AND fecha_finalizacion IS NOT NULL`;

    // 1. Total tareas
    const total = (await pool.query(
      `SELECT COUNT(*) AS total FROM tabulaciones_data ${whereClause}`,
      [...params]
    ))[0][0].total;

    // 2. Finalizaciones por fecha (solo para tareas con fecha_finalizacion)
    const porFechaFinal = (await pool.query(`
      SELECT DATE(fecha_finalizacion) AS fecha, COUNT(*) AS cantidad
      FROM tabulaciones_data
      ${whereFinalizadas}
      GROUP BY fecha
      ORDER BY fecha
    `, [...params]))[0];

    // 3. Completado por usuario (solo para tareas con completado_por no nulo)
    const completadoPor = (await pool.query(`
      SELECT 
        COALESCE(completado_por, 'Desconocido') AS usuario, 
        COUNT(*) AS cantidad
      FROM tabulaciones_data
      ${whereFinalizadas}
      AND completado_por IS NOT NULL AND completado_por != ''
      GROUP BY completado_por
      ORDER BY cantidad DESC
    `, [...params]))[0];

    // 4. Creado por usuario
    const creadoPor = (await pool.query(`
      SELECT 
        COALESCE(creado_por, 'Desconocido') AS usuario, 
        COUNT(*) AS cantidad
      FROM tabulaciones_data
      ${baseWhere}
      AND creado_por IS NOT NULL AND creado_por != ''
      GROUP BY creado_por
      ORDER BY cantidad DESC
    `, [...params]))[0];

    // 5. Ranking árboles (por nombre)
    const rankingTab = (await pool.query(`
      SELECT 
        SUBSTRING_INDEX(SUBSTRING_INDEX(nombre_tarea, 'Tab.', -1), ' ', 1) AS arbol,
        COUNT(*) AS cantidad
      FROM tabulaciones_data
      ${baseWhere}
      AND nombre_tarea LIKE '%Tab.%'
      GROUP BY arbol
      ORDER BY cantidad DESC
      LIMIT 20
    `, [...params]))[0];

    // Añadir información de diagnóstico
    const diagnostico = (await pool.query(`
      SELECT 
        SUM(CASE WHEN fecha_finalizacion IS NULL THEN 1 ELSE 0 END) AS sin_fecha_finalizacion,
        SUM(CASE WHEN completado_por IS NULL OR completado_por = '' THEN 1 ELSE 0 END) AS sin_completado_por,
        SUM(CASE WHEN creado_por IS NULL OR creado_por = '' THEN 1 ELSE 0 END) AS sin_creado_por,
        SUM(CASE WHEN nombre_tarea IS NULL OR nombre_tarea = '' THEN 1 ELSE 0 END) AS sin_nombre_tarea,
        COUNT(*) AS total_registros
      FROM tabulaciones_data
      ${baseWhere}
    `, [...params]))[0][0];

    res.json({
      total,
      porFechaFinal,
      completadoPor,
      creadoPor,
      rankingTab,
      diagnostico
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de tabulaciones:', error);
    res.status(500).json({ error: 'Error procesando estadísticas: ' + error.message });
  }
};