// models/liquidacion-detalle.model.js
const pool = require('../config/db');
const { Op } = require('./db.operators');

// Modelo de Detalle de Liquidación
const LiquidacionDetalle = {
  // Encontrar todos los detalles con filtros opcionales
  findAll: async (options = {}) => {
    try {
      let query = 'SELECT * FROM liquidaciones_detalle';
      const params = [];
      let whereClause = '';
      
      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];
        
        // Filtrar por ID de liquidación
        if (options.where.id_liquidacion) {
          if (Array.isArray(options.where.id_liquidacion) && options.where.id_liquidacion[Op.in]) {
            conditions.push(`id_liquidacion IN (${options.where.id_liquidacion[Op.in].map(() => '?').join(', ')})`);
            params.push(...options.where.id_liquidacion[Op.in]);
          } else {
            conditions.push('id_liquidacion = ?');
            params.push(options.where.id_liquidacion);
          }
        }
        
        // Filtrar por ID de incidente
        if (options.where.id_incidente) {
          conditions.push('id_incidente = ?');
          params.push(options.where.id_incidente);
        }
        
        // Filtrar por ID de guardia
        if (options.where.id_guardia) {
          conditions.push('id_guardia = ?');
          params.push(options.where.id_guardia);
        }
        
        // Filtrar por usuario
        if (options.where.usuario) {
          if (options.where.usuario[Op.like]) {
            conditions.push('usuario LIKE ?');
            params.push(options.where.usuario[Op.like]);
          } else {
            conditions.push('usuario = ?');
            params.push(options.where.usuario);
          }
        }
        
        // Filtrar por fecha
        if (options.where.fecha) {
          if (options.where.fecha[Op.between]) {
            conditions.push('fecha BETWEEN ? AND ?');
            params.push(options.where.fecha[Op.between][0], options.where.fecha[Op.between][1]);
          } else {
            conditions.push('fecha = ?');
            params.push(options.where.fecha);
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
        query += ` ORDER BY ${field} ${direction}`;
      } else {
        query += ' ORDER BY id_liquidacion ASC, usuario ASC';
      }
      
      const [rows] = await pool.query(query, params);
      
      return rows.map(row => LiquidacionDetalle.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar detalles de liquidación:', error);
      throw error;
    }
  },
  
  // Encontrar un detalle por ID
  findByPk: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM liquidaciones_detalle WHERE id = ?', [id]);
      
      if (rows.length === 0) return null;
      
      return LiquidacionDetalle.attachMethods(rows[0]);
    } catch (error) {
      console.error(`Error al buscar detalle de liquidación con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Crear un nuevo detalle de liquidación
  create: async (data) => {
    try {
      const { 
        id_liquidacion, 
        id_incidente, 
        id_guardia, 
        usuario, 
        fecha, 
        total_minutos = 0, 
        total_importe = 0 
      } = data;
      
      const [result] = await pool.query(
        'INSERT INTO liquidaciones_detalle (id_liquidacion, id_incidente, id_guardia, usuario, fecha, total_minutos, total_importe) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id_liquidacion, id_incidente, id_guardia, usuario, fecha, total_minutos, total_importe]
      );
      
      const detalleId = result.insertId;
      
      return LiquidacionDetalle.findByPk(detalleId);
    } catch (error) {
      console.error('Error al crear detalle de liquidación:', error);
      throw error;
    }
  },
  
  // Actualizar un detalle de liquidación existente
  update: async (id, values) => {
    try {
      const { id_incidente, id_guardia, usuario, fecha, total_minutos, total_importe } = values;
      
      // Actualizar campos del detalle
      const updates = [];
      const params = [];
      
      if (id_incidente !== undefined) {
        updates.push('id_incidente = ?');
        params.push(id_incidente);
      }
      
      if (id_guardia !== undefined) {
        updates.push('id_guardia = ?');
        params.push(id_guardia);
      }
      
      if (usuario !== undefined) {
        updates.push('usuario = ?');
        params.push(usuario);
      }
      
      if (fecha !== undefined) {
        updates.push('fecha = ?');
        params.push(fecha);
      }
      
      if (total_minutos !== undefined) {
        updates.push('total_minutos = ?');
        params.push(total_minutos);
      }
      
      if (total_importe !== undefined) {
        updates.push('total_importe = ?');
        params.push(total_importe);
      }
      
      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      params.push(id); // Para la cláusula WHERE
      
      const [result] = await pool.query(
        `UPDATE liquidaciones_detalle SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      return LiquidacionDetalle.findByPk(id);
    } catch (error) {
      console.error('Error al actualizar detalle de liquidación:', error);
      throw error;
    }
  },
  
  // Eliminar un detalle de liquidación
  destroy: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM liquidaciones_detalle WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar detalle de liquidación:', error);
      throw error;
    }
  },
  
  // Método para adjuntar métodos a un objeto detalle
  attachMethods: (detalle) => {
    // Añadir método update
    detalle.update = async function(values) {
      return LiquidacionDetalle.update(this.id, values);
    };
    
    // Añadir método destroy
    detalle.destroy = async function() {
      return LiquidacionDetalle.destroy(this.id);
    };
    
    return detalle;
  }
};

module.exports = LiquidacionDetalle;