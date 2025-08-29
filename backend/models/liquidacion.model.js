// models/liquidacion.model.js
const pool = require('../config/db');
const { Op } = require('./db.operators');

// Modelo de Liquidación de Guardia
const LiquidacionGuardia = {
  // Encontrar todas las liquidaciones con filtros opcionales
  findAll: async (options = {}) => {
    try {
      let query = `
        SELECT l.*
        FROM taskmanagementsystem.liquidaciones_guardia l
      `;
      
      const params = [];
      let whereClause = '';
      
      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];
        
        // Filtrar por periodo
        if (options.where.periodo) {
          conditions.push('l.periodo = ?');
          params.push(options.where.periodo);
        }
        
        // Filtrar por estado
        if (options.where.estado) {
          conditions.push('l.estado = ?');
          params.push(options.where.estado);
        }
        
        // Filtrar por fecha de generación
        if (options.where.fecha_generacion) {
          if (options.where.fecha_generacion[Op.gte]) {
            conditions.push('l.fecha_generacion >= ?');
            params.push(options.where.fecha_generacion[Op.gte]);
          } else if (options.where.fecha_generacion[Op.lte]) {
            conditions.push('l.fecha_generacion <= ?');
            params.push(options.where.fecha_generacion[Op.lte]);
          }
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause;
      
      // Ordenamiento
      if (options.order) {
        const [field, direction] = options.order[0];
        query += ` ORDER BY l.${field} ${direction}`;
      } else {
        query += ' ORDER BY l.fecha_generacion DESC';
      }
      
      const [rows] = await pool.query(query, params);
      
      // Para cada liquidación, obtener sus detalles por separado
      const liquidacionesConDetalles = await Promise.all(
        rows.map(async (liquidacion) => {
          const detalles = await LiquidacionGuardia.getDetallesByLiquidacionId(liquidacion.id);
          return {
            ...liquidacion,
            detalles: detalles
          };
        })
      );
      
      return liquidacionesConDetalles.map(row => LiquidacionGuardia.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar liquidaciones:', error);
      throw error;
    }
  },
  
  // Encontrar una liquidación por ID
  findByPk: async (id) => {
    try {
      const query = `
        SELECT l.*
        FROM taskmanagementsystem.liquidaciones_guardia l
        WHERE l.id = ?
      `;
      
      const [rows] = await pool.query(query, [id]);
      
      if (rows.length === 0) return null;
      
      // Obtener detalles de la liquidación por separado
      const detalles = await LiquidacionGuardia.getDetallesByLiquidacionId(id);
      
      const liquidacion = {
        ...rows[0],
        detalles: detalles
      };
      
      return LiquidacionGuardia.attachMethods(liquidacion);
    } catch (error) {
      console.error(`Error al buscar liquidación con ID ${id}:`, error);
      throw error;
    }
  },

  // Método helper para obtener detalles de una liquidación
  getDetallesByLiquidacionId: async (idLiquidacion) => {
    try {
      const query = `
        SELECT 
          ld.id,
          ld.id_incidente,
          ld.id_guardia,
          ld.usuario,
          ld.fecha,
          ld.total_minutos,
          ld.total_importe
        FROM taskmanagementsystem.liquidaciones_detalle ld
        WHERE ld.id_liquidacion = ?
        ORDER BY ld.fecha ASC
      `;
      
      const [detalles] = await pool.query(query, [idLiquidacion]);
      return detalles;
    } catch (error) {
      console.error(`Error al obtener detalles de liquidación ${idLiquidacion}:`, error);
      return [];
    }
  },
  
  // Crear una nueva liquidación
  create: async (data) => {
    try {
      const { 
        periodo, 
        fecha_generacion = new Date(), 
        estado = 'pendiente', 
        observaciones = null, 
        id_usuario_generacion = null,
        detalles = [] 
      } = data;
      
      // Validar que el período tenga el formato correcto (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(periodo)) {
        throw new Error('El período debe tener el formato YYYY-MM');
      }
      
      // Iniciar transacción
      await pool.query('START TRANSACTION');
      
      try {
        // Insertar liquidación
        const [resultLiquidacion] = await pool.query(
          'INSERT INTO taskmanagementsystem.liquidaciones_guardia (periodo, fecha_generacion, estado, observaciones, id_usuario_generacion) VALUES (?, ?, ?, ?, ?)',
          [periodo, fecha_generacion, estado, observaciones, id_usuario_generacion]
        );
        
        const liquidacionId = resultLiquidacion.insertId;
        
        // Si hay detalles, insertarlos
        if (Array.isArray(detalles) && detalles.length > 0) {
          for (const detalle of detalles) {
            await pool.query(
              'INSERT INTO taskmanagementsystem.liquidaciones_detalle (id_liquidacion, id_incidente, id_guardia, usuario, fecha, total_minutos, total_importe) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                liquidacionId, 
                detalle.id_incidente, 
                detalle.id_guardia,
                detalle.usuario,
                detalle.fecha,
                detalle.total_minutos || 0,
                detalle.total_importe || 0
              ]
            );
          }
        }
        
        // Confirmar transacción
        await pool.query('COMMIT');
        
        // Devolver la liquidación creada
        return LiquidacionGuardia.findByPk(liquidacionId);
      } catch (error) {
        // Revertir transacción en caso de error
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error al crear liquidación:', error);
      throw error;
    }
  },
  
  // Actualizar una liquidación existente
  update: async (id, values) => {
    try {
      const { periodo, fecha_generacion, estado, observaciones, id_usuario_generacion, detalles } = values;
      
      // Iniciar transacción
      await pool.query('START TRANSACTION');
      
      try {
        // Actualizar campos de la liquidación
        const updates = [];
        const params = [];
        
        if (periodo !== undefined) {
          // Validar que el período tenga el formato correcto (YYYY-MM)
          if (!/^\d{4}-\d{2}$/.test(periodo)) {
            throw new Error('El período debe tener el formato YYYY-MM');
          }
          updates.push('periodo = ?');
          params.push(periodo);
        }
        
        if (fecha_generacion !== undefined) {
          updates.push('fecha_generacion = ?');
          params.push(fecha_generacion);
        }
        
        if (estado !== undefined) {
          updates.push('estado = ?');
          params.push(estado);
        }
        
        if (observaciones !== undefined) {
          updates.push('observaciones = ?');
          params.push(observaciones);
        }

        if (id_usuario_generacion !== undefined) {
          updates.push('id_usuario_generacion = ?');
          params.push(id_usuario_generacion);
        }
        
        if (updates.length > 0) {
          params.push(id); // Para la cláusula WHERE
          
          await pool.query(
            `UPDATE taskmanagementsystem.liquidaciones_guardia SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
        }
        
        // Si hay detalles, actualizar la relación
        if (detalles !== undefined && Array.isArray(detalles)) {
          // Eliminar detalles existentes
          await pool.query('DELETE FROM taskmanagementsystem.liquidaciones_detalle WHERE id_liquidacion = ?', [id]);
          
          // Insertar nuevos detalles
          for (const detalle of detalles) {
            await pool.query(
              'INSERT INTO taskmanagementsystem.liquidaciones_detalle (id_liquidacion, id_incidente, id_guardia, usuario, fecha, total_minutos, total_importe) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                id, 
                detalle.id_incidente, 
                detalle.id_guardia,
                detalle.usuario,
                detalle.fecha,
                detalle.total_minutos || 0,
                detalle.total_importe || 0
              ]
            );
          }
        }
        
        // Confirmar transacción
        await pool.query('COMMIT');
        
        // Devolver la liquidación actualizada
        return LiquidacionGuardia.findByPk(id);
      } catch (error) {
        // Revertir transacción en caso de error
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error al actualizar liquidación:', error);
      throw error;
    }
  },
  
  // Eliminar una liquidación
  destroy: async (id) => {
    try {
      // Iniciar transacción
      await pool.query('START TRANSACTION');
      
      try {
        // Eliminar detalles asociados
        await pool.query('DELETE FROM taskmanagementsystem.liquidaciones_detalle WHERE id_liquidacion = ?', [id]);
        
        // Eliminar liquidación
        const [result] = await pool.query('DELETE FROM taskmanagementsystem.liquidaciones_guardia WHERE id = ?', [id]);
        
        // Confirmar transacción
        await pool.query('COMMIT');
        
        return result.affectedRows > 0;
      } catch (error) {
        // Revertir transacción en caso de error
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error al eliminar liquidación:', error);
      throw error;
    }
  },
  
  // Método para obtener estadísticas de liquidaciones
  getEstadisticas: async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_liquidaciones,
          SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN estado = 'aprobada' THEN 1 ELSE 0 END) as aprobadas,
          SUM(CASE WHEN estado = 'pagada' THEN 1 ELSE 0 END) as pagadas,
          SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas
        FROM taskmanagementsystem.liquidaciones_guardia
      `;
      
      const [result] = await pool.query(query);
      return result[0];
    } catch (error) {
      console.error('Error al obtener estadísticas de liquidaciones:', error);
      throw error;
    }
  },

  // Método para obtener liquidaciones por período
  findByPeriodo: async (periodo) => {
    try {
      return LiquidacionGuardia.findAll({
        where: { periodo }
      });
    } catch (error) {
      console.error(`Error al buscar liquidaciones del período ${periodo}:`, error);
      throw error;
    }
  },

  // Método para obtener liquidaciones recientes
  findRecent: async (limit = 10) => {
    try {
      return LiquidacionGuardia.findAll({
        order: [['fecha_generacion', 'DESC']],
        limit
      });
    } catch (error) {
      console.error('Error al obtener liquidaciones recientes:', error);
      throw error;
    }
  },
  
  // Método para adjuntar métodos a un objeto liquidación
  attachMethods: (liquidacion) => {
    // Añadir método update
    liquidacion.update = async function(values) {
      return LiquidacionGuardia.update(this.id, values);
    };
    
    // Añadir método destroy
    liquidacion.destroy = async function() {
      return LiquidacionGuardia.destroy(this.id);
    };

    // Añadir método para obtener detalles
    liquidacion.getDetalles = async function() {
      return LiquidacionGuardia.getDetallesByLiquidacionId(this.id);
    };
    
    return liquidacion;
  }
};

module.exports = LiquidacionGuardia;