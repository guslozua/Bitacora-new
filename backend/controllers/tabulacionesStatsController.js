const pool = require('../config/db');

// Función para normalizar nombres de usuario
function normalizeUserName(userName) {
  if (!userName || typeof userName !== 'string') return 'Desconocido';
  
  // Convertir a minúsculas para comparaciones
  const normalized = userName.toLowerCase().trim();
  
  // Mapeo de nombres conocidos que deben unificarse
  const userMappings = {
    'sergio g lozua': 'Gustavo Lozua',
    'gustavo lozua': 'Gustavo Lozua',
    // Agregar más mapeos según sea necesario
    // 'juan c perez': 'Juan Carlos Perez',
    // 'j.c. perez': 'Juan Carlos Perez',
  };
  
  // Buscar si existe un mapeo directo
  if (userMappings[normalized]) {
    return userMappings[normalized];
  }
  
  // Si no hay mapeo directo, buscar por coincidencia parcial de apellidos
  for (const [key, value] of Object.entries(userMappings)) {
    const keyWords = key.split(' ');
    const normalizedWords = normalized.split(' ');
    
    // Si el apellido coincide (última palabra), usar el nombre mapeado
    const lastName = keyWords[keyWords.length - 1];
    if (normalizedWords.includes(lastName) && lastName.length > 3) {
      return value;
    }
  }
  
  // Si no hay coincidencias, devolver el nombre original con formato título
  return userName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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
    const ultimaActualizacionResult = await pool.query(`
      SELECT MAX(fecha_finalizacion) as ultima_fecha 
      FROM taskmanagementsystem.tabulaciones_data
    `);
    
    // Formateamos la fecha a dd/mm/yyyy
    let ultimaActualizacion = 'Fecha no disponible';
    if (ultimaActualizacionResult[0] && ultimaActualizacionResult[0][0]?.ultima_fecha) {
      const fechaUltima = new Date(ultimaActualizacionResult[0][0].ultima_fecha);
      if (!isNaN(fechaUltima.getTime())) {
        ultimaActualizacion = fechaUltima.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

    // 1. Total tareas
    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total FROM taskmanagementsystem.tabulaciones_data ${whereClause}`,
      [...params]
    );
    const total = totalResult[0][0].total;

    // 2. Finalizaciones por fecha (solo para tareas con fecha_finalizacion)
    const porFechaFinalResult = await pool.query(`
      SELECT CAST(fecha_finalizacion AS DATE) AS fecha, COUNT(*) AS cantidad
      FROM taskmanagementsystem.tabulaciones_data
      ${whereFinalizadas}
      GROUP BY CAST(fecha_finalizacion AS DATE)
      ORDER BY CAST(fecha_finalizacion AS DATE)
    `, [...params]);
    const porFechaFinal = porFechaFinalResult[0];

    // 3. Completado por usuario (MODIFICADO para normalizar nombres)
    const completadoPorRawResult = await pool.query(`
      SELECT 
        completado_por, 
        COUNT(*) AS cantidad
      FROM taskmanagementsystem.tabulaciones_data
      ${whereFinalizadas}
      AND completado_por IS NOT NULL AND completado_por != ''
      GROUP BY completado_por
      ORDER BY cantidad DESC
    `, [...params]);
    const completadoPorRaw = completadoPorRawResult[0];

    // Normalizar y reagrupar usuarios
    const usuariosNormalizados = {};
    completadoPorRaw.forEach(item => {
      const nombreNormalizado = normalizeUserName(item.completado_por);
      usuariosNormalizados[nombreNormalizado] = (usuariosNormalizados[nombreNormalizado] || 0) + item.cantidad;
    });

    // Convertir a array y ordenar
    const completadoPor = Object.entries(usuariosNormalizados)
      .map(([usuario, cantidad]) => ({ usuario, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // 4. Creado por usuario (TAMBIÉN normalizado)
    const creadoPorRawResult = await pool.query(`
      SELECT 
        creado_por, 
        COUNT(*) AS cantidad
      FROM taskmanagementsystem.tabulaciones_data
      ${baseWhere}
      AND creado_por IS NOT NULL AND creado_por != ''
      GROUP BY creado_por
      ORDER BY cantidad DESC
    `, [...params]);
    const creadoPorRaw = creadoPorRawResult[0];

    // Normalizar y reagrupar usuarios creadores
    const creadoresNormalizados = {};
    creadoPorRaw.forEach(item => {
      const nombreNormalizado = normalizeUserName(item.creado_por);
      creadoresNormalizados[nombreNormalizado] = (creadoresNormalizados[nombreNormalizado] || 0) + item.cantidad;
    });

    // Convertir a array y ordenar
    const creadoPor = Object.entries(creadoresNormalizados)
      .map(([usuario, cantidad]) => ({ usuario, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // 5. Obtener datos crudos para procesamiento avanzado
    const rawTabulacionesResult = await pool.query(`
      SELECT nombre_tarea
      FROM taskmanagementsystem.tabulaciones_data
      ${baseWhere}
      ORDER BY fecha_creacion DESC
    `, [...params]);
    const rawTabulaciones = rawTabulacionesResult[0];

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
    const diagnosticoResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN fecha_finalizacion IS NULL THEN 1 ELSE 0 END) AS sin_fecha_finalizacion,
        SUM(CASE WHEN completado_por IS NULL OR completado_por = '' THEN 1 ELSE 0 END) AS sin_completado_por,
        SUM(CASE WHEN creado_por IS NULL OR creado_por = '' THEN 1 ELSE 0 END) AS sin_creado_por,
        SUM(CASE WHEN nombre_tarea IS NULL OR nombre_tarea = '' THEN 1 ELSE 0 END) AS sin_nombre_tarea,
        COUNT(*) AS total_registros
      FROM taskmanagementsystem.tabulaciones_data
      ${baseWhere}
    `, [...params]);
    const diagnostico = diagnosticoResult[0][0];

    console.log('✅ Estadísticas de tabulaciones procesadas correctamente');
    console.log(`📊 Usuarios únicos completaron tareas: ${completadoPor.length}`);
    console.log(`📊 Usuarios únicos crearon tareas: ${creadoPor.length}`);

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
