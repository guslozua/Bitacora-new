// controllers/placasController.js
const db = require('../config/db');

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
    
    const result = await db.query(
      `SELECT * FROM taskmanagementsystem.placas ${where} ORDER BY fecha_inicio DESC`,
      params
    );
    
    const rows = result[0] || [];
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener placas:', error);
    res.status(500).json({ error: 'Error al obtener placas' });
  }
};

// Obtener una placa por ID
exports.getPlacaById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM taskmanagementsystem.placas WHERE id = ?',
      [req.params.id]
    );
    
    const rows = result[0] || [];
    
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
    
    // Función para procesar fechas
    const processDate = (dateValue) => {
      if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
        return null;
      }
      
      if (dateValue instanceof Date) {
        return dateValue.toISOString();
      }
      
      if (typeof dateValue === 'string') {
        try {
          const parsedDate = new Date(dateValue);
          if (isNaN(parsedDate.getTime())) {
            console.warn(`⚠️ Fecha inválida en placa: ${dateValue}, usando null`);
            return null;
          }
          return parsedDate.toISOString();
        } catch (error) {
          console.warn(`⚠️ Error parseando fecha en placa: ${dateValue}, usando null`);
          return null;
        }
      }
      
      return null;
    };
    
    // Procesar fechas
    const processedFechaInicio = processDate(fecha_inicio);
    const processedFechaCierre = processDate(fecha_cierre);
    
    // Calcular duración en minutos (si ambas fechas están presentes)
    let duracion = null;
    if (processedFechaInicio && processedFechaCierre) {
      const inicio = new Date(processedFechaInicio);
      const cierre = new Date(processedFechaCierre);
      
      // Validar que la fecha de cierre sea posterior a la de inicio
      if (cierre <= inicio) {
        return res.status(400).json({ 
          error: 'La fecha de cierre debe ser posterior a la fecha de inicio' 
        });
      }
      
      duracion = Math.round((cierre - inicio) / (1000 * 60)); // Duración en minutos
    }
    
    console.log('📝 Datos procesados para placa:');
    console.log(`   fecha_inicio: ${fecha_inicio} → ${processedFechaInicio}`);
    console.log(`   fecha_cierre: ${fecha_cierre} → ${processedFechaCierre}`);
    console.log(`   duracion: ${duracion} minutos`);
    
    const result = await db.query(
      `INSERT INTO taskmanagementsystem.placas (
        numero_placa, titulo, descripcion, impacto, 
        clase, sistema,
        fecha_inicio, fecha_cierre, duracion, cerrado_por, causa_resolutiva
      ) 
      OUTPUT INSERTED.id
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero_placa, titulo, descripcion, finalImpacto, 
        clase, sistema,
        processedFechaInicio, processedFechaCierre, duracion, cerrado_por, causa_resolutiva
      ]
    );
    
    res.status(201).json({
      id: result[0].insertId,
      message: 'Placa creada correctamente'
    });
  } catch (error) {
    console.error('Error al crear placa:', error);
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('duplicate key')) {
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
    
    // Función para procesar fechas
    const processDate = (dateValue) => {
      if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
        return null;
      }
      
      if (dateValue instanceof Date) {
        return dateValue.toISOString();
      }
      
      if (typeof dateValue === 'string') {
        try {
          const parsedDate = new Date(dateValue);
          if (isNaN(parsedDate.getTime())) {
            console.warn(`⚠️ Fecha inválida en update placa: ${dateValue}, usando null`);
            return null;
          }
          return parsedDate.toISOString();
        } catch (error) {
          console.warn(`⚠️ Error parseando fecha en update placa: ${dateValue}, usando null`);
          return null;
        }
      }
      
      return null;
    };
    
    // Procesar fechas
    const processedFechaInicio = processDate(fecha_inicio);
    const processedFechaCierre = processDate(fecha_cierre);
    
    // Calcular duración en minutos (si ambas fechas están presentes)
    let duracion = null;
    if (processedFechaInicio && processedFechaCierre) {
      const inicio = new Date(processedFechaInicio);
      const cierre = new Date(processedFechaCierre);
      
      // Validar que la fecha de cierre sea posterior a la de inicio
      if (cierre <= inicio) {
        return res.status(400).json({ 
          error: 'La fecha de cierre debe ser posterior a la fecha de inicio' 
        });
      }
      
      duracion = Math.round((cierre - inicio) / (1000 * 60)); // Duración en minutos
    }
    
    console.log('📝 Datos procesados para update placa:');
    console.log(`   fecha_inicio: ${fecha_inicio} → ${processedFechaInicio}`);
    console.log(`   fecha_cierre: ${fecha_cierre} → ${processedFechaCierre}`);
    console.log(`   duracion: ${duracion} minutos`);
    
    await db.query(
      `UPDATE taskmanagementsystem.placas SET
        numero_placa = ?, titulo = ?, descripcion = ?, impacto = ?,
        clase = ?, sistema = ?,
        fecha_inicio = ?, fecha_cierre = ?, duracion = ?, cerrado_por = ?, causa_resolutiva = ?
      WHERE id = ?`,
      [
        numero_placa, titulo, descripcion, finalImpacto,
        clase, sistema,
        processedFechaInicio, processedFechaCierre, duracion, cerrado_por, causa_resolutiva,
        req.params.id
      ]
    );
    
    res.json({ message: 'Placa actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar placa:', error);
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'Ya existe una placa con ese número' });
    }
    res.status(500).json({ error: 'Error al actualizar placa' });
  }
};

// Eliminar una placa
exports.deletePlaca = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM taskmanagementsystem.placas WHERE id = ?',
      [req.params.id]
    );
    
    const affectedRows = result[0].affectedRows;
    
    if (affectedRows === 0) {
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
    console.log('🔍 Iniciando getPlacasStats...');
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
    console.log('📊 Where clause:', where, 'Params:', params);
    
    // Total de placas
    const totalResult = await db.query(
      `SELECT COUNT(*) as total FROM taskmanagementsystem.placas ${where}`,
      params
    );
    const total = (totalResult[0] || [])[0]?.total || 0;
    
    // Distribución por clase
    const porClaseResult = await db.query(
      `SELECT clase, COUNT(*) as cantidad FROM taskmanagementsystem.placas ${where} GROUP BY clase`,
      params
    );
    const porClaseData = porClaseResult[0] || [];
    
    const porClase = {
      Incidente: 0,
      Comunicado: 0,
      Mantenimiento: 0
    };
    
    porClaseData.forEach(item => {
      if (porClase.hasOwnProperty(item.clase)) {
        porClase[item.clase] = item.cantidad;
      }
    });
    
    // Placas por impacto (solo incidentes)
    const impactoResult = await db.query(
      `SELECT impacto, COUNT(*) as cantidad FROM taskmanagementsystem.placas ${where ? where + ' AND' : 'WHERE'} clase = 'Incidente' AND impacto IS NOT NULL GROUP BY impacto`,
      params
    );
    const impactoData = impactoResult[0] || [];
    
    let impactoBajo = 0, impactoMedio = 0, impactoAlto = 0;
    impactoData.forEach(item => {
      if (item.impacto === 'bajo') impactoBajo = item.cantidad;
      if (item.impacto === 'medio') impactoMedio = item.cantidad;
      if (item.impacto === 'alto') impactoAlto = item.cantidad;
    });
    
    // Top sistemas con más placas
    const porSistemaResult = await db.query(
      `SELECT TOP 5 sistema, COUNT(*) as cantidad FROM taskmanagementsystem.placas ${where} GROUP BY sistema ORDER BY cantidad DESC`,
      params
    );
    const porSistemaData = porSistemaResult[0] || [];
    
    // Top usuarios que han cerrado más placas
    const usuariosQuery = where 
      ? `SELECT TOP 5 cerrado_por, COUNT(*) as cantidad FROM taskmanagementsystem.placas ${where} AND cerrado_por IS NOT NULL GROUP BY cerrado_por ORDER BY cantidad DESC`
      : `SELECT TOP 5 cerrado_por, COUNT(*) as cantidad FROM taskmanagementsystem.placas WHERE cerrado_por IS NOT NULL GROUP BY cerrado_por ORDER BY cantidad DESC`;
    
    const usuariosResult = await db.query(usuariosQuery, params);
    const usuariosData = usuariosResult[0] || [];
    
    // Estado de placas (resueltas vs pendientes)
    const estadoResult = await db.query(
      `SELECT 
        COUNT(CASE WHEN fecha_cierre IS NOT NULL THEN 1 END) as resueltas,
        COUNT(CASE WHEN fecha_cierre IS NULL THEN 1 END) as pendientes
       FROM taskmanagementsystem.placas ${where}`,
      params
    );
    const estadoData = (estadoResult[0] || [])[0] || { resueltas: 0, pendientes: 0 };
    
    // Duración promedio por impacto (estructura que espera el frontend)
    const duracionPorImpactoCompleto = [
      {
        impacto: 'alto',
        promedio: null,
        maximo: null,
        minimo: null,
        cantidad: impactoAlto
      },
      {
        impacto: 'medio', 
        promedio: null,
        maximo: null,
        minimo: null,
        cantidad: impactoMedio
      },
      {
        impacto: 'bajo',
        promedio: null,
        maximo: null,
        minimo: null,
        cantidad: impactoBajo
      }
    ];
    
    console.log('✅ Estadísticas calculadas:', {
      total,
      por_clase: porClase,
      estado: estadoData,
      duracion_por_impacto: duracionPorImpactoCompleto
    });
    
    res.json({
      total,
      por_clase: porClase,
      por_impacto: {
        bajo: impactoBajo,
        medio: impactoMedio,
        alto: impactoAlto
      },
      por_sistema: porSistemaData,
      por_mes: [],
      por_mes_cierre: [],
      duracion_promedio: 0,
      estado: {
        resueltas: estadoData.resueltas || 0,
        pendientes: estadoData.pendientes || 0
      },
      top_usuarios: usuariosData,
      duracion_por_impacto: duracionPorImpactoCompleto
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de placas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
