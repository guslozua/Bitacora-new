// models/guardia.model.js - VERSIÓN ACTUALIZADA
const pool = require('../config/db');
const { Op } = require('./db.operators'); 

// Inicializar tabla si no existe
const initTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guardias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL,
        usuario VARCHAR(255) NOT NULL,
        notas TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_fecha_usuario (fecha, usuario)
      )
    `);
    
    // Verificar si el índice único existe, si no, crearlo
    const [indexes] = await pool.query(`
      SHOW INDEX FROM guardias WHERE Key_name = 'unique_fecha_usuario'
    `);
    
    if (indexes.length === 0) {
      console.log('🔧 Creando índice único para prevenir duplicados...');
      await pool.query(`
        ALTER TABLE guardias ADD UNIQUE KEY unique_fecha_usuario (fecha, usuario)
      `);
      console.log('✅ Índice único creado correctamente');
    }
    
    console.log('✅ Tabla guardias inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar tabla guardias:', error);
  }
};

// Ejecutar inicialización
initTable();

// Modelo de Guardia
const Guardia = {
  // Encontrar todas las guardias con filtros opcionales
  findAll: async (options = {}) => {
    try {
      let query = 'SELECT * FROM guardias';
      const params = [];
      let whereClause = '';
      
      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];
        
        // Filtrar por fecha
        if (options.where.fecha) {
          if (options.where.fecha[Op.between]) {
            conditions.push('fecha BETWEEN ? AND ?');
            params.push(options.where.fecha[Op.between][0], options.where.fecha[Op.between][1]);
          } else if (options.where.fecha[Op.gte]) {
            conditions.push('fecha >= ?');
            params.push(options.where.fecha[Op.gte]);
          } else if (options.where.fecha[Op.lte]) {
            conditions.push('fecha <= ?');
            params.push(options.where.fecha[Op.lte]);
          }
        }
        
        // Filtrar por ID distinto
        if (options.where.id && options.where.id[Op.ne]) {
          conditions.push('id != ?');
          params.push(options.where.id[Op.ne]);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause;
      
      // Ordenamiento
      query += ' ORDER BY fecha ASC';
      
      const [rows] = await pool.query(query, params);
      // Añadir métodos a cada registro
      return rows.map(row => Guardia.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar guardias:', error);
      throw error;
    }
  },
  
  // Encontrar una guardia por ID primario
  findByPk: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM guardias WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      // Añadir métodos al registro encontrado
      return Guardia.attachMethods(rows[0]);
    } catch (error) {
      console.error(`Error al buscar guardia con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Encontrar una guardia con filtros específicos
  findOne: async (options = {}) => {
    try {
      let query = 'SELECT * FROM guardias';
      const params = [];
      let whereClause = '';
      
      if (options.where) {
        const conditions = [];
        
        // Filtrar por fecha exacta
        if (options.where.fecha) {
          conditions.push('fecha = ?');
          params.push(options.where.fecha);
        }
        
        // NUEVO: Filtrar por usuario
        if (options.where.usuario) {
          conditions.push('usuario = ?');
          params.push(options.where.usuario);
        }
        
        // Filtrar por ID distinto
        if (options.where.id && options.where.id[Op.ne]) {
          conditions.push('id != ?');
          params.push(options.where.id[Op.ne]);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause + ' LIMIT 1';
      
      const [rows] = await pool.query(query, params);
      if (rows.length === 0) return null;
      // Añadir métodos al registro encontrado
      return Guardia.attachMethods(rows[0]);
    } catch (error) {
      console.error('Error al buscar guardia individual:', error);
      throw error;
    }
  },
  
  // Crear una nueva guardia
  create: async (data) => {
    try {
      const { fecha, usuario, notas = '' } = data;
      
      const [result] = await pool.query(
        'INSERT INTO guardias (fecha, usuario, notas) VALUES (?, ?, ?)',
        [fecha, usuario, notas]
      );
      
      const guardia = {
        id: result.insertId,
        fecha,
        usuario,
        notas,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Añadir métodos al objeto creado
      return Guardia.attachMethods(guardia);
    } catch (error) {
      // Manejar error de duplicado de manera más específica
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Ya existe una guardia asignada para ${usuario} en la fecha ${fecha}`);
      }
      console.error('Error al crear guardia:', error);
      throw error;
    }
  },
  
  // Actualizar una guardia por ID
  update: async (id, values) => {
    try {
      const { fecha, usuario, notas } = values;
      
      // Construir cláusulas de actualización
      const updates = [];
      const params = [];
      
      if (fecha !== undefined) {
        updates.push('fecha = ?');
        params.push(fecha);
      }
      
      if (usuario !== undefined) {
        updates.push('usuario = ?');
        params.push(usuario);
      }
      
      if (notas !== undefined) {
        updates.push('notas = ?');
        params.push(notas);
      }
      
      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      params.push(id); // Para la cláusula WHERE
      
      const [result] = await pool.query(
        `UPDATE guardias SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      // Obtener el registro actualizado
      const guardia = await Guardia.findByPk(id);
      return guardia;
    } catch (error) {
      // Manejar error de duplicado de manera más específica
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Ya existe una guardia asignada para este usuario en la fecha especificada`);
      }
      console.error('Error al actualizar guardia:', error);
      throw error;
    }
  },
  
  // Eliminar una guardia por ID
  destroy: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM guardias WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar guardia:', error);
      throw error;
    }
  },
  
  // Método para adjuntar métodos a un objeto guardia
  attachMethods: (guardia) => {
    // Añadir método update
    guardia.update = async function(values) {
      return Guardia.update(this.id, values);
    };
    
    // Añadir método destroy
    guardia.destroy = async function() {
      return Guardia.destroy(this.id);
    };
    
    return guardia;
  }
};

module.exports = Guardia;