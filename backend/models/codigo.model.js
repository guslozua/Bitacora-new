// models/codigo.model.js
const pool = require('../config/db');
const { Op } = require('./db.operators');

// Modelo de Código de Facturación (no necesita inicializar tabla, se hace en incidente.model.js)
const Codigo = {
  // Encontrar todos los códigos con filtros opcionales
  findAll: async (options = {}) => {
    try {
      let query = 'SELECT * FROM codigos_facturacion';
      const params = [];
      let whereClause = '';
      
      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];
        
        // Filtrar por tipo
        if (options.where.tipo) {
          conditions.push('tipo = ?');
          params.push(options.where.tipo);
        }
        
        // Filtrar por estado
        if (options.where.estado) {
          conditions.push('estado = ?');
          params.push(options.where.estado);
        }
        
        // Filtrar por códigos activos en una fecha específica
        if (options.where.fecha_vigencia) {
          conditions.push('(fecha_vigencia_desde <= ? AND (fecha_vigencia_hasta IS NULL OR fecha_vigencia_hasta >= ?))');
          params.push(options.where.fecha_vigencia, options.where.fecha_vigencia);
        }
        
        // Buscar por código o descripción
        if (options.where.search) {
          conditions.push('(codigo LIKE ? OR descripcion LIKE ?)');
          params.push(`%${options.where.search}%`, `%${options.where.search}%`);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      } else {
        // Por defecto, mostrar solo códigos activos
        whereClause = ' WHERE estado = "activo"';
      }
      
      query += whereClause;
      
      // Ordenamiento
      query += ' ORDER BY codigo ASC';
      
      const [rows] = await pool.query(query, params);
      
      // Añadir métodos a cada registro
      return rows.map(row => Codigo.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar códigos de facturación:', error);
      throw error;
    }
  },
  
  // Encontrar un código por ID
  findByPk: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM codigos_facturacion WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      
      return Codigo.attachMethods(rows[0]);
    } catch (error) {
      console.error(`Error al buscar código con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Encontrar códigos aplicables a una fecha y hora específicas
  findApplicable: async (fecha, horaInicio, horaFin) => {
    try {
      // Determinar el día de la semana (L,M,X,J,V,S,D)
      const date = new Date(fecha);
      const dayOfWeek = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()];
      
      // Verificar si es feriado
      const [feriados] = await pool.query(
        `SELECT COUNT(*) as es_feriado FROM eventos 
         WHERE type = 'holiday' AND DATE(start) = DATE(?) AND allDay = 1`,
        [fecha]
      );
      const esFeriado = feriados[0].es_feriado > 0;
      
      // Consulta compleja para encontrar códigos aplicables
      const query = `
        SELECT * FROM codigos_facturacion
        WHERE estado = 'activo'
        AND (fecha_vigencia_desde <= ? AND (fecha_vigencia_hasta IS NULL OR fecha_vigencia_hasta >= ?))
        AND (
          -- Si es feriado y el código aplica a feriados
          (? = TRUE AND LOCATE('F', dias_aplicables) > 0)
          OR
          -- Si no es feriado, verificar el día de la semana
          (? = FALSE AND LOCATE(?, dias_aplicables) > 0)
        )
        AND (
          -- Código aplica todo el día (sin horas específicas)
          (hora_inicio IS NULL AND hora_fin IS NULL)
          OR
          -- La hora de inicio del incidente está dentro del rango del código
          (? BETWEEN hora_inicio AND hora_fin)
          OR
          -- La hora de fin del incidente está dentro del rango del código
          (? BETWEEN hora_inicio AND hora_fin)
          OR
          -- El rango de horas del incidente contiene completamente al rango del código
          (? <= hora_inicio AND ? >= hora_fin)
        )
        ORDER BY tipo, codigo
      `;
      
      const [rows] = await pool.query(query, [
        fecha, fecha,             // Para vigencia
        esFeriado, esFeriado,     // Para verificación de feriado
        dayOfWeek,                // Para día de la semana
        horaInicio, horaFin,      // Para verificación de rango horario
        horaInicio, horaFin
      ]);
      
      return rows.map(row => Codigo.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar códigos aplicables:', error);
      throw error;
    }
  },
  
  // Crear un nuevo código
  create: async (data) => {
    try {
      const { 
        codigo, descripcion, tipo, dias_aplicables, 
        hora_inicio, hora_fin, factor_multiplicador,
        fecha_vigencia_desde, fecha_vigencia_hasta, estado = 'activo'
      } = data;
      
      const [result] = await pool.query(
        `INSERT INTO codigos_facturacion 
         (codigo, descripcion, tipo, dias_aplicables, hora_inicio, hora_fin, factor_multiplicador, fecha_vigencia_desde, fecha_vigencia_hasta, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          codigo, descripcion, tipo, 
          dias_aplicables || 'L,M,X,J,V,S,D', 
          hora_inicio || null, hora_fin || null, 
          factor_multiplicador || 1.00,
          fecha_vigencia_desde, fecha_vigencia_hasta || null,
          // Continuación de models/codigo.model.js
          
          estado
        ]
      );
      
      const codigoId = result.insertId;
      
      // Devolver el código creado
      return Codigo.findByPk(codigoId);
    } catch (error) {
      console.error('Error al crear código de facturación:', error);
      throw error;
    }
  },
  
  // Actualizar un código existente
  update: async (id, values) => {
    try {
      const { 
        codigo, descripcion, tipo, dias_aplicables, 
        hora_inicio, hora_fin, factor_multiplicador,
        fecha_vigencia_desde, fecha_vigencia_hasta, estado 
      } = values;
      
      // Construir cláusulas de actualización
      const updates = [];
      const params = [];
      
      if (codigo !== undefined) {
        updates.push('codigo = ?');
        params.push(codigo);
      }
      
      if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(descripcion);
      }
      
      if (tipo !== undefined) {
        updates.push('tipo = ?');
        params.push(tipo);
      }
      
      if (dias_aplicables !== undefined) {
        updates.push('dias_aplicables = ?');
        params.push(dias_aplicables);
      }
      
      if (hora_inicio !== undefined) {
        updates.push('hora_inicio = ?');
        params.push(hora_inicio);
      }
      
      if (hora_fin !== undefined) {
        updates.push('hora_fin = ?');
        params.push(hora_fin);
      }
      
      if (factor_multiplicador !== undefined) {
        updates.push('factor_multiplicador = ?');
        params.push(factor_multiplicador);
      }
      
      if (fecha_vigencia_desde !== undefined) {
        updates.push('fecha_vigencia_desde = ?');
        params.push(fecha_vigencia_desde);
      }
      
      if (fecha_vigencia_hasta !== undefined) {
        updates.push('fecha_vigencia_hasta = ?');
        params.push(fecha_vigencia_hasta);
      }
      
      if (estado !== undefined) {
        updates.push('estado = ?');
        params.push(estado);
      }
      
      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      params.push(id); // Para la cláusula WHERE
      
      const [result] = await pool.query(
        `UPDATE codigos_facturacion SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      // Devolver el código actualizado
      return Codigo.findByPk(id);
    } catch (error) {
      console.error('Error al actualizar código de facturación:', error);
      throw error;
    }
  },
  
  // Desactivar un código (cambiar estado a inactivo)
  deactivate: async (id) => {
    try {
      const [result] = await pool.query(
        'UPDATE codigos_facturacion SET estado = "inactivo" WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al desactivar código de facturación:', error);
      throw error;
    }
  },
  
  // Eliminar un código (solo si no tiene relaciones)
  destroy: async (id) => {
    try {
      // Verificar si el código está siendo utilizado
      const [usageCheck] = await pool.query(
        'SELECT COUNT(*) as total FROM incidentes_codigos WHERE id_codigo = ?',
        [id]
      );
      
      if (usageCheck[0].total > 0) {
        throw new Error('No se puede eliminar el código porque está siendo utilizado en incidentes');
      }
      
      const [result] = await pool.query(
        'DELETE FROM codigos_facturacion WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar código de facturación:', error);
      throw error;
    }
  },
  
  // Método para adjuntar métodos a un objeto código
  attachMethods: (codigo) => {
    // Añadir método update
    codigo.update = async function(values) {
      return Codigo.update(this.id, values);
    };
    
    // Añadir método destroy
    codigo.destroy = async function() {
      return Codigo.destroy(this.id);
    };
    
    // Añadir método deactivate
    codigo.deactivate = async function() {
      return Codigo.deactivate(this.id);
    };
    
    return codigo;
  }
};

module.exports = Codigo;