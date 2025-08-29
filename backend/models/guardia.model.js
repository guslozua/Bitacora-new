// models/guardia.model.js - VERSIÓN SQL SERVER CORREGIDA
const pool = require('../config/db');

// Modelo de Guardia optimizado para SQL Server con esquema taskmanagementsystem
const Guardia = {
  // Encontrar todas las guardias con filtros opcionales
  findAll: async (options = {}) => {
    try {
      let query = 'SELECT * FROM taskmanagementsystem.guardias';
      const params = [];
      let whereClause = '';
      
      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];
        
        // Filtrar por rango de fechas
        if (options.where.fecha) {
          if (options.where.fecha.between) {
            conditions.push('fecha BETWEEN ? AND ?');
            params.push(options.where.fecha.between[0], options.where.fecha.between[1]);
          } else if (options.where.fecha.gte) {
            conditions.push('fecha >= ?');
            params.push(options.where.fecha.gte);
          } else if (options.where.fecha.lte) {
            conditions.push('fecha <= ?');
            params.push(options.where.fecha.lte);
          } else {
            conditions.push('fecha = ?');
            params.push(options.where.fecha);
          }
        }
        
        // Filtrar por usuario
        if (options.where.usuario) {
          conditions.push('usuario = ?');
          params.push(options.where.usuario);
        }
        
        // Filtrar por ID distinto (para validaciones)
        if (options.where.id && options.where.id.ne) {
          conditions.push('id != ?');
          params.push(options.where.id.ne);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause + ' ORDER BY fecha ASC';
      
      const [rows] = await pool.query(query, params);
      
      // Convertir fechas a formato local y añadir métodos
      return rows.map(row => Guardia.attachMethods({
        ...row,
        fecha: row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : null
      }));
    } catch (error) {
      console.error('Error al buscar guardias:', error);
      throw error;
    }
  },
  
  // Encontrar una guardia por ID primario
  findByPk: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM taskmanagementsystem.guardias WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      
      const guardia = {
        ...rows[0],
        fecha: rows[0].fecha ? new Date(rows[0].fecha).toISOString().split('T')[0] : null
      };
      
      return Guardia.attachMethods(guardia);
    } catch (error) {
      console.error(`Error al buscar guardia con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Encontrar una guardia con filtros específicos
  findOne: async (options = {}) => {
    try {
      let query = 'SELECT TOP 1 * FROM taskmanagementsystem.guardias';
      const params = [];
      let whereClause = '';
      
      if (options.where) {
        const conditions = [];
        
        if (options.where.fecha) {
          conditions.push('fecha = ?');
          params.push(options.where.fecha);
        }
        
        if (options.where.usuario) {
          conditions.push('usuario = ?');
          params.push(options.where.usuario);
        }
        
        if (options.where.id && options.where.id.ne) {
          conditions.push('id != ?');
          params.push(options.where.id.ne);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause;
      
      const [rows] = await pool.query(query, params);
      if (rows.length === 0) return null;
      
      const guardia = {
        ...rows[0],
        fecha: rows[0].fecha ? new Date(rows[0].fecha).toISOString().split('T')[0] : null
      };
      
      return Guardia.attachMethods(guardia);
    } catch (error) {
      console.error('Error al buscar guardia individual:', error);
      throw error;
    }
  },
  
  // Crear una nueva guardia
  create: async (data) => {
    try {
      const { fecha, usuario, notas = '' } = data;
      
      // Verificar duplicados antes de insertar
      const existing = await Guardia.findOne({
        where: { fecha, usuario }
      });
      
      if (existing) {
        throw new Error(`Ya existe una guardia asignada para ${usuario} en la fecha ${fecha}`);
      }
      
      const [result] = await pool.query(
        'INSERT INTO taskmanagementsystem.guardias (fecha, usuario, notas) VALUES (?, ?, ?)',
        [fecha, usuario.trim(), notas]
      );
      
      const guardia = {
        id: result.insertId,
        fecha,
        usuario: usuario.trim(),
        notas,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return Guardia.attachMethods(guardia);
    } catch (error) {
      console.error('Error al crear guardia:', error);
      throw error;
    }
  },
  
  // Actualizar una guardia existente
  update: async (id, values) => {
    try {
      const { fecha, usuario, notas } = values;
      
      // Verificar que la guardia existe
      const existing = await Guardia.findByPk(id);
      if (!existing) {
        throw new Error('Guardia no encontrada');
      }
      
      // Si se cambia fecha o usuario, verificar duplicados
      if ((fecha && fecha !== existing.fecha) || (usuario && usuario.trim() !== existing.usuario)) {
        const conflict = await Guardia.findOne({
          where: {
            fecha: fecha || existing.fecha,
            usuario: (usuario || existing.usuario).trim(),
            id: { ne: id }
          }
        });
        
        if (conflict) {
          throw new Error(`Ya existe una guardia asignada para ${(usuario || existing.usuario).trim()} en la fecha ${fecha || existing.fecha}`);
        }
      }
      
      // Construir la actualización
      const updates = [];
      const params = [];
      
      if (fecha !== undefined) {
        updates.push('fecha = ?');
        params.push(fecha);
      }
      
      if (usuario !== undefined) {
        updates.push('usuario = ?');
        params.push(usuario.trim());
      }
      
      if (notas !== undefined) {
        updates.push('notas = ?');
        params.push(notas);
      }
      
      updates.push('updatedAt = GETDATE()');
      params.push(id);
      
      const [result] = await pool.query(
        `UPDATE taskmanagementsystem.guardias SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      if (result.affectedRows === 0) {
        throw new Error('No se pudo actualizar la guardia');
      }
      
      // Retornar guardia actualizada
      return await Guardia.findByPk(id);
    } catch (error) {
      console.error('Error al actualizar guardia:', error);
      throw error;
    }
  },
  
  // Eliminar una guardia por ID
  destroy: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM taskmanagementsystem.guardias WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar guardia:', error);
      throw error;
    }
  },
  
  // Método para adjuntar métodos a un objeto guardia
  attachMethods: (guardia) => {
    guardia.update = async function(values) {
      return Guardia.update(this.id, values);
    };
    
    guardia.destroy = async function() {
      return Guardia.destroy(this.id);
    };
    
    return guardia;
  }
};

module.exports = Guardia;