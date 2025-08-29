// models/tarifa.model.js - CORREGIDO PARA SQL SERVER
const pool = require('../config/db');

// Inicializar tabla si no existe
const initTable = async () => {
  try {
    // Verificar si la tabla ya existe en el esquema taskmanagementsystem
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'taskmanagementsystem' AND TABLE_NAME = 'tarifas'
    `;
    
    const [existing] = await pool.query(checkQuery);
    
    if (existing[0].count === 0) {
      console.log('❌ Tabla taskmanagementsystem.tarifas no encontrada. Debe existir desde la migración.');
      return;
    }
    
    console.log('✅ Tabla taskmanagementsystem.tarifas encontrada correctamente');
    
    // Verificar si hay tarifas, si no, crear una por defecto
    const [tarifasExisting] = await pool.query('SELECT COUNT(*) as count FROM taskmanagementsystem.tarifas');
    
    if (tarifasExisting[0].count === 0) {
      console.log('📝 Creando tarifa por defecto...');
      await pool.query(`
        INSERT INTO taskmanagementsystem.tarifas 
        (nombre, valor_guardia_pasiva, valor_hora_activa, valor_adicional_nocturno_habil, valor_adicional_nocturno_no_habil, vigencia_desde, observaciones)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?)
      `, ['Tarifa Base 2025', 2500.00, 350.00, 500.00, 750.00, '2025-01-01', 'Tarifa base creada automáticamente']);
      console.log('✅ Tarifa por defecto creada');
    }
  } catch (error) {
    console.error('❌ Error al inicializar tabla tarifas:', error);
  }
};

// Ejecutar inicialización
initTable();

// Modelo de Tarifa
const Tarifa = {
  // Encontrar todas las tarifas con filtros opcionales
  findAll: async (options = {}) => {
    try {
      console.log('🔍 TARIFA MODEL: Iniciando findAll con opciones:', JSON.stringify(options));
      
      let query = 'SELECT * FROM taskmanagementsystem.tarifas';
      const params = [];
      let whereClause = '';
      
      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];
        
        if (options.where.estado) {
          conditions.push('estado = ?');
          params.push(options.where.estado);
        }
        
        if (options.where.nombre) {
          conditions.push('nombre LIKE ?');
          params.push(`%${options.where.nombre}%`);
        }
        
        // Filtro por fecha vigente
        if (options.where.vigente_en_fecha) {
          conditions.push('(vigencia_desde <= ? AND (vigencia_hasta IS NULL OR vigencia_hasta >= ?))');
          params.push(options.where.vigente_en_fecha, options.where.vigente_en_fecha);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      } else {
        // Por defecto, mostrar solo activas
        whereClause = ' WHERE estado = ?';
        params.push('activo');
      }
      
      query += whereClause;
      
      // Ordenamiento
      if (options.order) {
        const [field, direction] = options.order[0];
        query += ` ORDER BY ${field} ${direction}`;
      } else {
        query += ' ORDER BY vigencia_desde DESC, created_at DESC';
      }
      
      console.log('📋 Ejecutando consulta SQL:', query);
      console.log('📋 Con parámetros:', params);
      
      const [rows] = await pool.query(query, params);
      
      console.log(`✅ findAll: Se encontraron ${rows.length} tarifas`);
      
      return rows.map(row => Tarifa.attachMethods(row));
    } catch (error) {
      console.error('❌ Error en findAll de tarifas:', error);
      throw error;
    }
  },
  
  // Encontrar una tarifa por ID
  findByPk: async (id) => {
    try {
      console.log('🔍 TARIFA MODEL: Buscando tarifa por ID:', id);
      
      const [rows] = await pool.query('SELECT * FROM taskmanagementsystem.tarifas WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        console.log('❌ Tarifa no encontrada con ID:', id);
        return null;
      }
      
      console.log('✅ Tarifa encontrada:', rows[0].nombre);
      return Tarifa.attachMethods(rows[0]);
    } catch (error) {
      console.error(`❌ Error al buscar tarifa con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Encontrar tarifa vigente para una fecha específica
  findVigenteEnFecha: async (fecha) => {
    try {
      console.log('📅 TARIFA MODEL: Buscando tarifa vigente para fecha:', fecha);
      
      const query = `
        SELECT TOP 1 * FROM taskmanagementsystem.tarifas 
        WHERE estado = 'activo' 
        AND vigencia_desde <= ? 
        AND (vigencia_hasta IS NULL OR vigencia_hasta >= ?)
        ORDER BY vigencia_desde DESC
      `;
      
      const [rows] = await pool.query(query, [fecha, fecha]);
      
      if (rows.length === 0) {
        console.log('❌ No se encontró tarifa vigente para fecha:', fecha);
        return null;
      }
      
      console.log('✅ Tarifa vigente encontrada:', rows[0].nombre, 'vigente desde:', rows[0].vigencia_desde);
      return Tarifa.attachMethods(rows[0]);
    } catch (error) {
      console.error('❌ Error al buscar tarifa vigente:', error);
      throw error;
    }
  },
  
  // Crear una nueva tarifa
  create: async (data) => {
    try {
      console.log('🚀 TARIFA MODEL: Creando nueva tarifa:', data.nombre);
      
      const { 
        nombre, 
        valor_guardia_pasiva, 
        valor_hora_activa, 
        valor_adicional_nocturno_habil, 
        valor_adicional_nocturno_no_habil,
        vigencia_desde, 
        vigencia_hasta = null, 
        estado = 'activo',
        observaciones = null
      } = data;
      
      // Validaciones básicas
      if (!nombre || !valor_guardia_pasiva || !valor_hora_activa || !vigencia_desde) {
        throw new Error('Faltan campos obligatorios: nombre, valores y fecha de vigencia');
      }
      
      // Verificar conflictos de vigencia para el mismo nombre
      const [conflictos] = await pool.query(`
        SELECT id, nombre, vigencia_desde, vigencia_hasta 
        FROM taskmanagementsystem.tarifas 
        WHERE nombre = ? 
        AND estado = 'activo'
        AND (
          (vigencia_desde <= ? AND (vigencia_hasta IS NULL OR vigencia_hasta >= ?))
          OR
          (? <= vigencia_desde AND (? IS NULL OR ? >= vigencia_desde))
        )
      `, [nombre, vigencia_desde, vigencia_desde, vigencia_desde, vigencia_hasta, vigencia_hasta]);
      
      if (conflictos.length > 0) {
        throw new Error(`Ya existe una tarifa "${nombre}" vigente en el período especificado`);
      }
      
      // Query para SQL Server con OUTPUT para obtener el ID insertado
      const insertQuery = `
        INSERT INTO taskmanagementsystem.tarifas 
        (nombre, valor_guardia_pasiva, valor_hora_activa, valor_adicional_nocturno_habil, 
         valor_adicional_nocturno_no_habil, vigencia_desde, vigencia_hasta, estado, observaciones)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
        nombre,
        parseFloat(valor_guardia_pasiva),
        parseFloat(valor_hora_activa),
        parseFloat(valor_adicional_nocturno_habil),
        parseFloat(valor_adicional_nocturno_no_habil),
        vigencia_desde,
        vigencia_hasta,
        estado,
        observaciones
      ];
      
      console.log('📝 SQL INSERT:', insertQuery);
      console.log('📝 PARÁMETROS:', insertParams);
      
      const [result] = await pool.query(insertQuery, insertParams);
      const tarifaId = result[0] ? result[0].id : null;
      
      if (!tarifaId) {
        throw new Error('No se pudo obtener el ID de la tarifa creada');
      }
      
      console.log('✅ Tarifa creada exitosamente con ID:', tarifaId);
      
      return Tarifa.findByPk(tarifaId);
    } catch (error) {
      console.error('❌ Error al crear tarifa:', error);
      throw error;
    }
  },
  
  // Actualizar una tarifa existente
  update: async (id, values) => {
    try {
      console.log('🔄 TARIFA MODEL: Actualizando tarifa ID:', id);
      console.log('🔄 Valores:', values);
      
      const { 
        nombre, 
        valor_guardia_pasiva, 
        valor_hora_activa, 
        valor_adicional_nocturno_habil, 
        valor_adicional_nocturno_no_habil,
        vigencia_desde, 
        vigencia_hasta, 
        estado,
        observaciones
      } = values;
      
      // Construir actualización dinámica
      const updates = [];
      const params = [];
      
      const fields = {
        nombre, 
        valor_guardia_pasiva, 
        valor_hora_activa, 
        valor_adicional_nocturno_habil, 
        valor_adicional_nocturno_no_habil,
        vigencia_desde, 
        vigencia_hasta, 
        estado,
        observaciones
      };
      
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          // Convertir undefined a null y parsear números
          if (['valor_guardia_pasiva', 'valor_hora_activa', 'valor_adicional_nocturno_habil', 'valor_adicional_nocturno_no_habil'].includes(key)) {
            params.push(parseFloat(value));
          } else {
            params.push(value === '' && ['vigencia_hasta', 'observaciones'].includes(key) ? null : value);
          }
        }
      });
      
      // Actualizar fecha de modificación
      updates.push('updated_at = GETDATE()');
      
      if (updates.length === 1) { // Solo updated_at
        throw new Error('No hay campos para actualizar');
      }
      
      params.push(id);
      
      const updateQuery = `UPDATE taskmanagementsystem.tarifas SET ${updates.join(', ')} WHERE id = ?`;
      console.log('📝 SQL UPDATE:', updateQuery);
      console.log('📝 PARÁMETROS:', params);
      
      const [result] = await pool.query(updateQuery, params);
      
      if (result.affectedRows === 0) {
        throw new Error('Tarifa no encontrada para actualizar');
      }
      
      console.log('✅ Tarifa actualizada exitosamente');
      return Tarifa.findByPk(id);
    } catch (error) {
      console.error('❌ Error al actualizar tarifa:', error);
      throw error;
    }
  },
  
  // Desactivar una tarifa (soft delete)
  deactivate: async (id) => {
    try {
      console.log('🗑️ TARIFA MODEL: Desactivando tarifa ID:', id);
      
      const [result] = await pool.query(
        'UPDATE taskmanagementsystem.tarifas SET estado = ?, updated_at = GETDATE() WHERE id = ?',
        ['inactivo', id]
      );
      
      const success = result.affectedRows > 0;
      console.log(success ? '✅ Tarifa desactivada' : '❌ Tarifa no encontrada');
      
      return success;
    } catch (error) {
      console.error('❌ Error al desactivar tarifa:', error);
      throw error;
    }
  },
  
  // Eliminar definitivamente una tarifa
  destroy: async (id) => {
    try {
      console.log('🗑️ TARIFA MODEL: Eliminando permanentemente tarifa ID:', id);
      
      const [result] = await pool.query('DELETE FROM taskmanagementsystem.tarifas WHERE id = ?', [id]);
      
      const success = result.affectedRows > 0;
      console.log(success ? '✅ Tarifa eliminada permanentemente' : '❌ Tarifa no encontrada');
      
      return success;
    } catch (error) {
      console.error('❌ Error al eliminar tarifa:', error);
      throw error;
    }
  },
  
  // Calcular importe para guardia pasiva
  calcularGuardiaP: async (tarifaId, tipoGuardia = 'completa') => {
    try {
      const tarifa = await Tarifa.findByPk(tarifaId);
      if (!tarifa) throw new Error('Tarifa no encontrada');
      
      const factores = {
        'completa': 1.0,
        'sabado_manana': 0.75,
        'sabado_tarde': 1.375,
        'domingo': 2.125
      };
      
      const factor = factores[tipoGuardia] || 1.0;
      return parseFloat((tarifa.valor_guardia_pasiva * factor).toFixed(2));
    } catch (error) {
      console.error('❌ Error al calcular guardia pasiva:', error);
      throw error;
    }
  },
  
  // Calcular importe para guardia activa
  calcularGuardiaA: async (tarifaId, horas, esDiaNoLaboral = false) => {
    try {
      const tarifa = await Tarifa.findByPk(tarifaId);
      if (!tarifa) throw new Error('Tarifa no encontrada');
      
      let valorHora = tarifa.valor_hora_activa;
      
      if (esDiaNoLaboral) {
        valorHora *= 1.5;
      }
      
      return parseFloat((valorHora * horas).toFixed(2));
    } catch (error) {
      console.error('❌ Error al calcular guardia activa:', error);
      throw error;
    }
  },
  
  // Calcular adicional nocturno
  calcularAdicionalNocturno: async (tarifaId, horas, esDiaNoLaboral = false) => {
    try {
      const tarifa = await Tarifa.findByPk(tarifaId);
      if (!tarifa) throw new Error('Tarifa no encontrada');
      
      const valorNocturno = esDiaNoLaboral ? 
        tarifa.valor_adicional_nocturno_no_habil : 
        tarifa.valor_adicional_nocturno_habil;
      
      return parseFloat((valorNocturno * horas).toFixed(2));
    } catch (error) {
      console.error('❌ Error al calcular adicional nocturno:', error);
      throw error;
    }
  },
  
  // Obtener estadísticas de tarifas
  getEstadisticas: async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_tarifas,
          SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activas,
          SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as inactivas,
          SUM(CASE WHEN vigencia_hasta IS NULL THEN 1 ELSE 0 END) as vigencia_indefinida,
          AVG(valor_guardia_pasiva) as promedio_guardia_pasiva,
          AVG(valor_hora_activa) as promedio_hora_activa,
          MIN(vigencia_desde) as primera_vigencia,
          MAX(vigencia_desde) as ultima_vigencia
        FROM taskmanagementsystem.tarifas
      `;
      
      const [result] = await pool.query(query);
      return result[0];
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de tarifas:', error);
      throw error;
    }
  },
  
  // Método para adjuntar métodos a un objeto tarifa
  attachMethods: (tarifa) => {
    tarifa.update = async function(values) {
      return Tarifa.update(this.id, values);
    };
    
    tarifa.destroy = async function() {
      return Tarifa.destroy(this.id);
    };
    
    tarifa.deactivate = async function() {
      return Tarifa.deactivate(this.id);
    };
    
    tarifa.calcularGuardiaP = async function(tipoGuardia) {
      return Tarifa.calcularGuardiaP(this.id, tipoGuardia);
    };
    
    tarifa.calcularGuardiaA = async function(horas, esDiaNoLaboral) {
      return Tarifa.calcularGuardiaA(this.id, horas, esDiaNoLaboral);
    };
    
    tarifa.calcularAdicionalNocturno = async function(horas, esDiaNoLaboral) {
      return Tarifa.calcularAdicionalNocturno(this.id, horas, esDiaNoLaboral);
    };
    
    return tarifa;
  }
};

module.exports = Tarifa;