// models/codigo.model.js - VERSIÓN CON MODALIDAD DE CONVENIO
const pool = require('../config/db');
const { Op } = require('./db.operators');

// Modelo de Código de Facturación
const Codigo = {
  // ✨ FUNCIÓN AUXILIAR PARA DETECTAR HORARIOS QUE CRUZAN MEDIANOCHE
  cruzaMedianoche: (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return false;

    // Convertir a minutos desde 00:00
    const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number);
    const [finHoras, finMinutos] = horaFin.split(':').map(Number);

    const inicioEnMinutos = inicioHoras * 60 + inicioMinutos;
    const finEnMinutos = finHoras * 60 + finMinutos;

    return finEnMinutos < inicioEnMinutos;
  },

  // ✨ FUNCIÓN PARA VERIFICAR SI UNA HORA ESTÁ EN UN RANGO (CONSIDERANDO MEDIANOCHE)
  horaEnRango: (horaVerificar, horaInicio, horaFin) => {
    if (!horaVerificar || !horaInicio || !horaFin) return false;

    const [verificarH, verificarM] = horaVerificar.split(':').map(Number);
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);

    const verificarMinutos = verificarH * 60 + verificarM;
    const inicioMinutos = inicioH * 60 + inicioM;
    const finMinutos = finH * 60 + finM;

    if (Codigo.cruzaMedianoche(horaInicio, horaFin)) {
      // Horario cruza medianoche: de inicioMinutos a 1440 (24:00) O de 0 a finMinutos
      return verificarMinutos >= inicioMinutos || verificarMinutos <= finMinutos;
    } else {
      // Horario normal: de inicioMinutos a finMinutos
      return verificarMinutos >= inicioMinutos && verificarMinutos <= finMinutos;
    }
  },

  // ✨ ACTUALIZADO: Encontrar todos los códigos con filtros opcionales (incluye modalidad)
  findAll: async (options = {}) => {
    try {
      console.log('Iniciando findAll con opciones:', JSON.stringify(options));

      let query = 'SELECT * FROM codigos_facturacion';
      const params = [];
      let whereClause = '';

      // Procesar cláusulas WHERE si hay options.where
      if (options.where) {
        const conditions = [];

        if (options.where.tipo) {
          conditions.push('tipo = ?');
          params.push(options.where.tipo);
        }

        if (options.where.estado) {
          conditions.push('estado = ?');
          params.push(options.where.estado);
        }

        // ✨ NUEVO: Filtrar por modalidad de convenio
        if (options.where.modalidad_convenio) {
          conditions.push('modalidad_convenio = ?');
          params.push(options.where.modalidad_convenio);
        }

        if (options.where.fecha_vigencia) {
          conditions.push('(fecha_vigencia_desde <= ? AND (fecha_vigencia_hasta IS NULL OR fecha_vigencia_hasta >= ?))');
          params.push(options.where.fecha_vigencia, options.where.fecha_vigencia);
        }

        if (options.where.search) {
          conditions.push('(codigo LIKE ? OR descripcion LIKE ? OR notas LIKE ?)');
          params.push(`%${options.where.search}%`, `%${options.where.search}%`, `%${options.where.search}%`);
        }

        if (options.where.codigo) {
          conditions.push('codigo = ?');
          params.push(options.where.codigo);
        }

        if (conditions.length > 0) {
          whereClause = ' WHERE ' + conditions.join(' AND ');
        }
      } else {
        whereClause = ' WHERE estado = "activo"';
      }

      query += whereClause + ' ORDER BY modalidad_convenio, codigo ASC';

      console.log('Ejecutando consulta SQL:', query);
      console.log('Con parámetros:', params);

      const [rows] = await pool.query(query, params);

      console.log(`findAll: Se encontraron ${rows.length} códigos`);

      return rows.map(row => Codigo.attachMethods(row));
    } catch (error) {
      console.error('Error al buscar códigos de facturación:', error);
      throw error;
    }
  },

  // Encontrar un código por ID
  findByPk: async (id) => {
    try {
      console.log('Buscando código por ID:', id);

      const [rows] = await pool.query('SELECT * FROM codigos_facturacion WHERE id = ?', [id]);

      if (rows.length === 0) return null;

      return Codigo.attachMethods(rows[0]);
    } catch (error) {
      console.error(`Error al buscar código con ID ${id}:`, error);
      throw error;
    }
  },

  // ✨ ACTUALIZADO: FUNCIÓN MEJORADA PARA ENCONTRAR CÓDIGOS APLICABLES (CON MODALIDAD DE CONVENIO)
  findApplicable: async (fecha, horaInicio, horaFin, modalidadConvenio = 'FC') => {
    try {
      console.log('🔍 Buscando códigos aplicables:', {
        fecha,
        horaInicio,
        horaFin,
        modalidadConvenio
      });

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

      console.log('📅 Día de la semana:', dayOfWeek, 'Es feriado:', esFeriado, 'Modalidad:', modalidadConvenio);

      // ✨ CONSULTA ACTUALIZADA: Incluir filtro por modalidad de convenio
      const query = `
        SELECT * FROM codigos_facturacion
        WHERE estado = 'activo'
        AND modalidad_convenio = ?
        AND (fecha_vigencia_desde <= ? AND (fecha_vigencia_hasta IS NULL OR fecha_vigencia_hasta >= ?))
        AND (
          -- Si es feriado y el código aplica a feriados
          (? = TRUE AND LOCATE('F', dias_aplicables) > 0)
          OR
          -- Si no es feriado, verificar el día de la semana
          (? = FALSE AND LOCATE(?, dias_aplicables) > 0)
        )
        ORDER BY tipo, codigo
      `;

      const params = [
        modalidadConvenio,      // ✨ NUEVO PARÁMETRO: Modalidad de convenio
        fecha, fecha,           // Para vigencia
        esFeriado, esFeriado,   // Para verificación de feriado
        dayOfWeek               // Para día de la semana
      ];

      console.log('📋 Consulta SQL:', query);
      console.log('📋 Parámetros:', params);

      const [rows] = await pool.query(query, params);

      console.log(`📋 Se encontraron ${rows.length} códigos candidatos para modalidad ${modalidadConvenio}`);

      // ✨ FILTRAR POR HORARIO USANDO LÓGICA DE MEDIANOCHE
      const codigosAplicables = rows.filter(codigo => {
        // Si el código no tiene horario específico, siempre aplica
        if (!codigo.hora_inicio || !codigo.hora_fin) {
          console.log(`✅ Código ${codigo.codigo} (${codigo.modalidad_convenio}): Aplica todo el día`);
          return true;
        }

        // Verificar si hay intersección de horarios
        const hayInterseccion = Codigo.verificarInterseccionHorarios(
          horaInicio, horaFin,
          codigo.hora_inicio, codigo.hora_fin
        );

        console.log(`${hayInterseccion ? '✅' : '❌'} Código ${codigo.codigo} (${codigo.modalidad_convenio}): Horario ${codigo.hora_inicio}-${codigo.hora_fin} ${hayInterseccion ? 'intersecta' : 'NO intersecta'} con ${horaInicio}-${horaFin}`);

        return hayInterseccion;
      });

      console.log(`🎯 RESULTADO: ${codigosAplicables.length} códigos aplicables para modalidad ${modalidadConvenio}`);

      return codigosAplicables.map(row => Codigo.attachMethods(row));
    } catch (error) {
      console.error('❌ Error al buscar códigos aplicables:', error);
      throw error;
    }
  },

  // ✨ FUNCIÓN PARA VERIFICAR INTERSECCIÓN DE HORARIOS (CONSIDERANDO MEDIANOCHE)
  verificarInterseccionHorarios: (inicio1, fin1, inicio2, fin2) => {
    console.log(`🔄 Verificando intersección: [${inicio1}-${fin1}] vs [${inicio2}-${fin2}]`);

    // Convertir a minutos
    const convertirAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const minutos1Inicio = convertirAMinutos(inicio1);
    const minutos1Fin = convertirAMinutos(fin1);
    const minutos2Inicio = convertirAMinutos(inicio2);
    const minutos2Fin = convertirAMinutos(fin2);

    const rango1CruzaMedianoche = minutos1Fin < minutos1Inicio;
    const rango2CruzaMedianoche = minutos2Fin < minutos2Inicio;

    console.log(`🌙 Rango 1 cruza medianoche: ${rango1CruzaMedianoche}`);
    console.log(`🌙 Rango 2 cruza medianoche: ${rango2CruzaMedianoche}`);

    // Caso 1: Ninguno cruza medianoche (lógica tradicional)
    if (!rango1CruzaMedianoche && !rango2CruzaMedianoche) {
      const intersecta = !(minutos1Fin <= minutos2Inicio || minutos2Fin <= minutos1Inicio);
      console.log(`📊 Intersección tradicional: ${intersecta}`);
      return intersecta;
    }

    // Caso 2: Rango 1 cruza medianoche, rango 2 no
    if (rango1CruzaMedianoche && !rango2CruzaMedianoche) {
      const intersecta = (minutos2Inicio >= minutos1Inicio || minutos2Fin <= minutos1Fin) ||
        (minutos2Inicio <= minutos1Fin || minutos2Fin >= minutos1Inicio);
      console.log(`📊 Rango 1 cruza medianoche: ${intersecta}`);
      return intersecta;
    }

    // Caso 3: Rango 2 cruza medianoche, rango 1 no
    if (!rango1CruzaMedianoche && rango2CruzaMedianoche) {
      const intersecta = (minutos1Inicio >= minutos2Inicio || minutos1Fin <= minutos2Fin) ||
        (minutos1Inicio <= minutos2Fin || minutos1Fin >= minutos2Inicio);
      console.log(`📊 Rango 2 cruza medianoche: ${intersecta}`);
      return intersecta;
    }

    // Caso 4: Ambos cruzan medianoche
    if (rango1CruzaMedianoche && rango2CruzaMedianoche) {
      // Si ambos cruzan medianoche, siempre hay alguna intersección
      console.log(`📊 Ambos cruzan medianoche: true`);
      return true;
    }

    return false;
  },

  // ✨ NUEVA FUNCIÓN: Calcular importe de un código específico
  calcularImporteCodigo: async (codigo, incidente, tarifa) => {
    try {
      console.log('💰 Calculando importe para código:', codigo.codigo, 'modalidad:', codigo.modalidad_convenio);

      const inicio = new Date(incidente.inicio);
      const fin = new Date(incidente.fin);
      const duracionMinutos = Math.floor((fin - inicio) / (1000 * 60));
      const duracionHoras = Math.ceil(duracionMinutos / 60); // Fraccionamiento por hora

      let importe = 0;
      let detalle = '';

      switch (codigo.tipo_calculo) {
        case 'guardia_pasiva':
          // Guardia pasiva: valor fijo por período
          importe = tarifa.valor_guardia_pasiva;
          detalle = `Guardia pasiva (${codigo.modalidad_convenio}): $${tarifa.valor_guardia_pasiva}`;
          break;

        case 'hora_activa':
          // Guardia activa: valor por hora con fraccionamiento
          importe = tarifa.valor_hora_activa * duracionHoras;
          detalle = `${duracionHoras}h × $${tarifa.valor_hora_activa} (${codigo.modalidad_convenio}) = $${importe}`;
          break;

        case 'adicional_nocturno':
          // Adicional nocturno: calcular horas nocturnas específicas
          const horasNocturnas = Codigo.calcularHorasNocturnas(inicio, fin);
          const factorNocturno = codigo.factor_adicional || 0.50;
          importe = tarifa.valor_hora_activa * horasNocturnas * factorNocturno;
          detalle = `${horasNocturnas}h nocturnas × $${tarifa.valor_hora_activa} × ${factorNocturno} (${codigo.modalidad_convenio}) = $${importe}`;
          break;

        default:
          console.warn('Tipo de cálculo no reconocido:', codigo.tipo_calculo);
          break;
      }

      return {
        id_codigo: codigo.id,
        codigo: codigo.codigo,
        descripcion: codigo.descripcion,
        modalidad_convenio: codigo.modalidad_convenio,
        tipo_calculo: codigo.tipo_calculo,
        duracion_minutos: duracionMinutos,
        duracion_horas: duracionHoras,
        importe: parseFloat(importe.toFixed(2)),
        detalle_calculo: detalle
      };
    } catch (error) {
      console.error('Error al calcular importe del código:', error);
      throw error;
    }
  },

  // ✨ FUNCIÓN AUXILIAR: Calcular horas en horario nocturno (21:00-06:00)
  calcularHorasNocturnas: (inicio, fin) => {
    let minutosNocturnos = 0;
    const current = new Date(inicio);

    while (current < fin) {
      const hora = current.getHours();

      // Horario nocturno: 21:00 a 23:59 OR 00:00 a 05:59
      const esHorarioNocturno = hora >= 21 || hora <= 5;

      if (esHorarioNocturno) {
        const siguiente = new Date(current);
        siguiente.setHours(siguiente.getHours() + 1, 0, 0, 0);

        const finSegmento = siguiente < fin ? siguiente : fin;
        const minutosSegmento = Math.floor((finSegmento - current) / (1000 * 60));

        minutosNocturnos += minutosSegmento;
      }

      current.setHours(current.getHours() + 1, 0, 0, 0);
    }

    return Math.ceil(minutosNocturnos / 60); // Fraccionamiento por hora
  },

  // ✨ ACTUALIZADO: Crear un nuevo código (incluye modalidad)
  // ✨ ACTUALIZADO: Crear un nuevo código (incluye modalidad)
  create: async (data) => {
    try {
      const { 
        codigo, descripcion, notas, tipo, dias_aplicables, 
        hora_inicio, hora_fin, factor_multiplicador,
        fecha_vigencia_desde, fecha_vigencia_hasta, estado = 'activo',
        modalidad_convenio = 'FC', // ✨ NUEVO CAMPO CON DEFAULT
        // ✨ SOLO CAMPOS QUE EXISTEN EN LA TABLA
        tipo_calculo, factor_adicional, unidad_facturacion
      } = data;
      
      console.log('🚀 CREANDO CÓDIGO:', {
        codigo, descripcion, notas, tipo, dias_aplicables,
        hora_inicio, hora_fin, factor_multiplicador,
        fecha_vigencia_desde, fecha_vigencia_hasta, estado,
        modalidad_convenio, // ✨ NUEVO
        tipo_calculo, factor_adicional, unidad_facturacion
      });

      // ✨ VALIDAR HORARIOS QUE CRUZAN MEDIANOCHE
      if (hora_inicio && hora_fin) {
        const cruzaMedianoche = Codigo.cruzaMedianoche(hora_inicio, hora_fin);
        console.log(`🌙 Horario ${hora_inicio}-${hora_fin} ${cruzaMedianoche ? 'CRUZA' : 'NO CRUZA'} medianoche`);
      }
      
      // Verificar duplicados (considerando modalidad)
      const [existingCodigos] = await pool.query(
        'SELECT id, codigo, modalidad_convenio FROM codigos_facturacion WHERE codigo = ? AND modalidad_convenio = ?',
        [codigo, modalidad_convenio]
      );
      
      if (existingCodigos.length > 0) {
        const error = new Error(`El código "${codigo}" ya existe para la modalidad ${modalidad_convenio}.`);
        error.statusCode = 409;
        throw error;
      }
      
      // ✨ QUERY CORREGIDO - SIN usa_tarifa_base
      const insertQuery = `
        INSERT INTO codigos_facturacion 
        (codigo, descripcion, notas, tipo, dias_aplicables, hora_inicio, hora_fin, 
         factor_multiplicador, fecha_vigencia_desde, fecha_vigencia_hasta, estado,
         modalidad_convenio, tipo_calculo, factor_adicional, unidad_facturacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // ✨ PARÁMETROS CORREGIDOS - SIN usa_tarifa_base
      const insertParams = [
        codigo, descripcion, notas || null, tipo, 
        dias_aplicables || 'L,M,X,J,V,S,D', 
        hora_inicio || null, hora_fin || null, 
        factor_multiplicador || 1.00,
        fecha_vigencia_desde, fecha_vigencia_hasta || null, estado,
        modalidad_convenio, // ✨ NUEVO PARÁMETRO
        tipo_calculo || 'hora_activa',
        factor_adicional || null,
        unidad_facturacion || 'por_hora'
      ];
      
      console.log('📝 SQL INSERT:', insertQuery);
      console.log('📝 PARÁMETROS:', insertParams);
      
      const [result] = await pool.query(insertQuery, insertParams);
      const codigoId = result.insertId;
      
      console.log('✅ Código creado exitosamente con ID:', codigoId);
      
      return Codigo.findByPk(codigoId);
    } catch (error) {
      console.error('❌ Error al crear código:', error);
      throw error;
    }
  },

  // ✨ ACTUALIZADO: Actualizar un código existente (incluye modalidad)
  update: async (id, values) => {
    try {
      const { 
        codigo, descripcion, notas, tipo, dias_aplicables, 
        hora_inicio, hora_fin, factor_multiplicador,
        fecha_vigencia_desde, fecha_vigencia_hasta, estado,
        modalidad_convenio, // ✨ NUEVO CAMPO
        // ✨ SOLO CAMPOS QUE EXISTEN EN LA TABLA
        tipo_calculo, factor_adicional, unidad_facturacion
      } = values;
      
      console.log('🔄 ACTUALIZANDO código con ID:', id);
      console.log('🔄 Valores:', values);

      // ✨ VALIDAR HORARIOS QUE CRUZAN MEDIANOCHE
      if (hora_inicio && hora_fin) {
        const cruzaMedianoche = Codigo.cruzaMedianoche(hora_inicio, hora_fin);
        console.log(`🌙 Horario actualizado ${hora_inicio}-${hora_fin} ${cruzaMedianoche ? 'CRUZA' : 'NO CRUZA'} medianoche`);
      }
      
      // Verificar conflictos de código (considerando modalidad)
      if (codigo || modalidad_convenio) {
        const [currentCodigo] = await pool.query(
          'SELECT codigo, modalidad_convenio FROM codigos_facturacion WHERE id = ?',
          [id]
        );
        
        if (currentCodigo.length > 0) {
          const nuevoCodigo = codigo || currentCodigo[0].codigo;
          const nuevaModalidad = modalidad_convenio || currentCodigo[0].modalidad_convenio;
          
          if (nuevoCodigo !== currentCodigo[0].codigo || nuevaModalidad !== currentCodigo[0].modalidad_convenio) {
            const [existingCodigos] = await pool.query(
              'SELECT id, codigo, modalidad_convenio FROM codigos_facturacion WHERE codigo = ? AND modalidad_convenio = ? AND id != ?',
              [nuevoCodigo, nuevaModalidad, id]
            );
            
            if (existingCodigos.length > 0) {
              const error = new Error(`El código "${nuevoCodigo}" ya existe para la modalidad ${nuevaModalidad}.`);
              error.statusCode = 409;
              throw error;
            }
          }
        }
      }
      
      // Construir actualización - ✨ SIN usa_tarifa_base
      const updates = [];
      const params = [];
      
      const fields = {
        codigo, descripcion, notas, tipo, dias_aplicables,
        hora_inicio, hora_fin, factor_multiplicador,
        fecha_vigencia_desde, fecha_vigencia_hasta, estado,
        modalidad_convenio, // ✨ NUEVO CAMPO
        tipo_calculo, factor_adicional, unidad_facturacion
      };
      
      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          params.push(value === '' && key === 'notas' ? null : value);
        }
      });
      
      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      params.push(id);
      
      const updateQuery = `UPDATE codigos_facturacion SET ${updates.join(', ')} WHERE id = ?`;
      console.log('📝 SQL UPDATE:', updateQuery);
      console.log('📝 PARÁMETROS:', params);
      
      const [result] = await pool.query(updateQuery, params);
      
      if (result.affectedRows === 0) {
        return false;
      }
      
      console.log('✅ Código actualizado exitosamente');
      return Codigo.findByPk(id);
    } catch (error) {
      console.error('❌ Error al actualizar código:', error);
      throw error;
    }
  },

  // Desactivar un código
  deactivate: async (id) => {
    try {
      const [result] = await pool.query(
        'UPDATE codigos_facturacion SET estado = "inactivo" WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al desactivar código:', error);
      throw error;
    }
  },

  // Eliminar un código
  destroy: async (id) => {
    try {
      // Verificar uso
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
      console.error('Error al eliminar código:', error);
      throw error;
    }
  },

  // Método para adjuntar métodos a un objeto código
  attachMethods: (codigo) => {
    codigo.update = async function (values) {
      return Codigo.update(this.id, values);
    };

    codigo.destroy = async function () {
      return Codigo.destroy(this.id);
    };

    codigo.deactivate = async function () {
      return Codigo.deactivate(this.id);
    };

    return codigo;
  }
};

module.exports = Codigo;