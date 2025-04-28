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

    // NUEVO: Consulta para obtener la fecha de última actualización
    // Usamos la última fecha de finalización como indicador de última actualización
    const [ultimaActualizacionRes] = await pool.query(`
      SELECT MAX(fecha_finalizacion) as ultima_fecha 
      FROM tabulaciones_data
    `);
    
    // Formateamos la fecha a dd/mm/yyyy
    let ultimaActualizacion = 'Fecha no disponible';
    if (ultimaActualizacionRes[0]?.ultima_fecha) {
      const fechaUltima = new Date(ultimaActualizacionRes[0].ultima_fecha);
      if (!isNaN(fechaUltima.getTime())) {
        ultimaActualizacion = fechaUltima.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

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

    // 5. Obtener datos crudos para procesamiento avanzado
    const rawTabulaciones = (await pool.query(`
      SELECT nombre_tarea
      FROM tabulaciones_data
      ${baseWhere}
      ORDER BY fecha_creacion DESC
    `, [...params]))[0];

    // Extraer los árboles de tabulación mediante procesamiento en JS
    const arbolesConteo = {};
    rawTabulaciones.forEach(tarea => {
      if (!tarea.nombre_tarea) return;
      
      // Normalizar el nombre a minúsculas
      const nombreNormalizado = tarea.nombre_tarea.toLowerCase().trim();
      
      // Buscar patrones "tab.xxx" o "tab.xxx.xxx"
      const regexTab = /\b(tab\.[a-z0-9]+(\.[a-z0-9]+)?)\b/i;
      const matchTab = nombreNormalizado.match(regexTab);
      
      // Buscar variantes como "tap.xxx" (error común)
      const regexTap = /\b(tap\.[a-z0-9]+(\.[a-z0-9]+)?)\b/i;
      const matchTap = nombreNormalizado.match(regexTap);
      
      let arbol = null;
      
      if (matchTab) {
        arbol = matchTab[1];
      } else if (matchTap) {
        arbol = matchTap[1].replace('tap.', 'tab.');
      } else if (nombreNormalizado.includes('-')) {
        // Buscar después de un guión
        const partes = nombreNormalizado.split('-');
        for (const parte of partes) {
          const trimmed = parte.trim();
          if (trimmed.startsWith('tab.')) {
            const soloTab = trimmed.match(/tab\.[a-z0-9]+(\.[a-z0-9]+)?/i);
            arbol = soloTab ? soloTab[0] : trimmed;
            break;
          }
        }
      } else if (nombreNormalizado.includes('tab.')) {
        // Buscar "tab." en cualquier posición
        const inicio = nombreNormalizado.indexOf('tab.');
        let fin = nombreNormalizado.indexOf(' ', inicio);
        if (fin === -1) fin = nombreNormalizado.length;
        arbol = nombreNormalizado.substring(inicio, fin);
      } else if (nombreNormalizado.includes('customer')) {
        arbol = 'customer';
      } else if (nombreNormalizado.includes('soporte')) {
        arbol = 'soporte';
      }
      
      if (arbol) {
        // Normalizar el arbol (quitar números, versiones, etc.)
        arbol = arbol.replace(/\s+[0-9]+(\s+\([0-9]+\))?$/, '')  // "tab.xxx 1" o "tab.xxx 1 (1)"
                  .replace(/\s+V[0-9]+$/i, '')                    // "tab.xxx V123"
                  .replace(/\.xlsx$/, '')                         // extensiones
                  .trim();
        
        arbolesConteo[arbol] = (arbolesConteo[arbol] || 0) + 1;
      }
    });

    // Convertir conteo a array para el ranking
    const rankingTab = Object.entries(arbolesConteo)
      .map(([arbol, cantidad]) => ({ arbol, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

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
      rawTabulaciones,  // Incluir datos crudos para procesamiento en frontend
      diagnostico,
      ultimaActualizacion // NUEVO: Añadimos la fecha de última actualización
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de tabulaciones:', error);
    res.status(500).json({ error: 'Error procesando estadísticas: ' + error.message });
  }
};