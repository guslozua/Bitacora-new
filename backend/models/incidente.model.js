// models/incidente.model.js - VERSIÓN CORREGIDA COMPLETA
const pool = require('../config/db');
const { Op } = require('./db.operators');

// Inicializar tabla si no existe
const initTable = async () => {
  try {
    // Primero crear la tabla de códigos (ya que es referenciada)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS codigos_facturacion (
        id int(11) NOT NULL AUTO_INCREMENT,
        codigo varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código para sistema administrativo',
        descripcion varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripción del código',
        tipo enum('guardia_pasiva','guardia_activa','hora_nocturna','feriado','fin_semana','adicional') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de código',
        dias_aplicables varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'L,M,X,J,V,S,D' COMMENT 'Días a los que aplica (L,M,X,J,V,S,D,F)',
        hora_inicio time DEFAULT NULL COMMENT 'Hora de inicio para aplicación',
        hora_fin time DEFAULT NULL COMMENT 'Hora de fin para aplicación',
        factor_multiplicador decimal(4,2) DEFAULT 1.00 COMMENT 'Factor para cálculos',
        fecha_vigencia_desde date NOT NULL COMMENT 'Fecha desde la que aplica',
        fecha_vigencia_hasta date DEFAULT NULL COMMENT 'Fecha hasta la que aplica (NULL = sin fin)',
        estado enum('activo','inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY uk_codigo_vigencia (codigo, fecha_vigencia_desde),
        KEY idx_tipo (tipo),
        KEY idx_estado_vigencia (estado, fecha_vigencia_desde, fecha_vigencia_hasta)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Códigos para facturación de guardias'
    `);

    // Crear tabla de incidentes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidentes_guardia (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_guardia int(11) NOT NULL COMMENT 'ID de la guardia relacionada',
        inicio datetime NOT NULL COMMENT 'Fecha y hora de inicio del incidente',
        fin datetime NOT NULL COMMENT 'Fecha y hora de fin del incidente',
        duracion_minutos int(11) GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, inicio, fin)) STORED COMMENT 'Duración calculada en minutos',
        descripcion text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripción del incidente',
        estado enum('registrado','revisado','aprobado','rechazado','liquidado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registrado',
        id_usuario_registro int(11) DEFAULT NULL COMMENT 'Usuario que registró el incidente',
        observaciones text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        KEY idx_id_guardia (id_guardia),
        KEY idx_inicio_fin (inicio, fin),
        KEY idx_estado (estado),
        CONSTRAINT fk_incidente_guardia FOREIGN KEY (id_guardia) REFERENCES guardias (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Incidentes ocurridos durante guardias'
    `);

    // Crear tabla de relación incidentes-códigos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidentes_codigos (
        id int(11) NOT NULL AUTO_INCREMENT,
        id_incidente int(11) NOT NULL,
        id_codigo int(11) NOT NULL,
        minutos int(11) NOT NULL COMMENT 'Minutos aplicables a este código',
        importe decimal(10,2) DEFAULT NULL COMMENT 'Importe calculado (opcional)',
        observacion varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY uk_incidente_codigo (id_incidente, id_codigo),
        KEY idx_id_incidente (id_incidente),
        KEY idx_id_codigo (id_codigo),
        CONSTRAINT fk_incidente_codigos_incidente FOREIGN KEY (id_incidente) REFERENCES incidentes_guardia (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_incidente_codigos_codigo FOREIGN KEY (id_codigo) REFERENCES codigos_facturacion (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relación entre incidentes y códigos aplicados'
    `);

    console.log('✅ Tablas de incidentes inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar tablas de incidentes:', error);
  }
};

// Ejecutar inicialización
initTable();

// Modelo de Incidente
const Incidente = {
  // Encontrar todos los incidentes con filtros opcionales
  findAll: async (options = {}) => {
    try {
      // Consulta principal para obtener incidentes
      let query = `
        SELECT i.*,
               g.fecha as fecha_guardia,
               g.usuario as usuario_guardia
        FROM taskmanagementsystem.incidentes_guardia i
        JOIN taskmanagementsystem.guardias g ON i.id_guardia = g.id
      `;
      
      const params = [];
      let whereClause = '';
      
      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];
        
        // Filtrar por id_guardia
        if (options.where.id_guardia) {
          conditions.push('i.id_guardia = ?');
          params.push(options.where.id_guardia);
        }
        
        // Filtrar por estado
        if (options.where.estado) {
          conditions.push('i.estado = ?');
          params.push(options.where.estado);
        }
        
        // Filtrar por rango de fechas
        if (options.where.inicio && options.where.inicio[Op.gte]) {
          conditions.push('i.inicio >= ?');
          params.push(options.where.inicio[Op.gte]);
        }
        
        if (options.where.fin && options.where.fin[Op.lte]) {
          conditions.push('i.fin <= ?');
          params.push(options.where.fin[Op.lte]);
        }
        
        // Filtrar por usuario de guardia
        if (options.where.usuario_guardia) {
          conditions.push('g.usuario LIKE ?');
          params.push(`%${options.where.usuario_guardia}%`);
        }
        
        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      }
      
      query += whereClause;
      
      // Ordenamiento
      query += ' ORDER BY i.inicio DESC';
      
      // Límite de resultados
      if (options.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(options.limit));
        
        if (options.offset) {
          query += ' OFFSET ?';
          params.push(parseInt(options.offset));
        }
      }
      
      // Ejecutar consulta principal para obtener incidentes
      const [rows] = await pool.query(query, params);
      
      // Para cada incidente, obtener sus códigos aplicados en una consulta separada
      for (const incidente of rows) {
        const [codigos] = await pool.query(`
          SELECT ic.id, ic.id_codigo, c.codigo, c.descripcion, ic.minutos, ic.importe
          FROM taskmanagementsystem.incidentes_codigos ic
          JOIN taskmanagementsystem.codigos_facturacion c ON ic.id_codigo = c.id
          WHERE ic.id_incidente = ?
        `, [incidente.id]);
        
        incidente.codigos_aplicados = codigos;
      }
      
      // Adjuntar métodos a cada incidente
      return rows.map(row => Incidente.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar incidentes:', error);
      throw error;
    }
  },
  
  // Encontrar un incidente por ID
  findByPk: async (id) => {
    try {
      // Consulta principal para obtener el incidente
      const query = `
        SELECT i.*,
               g.fecha as fecha_guardia,
               g.usuario as usuario_guardia
        FROM taskmanagementsystem.incidentes_guardia i
        JOIN taskmanagementsystem.guardias g ON i.id_guardia = g.id
        WHERE i.id = ?
      `;
      
      const [rows] = await pool.query(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // Obtener códigos aplicados en una consulta separada
      const [codigos] = await pool.query(`
        SELECT ic.id, ic.id_codigo, c.codigo, c.descripcion, ic.minutos, ic.importe
        FROM taskmanagementsystem.incidentes_codigos ic
        JOIN taskmanagementsystem.codigos_facturacion c ON ic.id_codigo = c.id
        WHERE ic.id_incidente = ?
      `, [id]);
      
      rows[0].codigos_aplicados = codigos;
      
      return Incidente.attachMethods(rows[0]);
    } catch (error) {
      console.error(`❌ MODELO: Error al buscar incidente con ID ${id}:`, error);
      throw error;
    }
  },
  
  // ✅ CREAR UN NUEVO INCIDENTE - LOGS LIMPIOS
  create: async (data) => {
    const connection = await pool.getConnection();
    
    try {
      const { 
        id_guardia, 
        inicio, 
        fin, 
        descripcion, 
        estado = 'registrado', 
        id_usuario_registro, 
        observaciones, 
        codigos 
      } = data;
      
      // ✨ CONVERTIR UNDEFINED A NULL PARA MYSQL2
      const usuarioRegistro = id_usuario_registro === undefined ? null : id_usuario_registro;
      const observacionesLimpias = observaciones === undefined ? null : observaciones;
      
      // Iniciar transacción
      await connection.beginTransaction();
      
      // ✨ INSERTAR INCIDENTE CON PARÁMETROS LIMPIOS
      const [resultIncidente] = await connection.execute(
        'INSERT INTO taskmanagementsystem.incidentes_guardia (id_guardia, inicio, fin, descripcion, estado, id_usuario_registro, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id_guardia, inicio, fin, descripcion, estado, usuarioRegistro, observacionesLimpias]
      );
      
      let incidenteId = resultIncidente.insertId;
      
      // ✨ MANEJO ESPECIAL SI insertId ES 0
      if (!incidenteId || incidenteId === 0) {
        // Buscar el último incidente insertado para esta guardia
        const [ultimoIncidente] = await connection.execute(
          'SELECT id FROM taskmanagementsystem.incidentes_guardia WHERE id_guardia = ? AND descripcion = ? ORDER BY created_at DESC LIMIT 1',
          [id_guardia, descripcion]
        );
        
        if (ultimoIncidente.length > 0) {
          incidenteId = ultimoIncidente[0].id;
        } else {
          throw new Error('No se pudo recuperar el ID del incidente insertado');
        }
      }
      
      // ✨ PREPARAR CÓDIGOS APLICADOS ANTES DEL COMMIT
      let codigosAplicados = [];
      
      // Si hay códigos aplicados, insertarlos
      if (codigos && Array.isArray(codigos) && codigos.length > 0) {
        for (const codigo of codigos) {
          try {
            // ✨ LIMPIAR UNDEFINED EN CÓDIGOS TAMBIÉN
            const importeLimpio = codigo.importe === undefined ? null : codigo.importe;
            const observacionLimpia = codigo.observacion === undefined ? null : codigo.observacion;
            
            const [resultCodigo] = await connection.execute(
              'INSERT INTO taskmanagementsystem.incidentes_codigos (id_incidente, id_codigo, minutos, importe, observacion) VALUES (?, ?, ?, ?, ?)',
              [incidenteId, codigo.id_codigo, codigo.minutos, importeLimpio, observacionLimpia]
            );
            
            // ✨ AGREGAR A LA LISTA DE CÓDIGOS APLICADOS CON DATOS CONOCIDOS
            codigosAplicados.push({
              id: resultCodigo.insertId,
              id_codigo: codigo.id_codigo,
              codigo: codigo.codigo || null,
              descripcion: codigo.descripcion || null,
              minutos: codigo.minutos,
              importe: importeLimpio
            });
            
          } catch (errorCodigo) {
            console.error('❌ Error al insertar código:', errorCodigo);
            // No fallar toda la transacción por un código
          }
        }
      }
      
      // ✨ OBTENER DATOS DE GUARDIA USANDO LA CONEXIÓN DE LA TRANSACCIÓN
      const [guardiaData] = await connection.execute(
        'SELECT fecha, usuario FROM taskmanagementsystem.guardias WHERE id = ?',
        [id_guardia]
      );
      
      const fechaGuardia = guardiaData[0]?.fecha || null;
      const usuarioGuardia = guardiaData[0]?.usuario || null;
      
      // ✨ CALCULAR DURACIÓN EN MINUTOS
      const inicioDate = new Date(inicio);
      const finDate = new Date(fin);
      const duracionMinutos = Math.floor((finDate.getTime() - inicioDate.getTime()) / (1000 * 60));
      
      // ✨ PREPARAR RESPUESTA FINAL CON DATOS DISPONIBLES (ANTES DEL COMMIT)
      const incidenteRespuesta = {
        id: incidenteId,
        id_guardia: id_guardia,
        inicio: inicio,
        fin: fin,
        descripcion: descripcion,
        observaciones: observacionesLimpias,
        estado: estado,
        duracion_minutos: duracionMinutos,
        codigos_aplicados: codigosAplicados,
        fecha_guardia: fechaGuardia,
        usuario_guardia: usuarioGuardia,
        id_usuario_registro: usuarioRegistro,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Confirmar transacción
      await connection.commit();
      
      // ✨ AGREGAR MÉTODOS AL OBJETO RESPUESTA
      const incidenteConMetodos = Incidente.attachMethods(incidenteRespuesta);
      
      return incidenteConMetodos;
      
    } catch (error) {
      // Revertir transacción en caso de error
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('❌ Error al revertir transacción:', rollbackError);
      }
      
      console.error('❌ ERROR EN MODELO CREATE:', error);
      throw error;
    } finally {
      // Liberar conexión
      connection.release();
    }
  },
  
  // Actualizar un incidente existente
  update: async (id, values) => {
    const connection = await pool.getConnection();
    
    try {
      console.log('🔄 MODELO: Actualizando incidente ID:', id);
      console.log('🔄 MODELO: Valores a actualizar:', values);
      
      const { id_guardia, inicio, fin, descripcion, estado, id_usuario_registro, observaciones, codigos } = values;
      
      // Iniciar transacción
      await connection.beginTransaction();
      
      // Actualizar campos del incidente
      const updates = [];
      const params = [];
      
      if (id_guardia !== undefined) {
        updates.push('id_guardia = ?');
        params.push(id_guardia);
      }
      
      if (inicio !== undefined) {
        updates.push('inicio = ?');
        params.push(inicio);
      }
      
      if (fin !== undefined) {
        updates.push('fin = ?');
        params.push(fin);
      }
      
      if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(descripcion);
      }
      
      if (estado !== undefined) {
        updates.push('estado = ?');
        params.push(estado);
      }
      
      if (id_usuario_registro !== undefined) {
        updates.push('id_usuario_registro = ?');
        params.push(id_usuario_registro);
      }
      
      if (observaciones !== undefined) {
        updates.push('observaciones = ?');
        params.push(observaciones);
      }
      
      if (updates.length > 0) {
        params.push(id); // Para la cláusula WHERE
        
        await connection.execute(
          `UPDATE taskmanagementsystem.incidentes_guardia SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
        
        console.log('✅ MODELO: Incidente actualizado');
      }
      
      // Si hay códigos aplicados, actualizar la relación
      if (codigos !== undefined && Array.isArray(codigos)) {
        console.log('🔄 MODELO: Actualizando códigos:', codigos.length);
        
        // Eliminar códigos existentes
        await connection.execute('DELETE FROM taskmanagementsystem.incidentes_codigos WHERE id_incidente = ?', [id]);
        
        // Insertar nuevos códigos
        for (const codigo of codigos) {
          await connection.execute(
            'INSERT INTO taskmanagementsystem.incidentes_codigos (id_incidente, id_codigo, minutos, importe, observacion) VALUES (?, ?, ?, ?, ?)',
            [id, codigo.id_codigo, codigo.minutos, codigo.importe || null, codigo.observacion || null]
          );
        }
        
        console.log('✅ MODELO: Códigos actualizados');
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Devolver el incidente actualizado
      const incidenteActualizado = await Incidente.findByPk(id);
      console.log('✅ MODELO: Incidente actualizado y recuperado');
      
      return incidenteActualizado;
    } catch (error) {
      // Revertir transacción en caso de error
      try {
        await connection.rollback();
        console.log('🔄 TRANSACCIÓN REVERTIDA EN UPDATE');
      } catch (rollbackError) {
        console.error('❌ Error al revertir transacción en update:', rollbackError);
      }
      
      console.error('❌ MODELO: Error al actualizar incidente:', error);
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // ✅ ELIMINAR UN INCIDENTE - LOGS LIMPIOS
  destroy: async (id) => {
    try {
      // ✨ VALIDAR ID ANTES DE LA QUERY
      if (id === undefined || id === null || id === 'undefined' || id === 'null') {
        throw new Error(`ID inválido para eliminar: ${id}`);
      }
      
      // ✨ CONVERTIR A NÚMERO SI ES STRING
      const idNumerico = typeof id === 'string' ? parseInt(id, 10) : id;
      
      if (isNaN(idNumerico)) {
        throw new Error(`ID no es un número válido: ${id}`);
      }
      
      const query = 'DELETE FROM taskmanagementsystem.incidentes_guardia WHERE id = ?';
      const params = [id];
      
      // Las relaciones tienen ON DELETE CASCADE
      const [result] = await pool.query(query, params);
      
      const success = result.affectedRows > 0;
      
      if (!success) {
        console.error('❌ MODELO: No se eliminó ningún incidente con ID:', id);
      }
      
      return success;
    } catch (error) {
      console.error('❌ MODELO: Error al eliminar incidente:', error);
      console.error('❌ MODELO: ID que causó el error:', id);
      throw error;
    }
  },
  
  // Método para adjuntar métodos a un objeto incidente
  attachMethods: (incidente) => {
    // Añadir método update
    incidente.update = async function(values) {
      return Incidente.update(this.id, values);
    };
    
    // Añadir método destroy
    incidente.destroy = async function() {
      return Incidente.destroy(this.id);
    };
    
    return incidente;
  }
};

module.exports = Incidente;