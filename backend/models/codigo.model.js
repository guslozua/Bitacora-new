// models/codigo.model.js - VERSIÓN SQL SERVER CON ESQUEMA TASKMANAGEMENTSYSTEM
const pool = require('../config/db');

// Modelo de Código de Facturación para SQL Server
const Codigo = {
  // Función auxiliar para detectar horarios que cruzan medianoche
  cruzaMedianoche: (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return false;

    const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number);
    const [finHoras, finMinutos] = horaFin.split(':').map(Number);

    const inicioEnMinutos = inicioHoras * 60 + inicioMinutos;
    const finEnMinutos = finHoras * 60 + finMinutos;

    return finEnMinutos < inicioEnMinutos;
  },

  // Función para verificar si una hora está en un rango
  horaEnRango: (horaVerificar, horaInicio, horaFin) => {
    if (!horaVerificar || !horaInicio || !horaFin) return false;

    const [verificarH, verificarM] = horaVerificar.split(':').map(Number);
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);

    const verificarMinutos = verificarH * 60 + verificarM;
    const inicioMinutos = inicioH * 60 + inicioM;
    const finMinutos = finH * 60 + finM;

    if (Codigo.cruzaMedianoche(horaInicio, horaFin)) {
      return verificarMinutos >= inicioMinutos || verificarMinutos <= finMinutos;
    } else {
      return verificarMinutos >= inicioMinutos && verificarMinutos <= finMinutos;
    }
  },

  // Encontrar todos los códigos con filtros opcionales
  findAll: async (options = {}) => {
    try {
      let query = 'SELECT * FROM taskmanagementsystem.codigos_facturacion';
      const params = [];
      let whereClause = '';

      if (options.where) {
        const conditions = [];
        
        if (options.where.tipo) {
          conditions.push('tipo = ?');
          params.push(options.where.tipo);
        }
        
        if (options.where.estado) {
          conditions.push('estado = ?');
          params.push(options.where.estado);
        } else if (!options.incluir_inactivos) {
          conditions.push('estado = ?');
          params.push('activo');
        }
        
        if (options.where.modalidad_convenio) {
          conditions.push('modalidad_convenio = ?');
          params.push(options.where.modalidad_convenio);
        }
        
        if (options.where.fecha_vigencia) {
          conditions.push('fecha_vigencia_desde <= ? AND (fecha_vigencia_hasta IS NULL OR fecha_vigencia_hasta >= ?)');
          params.push(options.where.fecha_vigencia, options.where.fecha_vigencia);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause + ' ORDER BY codigo';
      
      const [rows] = await pool.query(query, params);
      return rows.map(row => Codigo.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar códigos:', error);
      throw error;
    }
  },

  // Encontrar un código por ID
  findByPk: async (id) => {
    try {
      const [rows] = await pool.query('SELECT * FROM taskmanagementsystem.codigos_facturacion WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      return Codigo.attachMethods(rows[0]);
    } catch (error) {
      console.error(`Error al buscar código con ID ${id}:`, error);
      throw error;
    }
  },

  // Encontrar códigos con filtros específicos
  findOne: async (options = {}) => {
    try {
      let query = 'SELECT TOP 1 * FROM taskmanagementsystem.codigos_facturacion';
      const params = [];
      let whereClause = '';
      
      if (options.where) {
        const conditions = [];
        
        if (options.where.codigo) {
          conditions.push('codigo = ?');
          params.push(options.where.codigo);
        }
        
        if (options.where.modalidad_convenio) {
          conditions.push('modalidad_convenio = ?');
          params.push(options.where.modalidad_convenio);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause;
      
      const [rows] = await pool.query(query, params);
      if (rows.length === 0) return null;
      return Codigo.attachMethods(rows[0]);
    } catch (error) {
      console.error('Error al buscar código individual:', error);
      throw error;
    }
  },

  // Crear un nuevo código
  create: async (data) => {
    try {
      const { 
        codigo, descripcion, notas, tipo, dias_aplicables, 
        hora_inicio, hora_fin, factor_multiplicador,
        fecha_vigencia_desde, fecha_vigencia_hasta, estado,
        modalidad_convenio = 'FC'
      } = data;
      
      // Verificar duplicados
      const existing = await Codigo.findOne({
        where: { codigo, modalidad_convenio }
      });
      
      if (existing) {
        throw new Error(`El código "${codigo}" ya existe para la modalidad ${modalidad_convenio}`);
      }
      
      const [result] = await pool.query(
        `INSERT INTO taskmanagementsystem.codigos_facturacion 
         (codigo, descripcion, notas, tipo, dias_aplicables, hora_inicio, hora_fin, 
          factor_multiplicador, fecha_vigencia_desde, fecha_vigencia_hasta, estado, modalidad_convenio,
          tipo_calculo, unidad_facturacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'hora_activa', 'por_hora')`,
        [codigo, descripcion, notas, tipo, dias_aplicables, hora_inicio, hora_fin, 
         factor_multiplicador, fecha_vigencia_desde, fecha_vigencia_hasta, estado, modalidad_convenio]
      );
      
      return await Codigo.findByPk(result.insertId);
    } catch (error) {
      console.error('Error al crear código:', error);
      throw error;
    }
  },

  // Actualizar un código existente
  update: async (id, values) => {
    try {
      const existing = await Codigo.findByPk(id);
      if (!existing) {
        throw new Error('Código no encontrado');
      }
      
      // Verificar duplicados si cambia código o modalidad
      if ((values.codigo && values.codigo !== existing.codigo) || 
          (values.modalidad_convenio && values.modalidad_convenio !== existing.modalidad_convenio)) {
        
        const conflict = await Codigo.findOne({
          where: {
            codigo: values.codigo || existing.codigo,
            modalidad_convenio: values.modalidad_convenio || existing.modalidad_convenio
          }
        });
        
        if (conflict && conflict.id !== id) {
          throw new Error(`El código "${values.codigo || existing.codigo}" ya existe para la modalidad ${values.modalidad_convenio || existing.modalidad_convenio}`);
        }
      }
      
      const updates = [];
      const params = [];
      
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined) {
          updates.push(`${key} = ?`);
          params.push(values[key]);
        }
      });
      
      updates.push('updated_at = GETDATE()');
      params.push(id);
      
      const [result] = await pool.query(
        `UPDATE taskmanagementsystem.codigos_facturacion SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      if (result.affectedRows === 0) {
        throw new Error('No se pudo actualizar el código');
      }
      
      return await Codigo.findByPk(id);
    } catch (error) {
      console.error('Error al actualizar código:', error);
      throw error;
    }
  },

  // Eliminar un código
  destroy: async (id) => {
    try {
      const [result] = await pool.query('DELETE FROM taskmanagementsystem.codigos_facturacion WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar código:', error);
      throw error;
    }
  },

  // Encontrar códigos aplicables a un rango de fecha y hora
  findApplicable: async (fecha, horaInicio, horaFin, modalidadConvenio = 'FC') => {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM taskmanagementsystem.codigos_facturacion 
        WHERE estado = 'activo' 
        AND modalidad_convenio = ?
        AND fecha_vigencia_desde <= ? 
        AND (fecha_vigencia_hasta IS NULL OR fecha_vigencia_hasta >= ?)
        ORDER BY codigo
      `, [modalidadConvenio, fecha, fecha]);
      
      return rows.filter(codigo => {
        // Verificar si aplica por horario
        if (codigo.hora_inicio && codigo.hora_fin) {
          return Codigo.horaEnRango(horaInicio, codigo.hora_inicio, codigo.hora_fin) ||
                 Codigo.horaEnRango(horaFin, codigo.hora_inicio, codigo.hora_fin);
        }
        return true;
      }).map(row => Codigo.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar códigos aplicables:', error);
      throw error;
    }
  },

  // Método para adjuntar métodos a un objeto código
  attachMethods: (codigo) => {
    codigo.update = async function(values) {
      return Codigo.update(this.id, values);
    };
    
    codigo.destroy = async function() {
      return Codigo.destroy(this.id);
    };
    
    codigo.deactivate = async function() {
      return Codigo.update(this.id, { estado: 'inactivo' });
    };
    
    return codigo;
  }
};

module.exports = Codigo;