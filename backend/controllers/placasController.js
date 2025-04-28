// controllers/placasController.js
const pool = require('../config/db');

// Obtener todas las placas con filtros opcionales
exports.getPlacas = async (req, res) => {
  try {
    const { year, month, numero_placa, titulo, impacto, clase, sistema } = req.query;
    
    const conditions = [];
    const params = [];
    
    if (numero_placa) {
      conditions.push('numero_placa LIKE ?');
      params.push(`%${numero_placa}%`);
    }
    
    if (titulo) {
      conditions.push('titulo LIKE ?');
      params.push(`%${titulo}%`);
    }
    
    if (impacto && impacto !== 'all') {
      conditions.push('impacto = ?');
      params.push(impacto);
    }
    
    if (clase && clase !== 'all') {
      conditions.push('clase = ?');
      params.push(clase);
    }
    
    if (sistema && sistema !== 'all') {
      conditions.push('sistema = ?');
      params.push(sistema);
    }
    
    if (year && year !== 'all') {
      conditions.push('YEAR(fecha_inicio) = ?');
      params.push(year);
    }
    
    if (month && month !== 'all') {
      conditions.push('MONTH(fecha_inicio) = ?');
      params.push(month);
    }
    
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const [rows] = await pool.query(
      `SELECT * FROM placas ${where} ORDER BY fecha_inicio DESC`,
      params
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener placas:', error);
    res.status(500).json({ error: 'Error al obtener placas' });
  }
};

// Obtener una placa por ID
exports.getPlacaById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM placas WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Placa no encontrada' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener placa:', error);
    res.status(500).json({ error: 'Error al obtener placa' });
  }
};

// Crear una nueva placa
exports.createPlaca = async (req, res) => {
  try {
    const {
      numero_placa,
      titulo,
      descripcion,
      impacto,
      clase,
      sistema,
      fecha_inicio,
      fecha_cierre,
      cerrado_por,
      causa_resolutiva
    } = req.body;
    
    // Validaciones adicionales
    if (!clase) {
      return res.status(400).json({ error: 'La clase es obligatoria' });
    }
    
    if (!sistema) {
      return res.status(400).json({ error: 'El sistema es obligatorio' });
    }
    
    // Para incidentes, el impacto es obligatorio
    if (clase === 'Incidente' && !impacto) {
      return res.status(400).json({ error: 'El impacto es obligatorio para incidentes' });
    }
    
    // Para comunicados y mantenimientos, el impacto debe ser null
    const finalImpacto = clase === 'Incidente' ? impacto : null;
    
    // Calcular duración en minutos (si ambas fechas están presentes)
    let duracion = null;
    if (fecha_inicio && fecha_cierre) {
      const inicio = new Date(fecha_inicio);
      const cierre = new Date(fecha_cierre);
      
      // Validar que la fecha de cierre sea posterior a la de inicio
      if (cierre <= inicio) {
        return res.status(400).json({ 
          error: 'La fecha de cierre debe ser posterior a la fecha de inicio' 
        });
      }
      
      duracion = Math.round((cierre - inicio) / (1000 * 60)); // Duración en minutos
    }
    
    const [result] = await pool.query(
      `INSERT INTO placas (
        numero_placa, titulo, descripcion, impacto, 
        clase, sistema,
        fecha_inicio, fecha_cierre, duracion, cerrado_por, causa_resolutiva
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero_placa, titulo, descripcion, finalImpacto, 
        clase, sistema,
        fecha_inicio, fecha_cierre, duracion, cerrado_por, causa_resolutiva
      ]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Placa creada correctamente'
    });
  } catch (error) {
    console.error('Error al crear placa:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una placa con ese número' });
    }
    res.status(500).json({ error: 'Error al crear placa' });
  }
};

// Actualizar una placa
exports.updatePlaca = async (req, res) => {
  try {
    const {
      numero_placa,
      titulo,
      descripcion,
      impacto,
      clase,
      sistema,
      fecha_inicio,
      fecha_cierre,
      cerrado_por,
      causa_resolutiva
    } = req.body;
    
    // Validaciones adicionales
    if (!clase) {
      return res.status(400).json({ error: 'La clase es obligatoria' });
    }
    
    if (!sistema) {
      return res.status(400).json({ error: 'El sistema es obligatorio' });
    }
    
    // Para incidentes, el impacto es obligatorio
    if (clase === 'Incidente' && !impacto) {
      return res.status(400).json({ error: 'El impacto es obligatorio para incidentes' });
    }
    
    // Para comunicados y mantenimientos, el impacto debe ser null
    const finalImpacto = clase === 'Incidente' ? impacto : null;
    
    // Calcular duración en minutos (si ambas fechas están presentes)
    let duracion = null;
    if (fecha_inicio && fecha_cierre) {
      const inicio = new Date(fecha_inicio);
      const cierre = new Date(fecha_cierre);
      
      // Validar que la fecha de cierre sea posterior a la de inicio
      if (cierre <= inicio) {
        return res.status(400).json({ 
          error: 'La fecha de cierre debe ser posterior a la fecha de inicio' 
        });
      }
      
      duracion = Math.round((cierre - inicio) / (1000 * 60)); // Duración en minutos
    }
    
    await pool.query(
      `UPDATE placas SET
        numero_placa = ?, titulo = ?, descripcion = ?, impacto = ?,
        clase = ?, sistema = ?,
        fecha_inicio = ?, fecha_cierre = ?, duracion = ?, cerrado_por = ?, causa_resolutiva = ?
      WHERE id = ?`,
      [
        numero_placa, titulo, descripcion, finalImpacto,
        clase, sistema,
        fecha_inicio, fecha_cierre, duracion, cerrado_por, causa_resolutiva,
        req.params.id
      ]
    );
    
    res.json({ message: 'Placa actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar placa:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una placa con ese número' });
    }
    res.status(500).json({ error: 'Error al actualizar placa' });
  }
};

// Eliminar una placa
exports.deletePlaca = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM placas WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Placa no encontrada' });
    }
    
    res.json({ message: 'Placa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar placa:', error);
    res.status(500).json({ error: 'Error al eliminar placa' });
  }
};

// Obtener estadísticas para el dashboard
exports.getPlacasStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const conditions = [];
    const params = [];
    
    if (year && year !== 'all') {
      conditions.push('YEAR(fecha_inicio) = ?');
      params.push(year);
    }
    
    if (month && month !== 'all') {
      conditions.push('MONTH(fecha_inicio) = ?');
      params.push(month);
    }
    
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Total de placas
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total FROM placas ${where}`,
      params
    );
    const total = totalResult[0].total;
    
    // Distribución por clase
    const [porClaseResult] = await pool.query(
      `SELECT clase, COUNT(*) as cantidad FROM placas ${where} GROUP BY clase`,
      params
    );
    
    // Extraer conteo por clase
    const porClase = {
      Incidente: 0,
      Comunicado: 0,
      Mantenimiento: 0
    };
    
    porClaseResult.forEach(item => {
      if (porClase.hasOwnProperty(item.clase)) {
        porClase[item.clase] = item.cantidad;
      }
    });
    
    // Placas por nivel de impacto (solo para Incidentes)
    const impactoConditions = [...conditions];
    impactoConditions.push('clase = "Incidente"');
    
    const impactoWhere = impactoConditions.length 
      ? `WHERE ${impactoConditions.join(' AND ')}` 
      : 'WHERE clase = "Incidente"';
    
    const impactoParams = conditions.length 
      ? [...params, 'Incidente'] 
      : ['Incidente'];
    
    const [impactoResult] = await pool.query(
      `SELECT impacto, COUNT(*) as cantidad FROM placas ${impactoWhere} GROUP BY impacto`,
      impactoParams
    );
    
    // Obtener conteo por impacto (o 0 si no hay)
    const impactoBajo = impactoResult.find(i => i.impacto === 'bajo')?.cantidad || 0;
    const impactoMedio = impactoResult.find(i => i.impacto === 'medio')?.cantidad || 0;
    const impactoAlto = impactoResult.find(i => i.impacto === 'alto')?.cantidad || 0;
    
    // Placas por sistema
    const [porSistemaResult] = await pool.query(
      `SELECT sistema, COUNT(*) as cantidad FROM placas ${where} GROUP BY sistema ORDER BY cantidad DESC LIMIT 10`,
      params
    );
    
    // SECCIÓN CORREGIDA: Placas por mes
    // Determinar el año para las consultas (tanto apertura como cierre)
    let yearFilter = year;
    if (!yearFilter || yearFilter === 'all') {
      // Si no hay año seleccionado, usar el año actual
      const currentDate = new Date();
      yearFilter = currentDate.getFullYear().toString();
    }

    // Consulta para placas por mes (fecha de apertura)
    let porMesAperturaQuery = `
      SELECT MONTH(fecha_inicio) as mes, COUNT(*) as cantidad 
      FROM placas 
      WHERE YEAR(fecha_inicio) = ?
    `;

    let porMesAperturaParams = [yearFilter];

    // Si hay filtro de mes para apertura, aplicarlo
    if (month && month !== 'all') {
      porMesAperturaQuery += ` AND MONTH(fecha_inicio) = ?`;
      porMesAperturaParams.push(month);
    }

    porMesAperturaQuery += ` GROUP BY mes ORDER BY mes`;

    // Consulta para placas por mes (fecha de cierre)
    let porMesCierreQuery = `
      SELECT MONTH(fecha_cierre) as mes, COUNT(*) as cantidad 
      FROM placas 
      WHERE fecha_cierre IS NOT NULL AND YEAR(fecha_cierre) = ?
    `;

    let porMesCierreParams = [yearFilter];

    // Si hay filtro de mes para cierre, aplicarlo
    if (month && month !== 'all') {
      porMesCierreQuery += ` AND MONTH(fecha_cierre) = ?`;
      porMesCierreParams.push(month);
    }

    porMesCierreQuery += ` GROUP BY mes ORDER BY mes`;

    // Añadir logs para depuración
    console.log("Filtros aplicados - Año:", yearFilter, "Mes:", month || "todos");
    console.log("Query apertura:", porMesAperturaQuery, "Params:", porMesAperturaParams);
    console.log("Query cierre:", porMesCierreQuery, "Params:", porMesCierreParams);

    // Ejecutar ambas consultas
    const [porMesAperturaResult] = await pool.query(porMesAperturaQuery, porMesAperturaParams);
    const [porMesCierreResult] = await pool.query(porMesCierreQuery, porMesCierreParams);
    
    // Duración promedio general (de todas las placas cerradas)
    let duracionQuery = `
      SELECT AVG(duracion) as promedio_duracion 
      FROM placas 
    `;
    
    if (conditions.length > 0) {
      duracionQuery += `${where} AND duracion IS NOT NULL`;
    } else {
      duracionQuery += `WHERE duracion IS NOT NULL`;
    }
    
    const [duracionResult] = await pool.query(duracionQuery, params);
    const promedioDuracion = Math.round(duracionResult[0].promedio_duracion || 0);
    
    // Placas resueltas vs pendientes
    const [estadoResult] = await pool.query(
      `SELECT 
        COUNT(CASE WHEN fecha_cierre IS NOT NULL THEN 1 END) as resueltas,
        COUNT(CASE WHEN fecha_cierre IS NULL THEN 1 END) as pendientes
       FROM placas ${where}`,
      params
    );
    
    // Top 5 usuarios que han cerrado más placas
    let usuariosQuery = `
      SELECT cerrado_por, COUNT(*) as cantidad 
      FROM placas 
    `;
    
    if (conditions.length > 0) {
      usuariosQuery += `${where} AND cerrado_por IS NOT NULL`;
    } else {
      usuariosQuery += `WHERE cerrado_por IS NOT NULL`;
    }
    
    usuariosQuery += ` GROUP BY cerrado_por ORDER BY cantidad DESC LIMIT 5`;
    
    const [usuariosResult] = await pool.query(usuariosQuery, params);
    
    // ACTUALIZADO: Duración promedio, máxima y mínima por nivel de impacto (solo para incidentes)
    let duracionPorImpactoQuery = `
      SELECT 
        impacto, 
        ROUND(AVG(duracion)) as promedio, 
        MAX(duracion) as maximo, 
        MIN(duracion) as minimo,
        COUNT(*) as cantidad
      FROM placas 
      WHERE duracion IS NOT NULL AND clase = 'Incidente'
    `;
    
    if (conditions.length > 0) {
      duracionPorImpactoQuery = `
        SELECT 
          impacto, 
          ROUND(AVG(duracion)) as promedio, 
          MAX(duracion) as maximo, 
          MIN(duracion) as minimo,
          COUNT(*) as cantidad
        FROM placas 
        WHERE duracion IS NOT NULL AND clase = 'Incidente' AND ${conditions.join(' AND ')}
      `;
    }
    
    duracionPorImpactoQuery += ` GROUP BY impacto`;
    
    const [duracionPorImpactoResult] = await pool.query(duracionPorImpactoQuery, params);
    
    // NUEVO: Asegurarse de que todos los niveles de impacto estén incluidos
    const impactosRequeridos = ['alto', 'medio', 'bajo'];
    const duracionPorImpactoCompleto = impactosRequeridos.map(impacto => {
      // Busca si el nivel de impacto ya está en los resultados
      const existente = duracionPorImpactoResult.find(item => item.impacto === impacto);
      
      if (existente) {
        return existente; // Si existe, úsalo tal cual
      } else {
        // Si no existe, crea un objeto con valores null
        return {
          impacto,
          promedio: null,
          maximo: null,
          minimo: null,
          cantidad: 0
        };
      }
    });
    
    res.json({
      total,
      por_clase: porClase,
      por_impacto: {
        bajo: impactoBajo,
        medio: impactoMedio,
        alto: impactoAlto
      },
      por_sistema: porSistemaResult,
      por_mes: porMesAperturaResult,
      por_mes_cierre: porMesCierreResult,
      duracion_promedio: promedioDuracion,
      estado: {
        resueltas: estadoResult[0].resueltas,
        pendientes: estadoResult[0].pendientes
      },
      top_usuarios: usuariosResult,
      duracion_por_impacto: duracionPorImpactoCompleto
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de placas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};