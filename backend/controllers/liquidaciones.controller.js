// controllers/liquidaciones.controller.js
const pool = require('../config/db');

const generarLiquidacionMensual = async (periodo) => {
  try {
    // Formato del periodo: 'YYYY-MM'
    const [año, mes] = periodo.split('-');
    
    // Fechas de inicio y fin del período
    const fechaInicio = new Date(parseInt(año), parseInt(mes) - 1, 1);
    const fechaFin = new Date(parseInt(año), parseInt(mes), 0); // Último día del mes
    
    // Verificar si ya existe una liquidación para este período
    const [liquidacionesExistentes] = await pool.query(
      'SELECT * FROM liquidaciones_guardia WHERE periodo = ?',
      [periodo]
    );
    
    if (liquidacionesExistentes.length > 0) {
      throw new Error(`Ya existe una liquidación para el período ${periodo}`);
    }
    
    // Obtener incidentes aprobados en el período que no estén liquidados
    const [incidentes] = await pool.query(`
      SELECT i.*, g.fecha as fecha_guardia, g.usuario as usuario_guardia
      FROM incidentes_guardia i
      JOIN guardias g ON i.id_guardia = g.id
      WHERE i.estado = 'aprobado'
      AND i.inicio >= ? AND i.fin <= ?
    `, [fechaInicio, fechaFin]);
    
    if (incidentes.length === 0) {
      throw new Error(`No hay incidentes aprobados para liquidar en el período ${periodo}`);
    }
    
    // Crear la cabecera de liquidación
    const [resultLiquidacion] = await pool.query(
      'INSERT INTO liquidaciones_guardia (periodo, fecha_generacion, estado) VALUES (?, NOW(), ?)',
      [periodo, 'pendiente']
    );
    
    const liquidacionId = resultLiquidacion.insertId;
    
    // Agrupar incidentes por usuario
    const incidentesPorUsuario = {};
    
    incidentes.forEach(incidente => {
      const usuario = incidente.usuario_guardia;
      
      if (!incidentesPorUsuario[usuario]) {
        incidentesPorUsuario[usuario] = [];
      }
      
      incidentesPorUsuario[usuario].push(incidente);
    });
    
    // Crear detalles de liquidación para cada usuario
    for (const [usuario, incidentesUsuario] of Object.entries(incidentesPorUsuario)) {
      let totalMinutos = 0;
      let totalImporte = 0;
      
      // Para cada incidente, obtener sus códigos aplicados
      for (const incidente of incidentesUsuario) {
        const [codigos] = await pool.query(`
          SELECT ic.*, cf.codigo, cf.descripcion
          FROM incidentes_codigos ic
          JOIN codigos_facturacion cf ON ic.id_codigo = cf.id
          WHERE ic.id_incidente = ?
        `, [incidente.id]);
        
        // Calcular totales para este incidente
        codigos.forEach(codigo => {
          totalMinutos += codigo.minutos;
          if (codigo.importe) {
            totalImporte += parseFloat(codigo.importe);
          }
        });
        
        // Actualizar el estado del incidente a 'liquidado'
        await pool.query(
          'UPDATE incidentes_guardia SET estado = ? WHERE id = ?',
          ['liquidado', incidente.id]
        );
      }
      
      // Crear registro de detalle de liquidación
      await pool.query(`
        INSERT INTO liquidaciones_detalle (
          id_liquidacion, id_incidente, id_guardia, usuario, fecha, total_minutos, total_importe
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        liquidacionId,
        incidentesUsuario[0].id, // Usamos el primer incidente como referencia
        incidentesUsuario[0].id_guardia,
        usuario,
        incidentesUsuario[0].fecha_guardia,
        totalMinutos,
        totalImporte
      ]);
    }
    
    return { liquidacionId, totalIncidentes: incidentes.length };
  } catch (error) {
    console.error('Error al generar liquidación mensual:', error);
    throw error;
  }
};

// Endpoint para generar liquidación
exports.generarLiquidacion = async (req, res) => {
  try {
    const { periodo } = req.body;
    
    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un período válido en formato YYYY-MM'
      });
    }
    
    const resultado = await generarLiquidacionMensual(periodo);
    
    res.status(200).json({
      success: true,
      message: `Liquidación para el período ${periodo} generada correctamente`,
      data: resultado
    });
  } catch (error) {
    console.error('Error al generar liquidación:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al generar liquidación',
      error: error.message
    });
  }
};

// FUNCIONES FALTANTES QUE NECESITAS AGREGAR:

// Obtener todas las liquidaciones
exports.getLiquidaciones = async (req, res) => {
  try {
    const { periodo, estado, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM liquidaciones_guardia WHERE 1=1';
    const params = [];
    
    if (periodo) {
      query += ' AND periodo = ?';
      params.push(periodo);
    }
    
    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }
    
    query += ' ORDER BY fecha_generacion DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [liquidaciones] = await pool.execute(query, params);
    
    res.status(200).json({
      success: true,
      data: liquidaciones
    });
  } catch (error) {
    console.error('Error al obtener liquidaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener liquidaciones',
      error: error.message
    });
  }
};

// Obtener una liquidación por ID
exports.getLiquidacionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [liquidaciones] = await pool.execute(
      'SELECT * FROM liquidaciones_guardia WHERE id = ?',
      [id]
    );
    
    if (liquidaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Liquidación no encontrada'
      });
    }
    
    // Obtener detalles de la liquidación
    const [detalles] = await pool.execute(
      'SELECT * FROM liquidaciones_detalle WHERE id_liquidacion = ?',
      [id]
    );
    
    const liquidacion = {
      ...liquidaciones[0],
      detalles
    };
    
    res.status(200).json({
      success: true,
      data: liquidacion
    });
  } catch (error) {
    console.error('Error al obtener liquidación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener liquidación',
      error: error.message
    });
  }
};

// Cambiar estado de liquidación
exports.cambiarEstadoLiquidacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const estadosValidos = ['pendiente', 'aprobada', 'pagada', 'cancelada'];
    
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Estados permitidos: ' + estadosValidos.join(', ')
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE liquidaciones_guardia SET estado = ? WHERE id = ?',
      [estado, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Liquidación no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Estado de liquidación actualizado correctamente',
      data: { id, estado }
    });
  } catch (error) {
    console.error('Error al cambiar estado de liquidación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de liquidación',
      error: error.message
    });
  }
};

module.exports = exports;