// controllers/tarifas.controller.js - CONTROLADOR DE TARIFAS CON CORRECCIÓN DE FECHAS
const Tarifa = require('../models/tarifa.model');
const Codigo = require('../models/codigo.model');

// ✨ FUNCIÓN HELPER PARA MANEJAR FECHAS CORRECTAMENTE
const procesarFechaLocal = (fechaString) => {
  try {
    // Si la fecha viene en formato YYYY-MM-DD, la procesamos como fecha local
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaString)) {
      // Crear fecha local sin conversión de zona horaria
      const [year, month, day] = fechaString.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Si viene con hora, procesarla normalmente
    return new Date(fechaString);
  } catch (error) {
    console.error('❌ Error procesando fecha:', fechaString, error);
    return new Date(fechaString); // Fallback
  }
};

// ✨ FUNCIÓN HELPER MEJORADA PARA CREAR FECHAS CON HORAS
const crearFechaConHora = (fecha, hora) => {
  try {
    // Usar fecha local para evitar conversiones de zona horaria
    const fechaBase = procesarFechaLocal(fecha);
    const [hours, minutes] = hora.split(':');
    
    fechaBase.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    console.log(`🕐 Fecha con hora creada: ${fecha} ${hora} -> ${fechaBase.toString()}`);
    
    return fechaBase;
  } catch (error) {
    console.error('❌ Error creando fecha con hora:', error);
    // Fallback al método anterior
    return new Date(`${fecha}T${hora}:00`);
  }
};

// ✨ FUNCIONES HELPER PARA CÁLCULOS - CORREGIDAS
const calcularMinutosNocturnos = (inicio, fin) => {
  try {
    let minutosNocturnos = 0;
    const current = new Date(inicio);
    const finFecha = new Date(fin);
    
    // Protección contra fechas inválidas
    if (isNaN(current.getTime()) || isNaN(finFecha.getTime())) {
      console.log('⚠️ Fechas inválidas para cálculo nocturno');
      return 0;
    }
    
    while (current < finFecha) {
      const hora = current.getHours();
      
      // Horario nocturno: 21:00 a 23:59 OR 00:00 a 05:59
      const esHorarioNocturno = hora >= 21 || hora <= 5;
      
      if (esHorarioNocturno) {
        const siguiente = new Date(current);
        siguiente.setHours(siguiente.getHours() + 1, 0, 0, 0);
        
        const finSegmento = siguiente < finFecha ? siguiente : finFecha;
        const minutosSegmento = Math.floor((finSegmento.getTime() - current.getTime()) / (1000 * 60));
        
        minutosNocturnos += minutosSegmento;
      }
      
      current.setHours(current.getHours() + 1, 0, 0, 0);
    }
    
    return minutosNocturnos;
  } catch (error) {
    console.error('❌ Error calculando minutos nocturnos:', error);
    return 0;
  }
};

// ✨ FUNCIÓN HELPER MEJORADA PARA DETERMINAR TIPO DE DÍA
const determinarTipoDia = (fecha) => {
  try {
    // Usar la nueva función para procesar fechas
    const fechaObj = procesarFechaLocal(fecha);
    
    // Protección contra fechas inválidas
    if (isNaN(fechaObj.getTime())) {
      console.log('⚠️ Fecha inválida para determinar tipo de día');
      return {
        es_fin_semana: false,
        es_domingo: false,
        es_sabado: false,
        dia_semana_nombre: 'Desconocido'
      };
    }
    
    const diaSemana = fechaObj.getDay(); // 0=domingo, 6=sábado
    
    console.log(`📅 Fecha procesada: ${fecha} -> ${fechaObj.toLocaleDateString()} -> Día: ${diaSemana}`);
    
    return {
      es_fin_semana: diaSemana === 0 || diaSemana === 6,
      es_domingo: diaSemana === 0,
      es_sabado: diaSemana === 6,
      dia_semana_nombre: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana]
    };
  } catch (error) {
    console.error('❌ Error determinando tipo de día:', error);
    return {
      es_fin_semana: false,
      es_domingo: false,
      es_sabado: false,
      dia_semana_nombre: 'Error'
    };
  }
};

// Obtener todas las tarifas con filtros opcionales
exports.getTarifas = async (req, res) => {
  try {
    console.log('🔍 TARIFAS CONTROLLER: Obteniendo tarifas con query:', req.query);
    
    const { estado, nombre, incluir_inactivas } = req.query;
    
    const options = { where: {} };
    
    // Aplicar filtros si se proporcionan
    if (estado) {
      options.where.estado = estado;
    } else if (incluir_inactivas !== 'true') {
      // Por defecto, mostrar solo activas
      options.where.estado = 'activo';
    }
    
    if (nombre) {
      options.where.nombre = nombre;
    }
    
    const tarifas = await Tarifa.findAll(options);
    
    console.log(`✅ Se encontraron ${tarifas.length} tarifas`);
    
    res.status(200).json({
      success: true,
      count: tarifas.length,
      data: tarifas
    });
  } catch (error) {
    console.error('❌ Error al obtener tarifas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarifas',
      error: error.message
    });
  }
};

// Obtener una tarifa por ID
exports.getTarifaById = async (req, res) => {
  try {
    console.log('🔍 TARIFAS CONTROLLER: Obteniendo tarifa por ID:', req.params.id);
    
    const tarifa = await Tarifa.findByPk(req.params.id);
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        message: 'Tarifa no encontrada'
      });
    }
    
    console.log('✅ Tarifa encontrada:', tarifa.nombre);
    
    res.status(200).json({
      success: true,
      data: tarifa
    });
  } catch (error) {
    console.error('❌ Error al obtener tarifa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarifa',
      error: error.message
    });
  }
};

// ✨ ENDPOINT CLAVE: Obtener tarifa vigente para una fecha
exports.getTarifaVigente = async (req, res) => {
  try {
    const { fecha } = req.query;
    
    console.log('📅 TARIFAS CONTROLLER: Obteniendo tarifa vigente para fecha:', fecha);
    
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el parámetro fecha (formato YYYY-MM-DD)'
      });
    }
    
    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD'
      });
    }
    
    const tarifa = await Tarifa.findVigenteEnFecha(fecha);
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        message: `No se encontró tarifa vigente para la fecha ${fecha}`
      });
    }
    
    console.log('✅ Tarifa vigente encontrada:', tarifa.nombre);
    
    res.status(200).json({
      success: true,
      data: tarifa
    });
  } catch (error) {
    console.error('❌ Error al obtener tarifa vigente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarifa vigente',
      error: error.message
    });
  }
};

// Crear una nueva tarifa
exports.createTarifa = async (req, res) => {
  try {
    console.log('🚀 TARIFAS CONTROLLER: Creando nueva tarifa:', req.body);
    
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
    } = req.body;
    
    // Validaciones
    if (!nombre || !valor_guardia_pasiva || !valor_hora_activa || 
        !valor_adicional_nocturno_habil || !valor_adicional_nocturno_no_habil || 
        !vigencia_desde) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: nombre, valores de tarifa y fecha de vigencia'
      });
    }
    
    // Validar que los valores sean números positivos
    const valores = {
      valor_guardia_pasiva,
      valor_hora_activa,
      valor_adicional_nocturno_habil,
      valor_adicional_nocturno_no_habil
    };
    
    for (const [campo, valor] of Object.entries(valores)) {
      const numero = parseFloat(valor);
      if (isNaN(numero) || numero < 0) {
        return res.status(400).json({
          success: false,
          message: `El campo ${campo} debe ser un número positivo`
        });
      }
    }
    
    // Crear la tarifa
    const nuevaTarifa = await Tarifa.create({
      nombre,
      valor_guardia_pasiva,
      valor_hora_activa,
      valor_adicional_nocturno_habil,
      valor_adicional_nocturno_no_habil,
      vigencia_desde,
      vigencia_hasta,
      estado: estado || 'activo',
      observaciones
    });
    
    console.log('✅ Tarifa creada exitosamente:', nuevaTarifa.nombre);
    
    res.status(201).json({
      success: true,
      message: 'Tarifa creada correctamente',
      data: nuevaTarifa
    });
  } catch (error) {
    console.error('❌ Error al crear tarifa:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al crear tarifa',
      error: error.message
    });
  }
};

// Actualizar una tarifa existente
exports.updateTarifa = async (req, res) => {
  try {
    console.log('🔄 TARIFAS CONTROLLER: Actualizando tarifa ID:', req.params.id);
    console.log('🔄 Datos recibidos:', req.body);
    
    const tarifaId = req.params.id;
    
    // Verificar que la tarifa existe
    const tarifaExistente = await Tarifa.findByPk(tarifaId);
    if (!tarifaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Tarifa no encontrada'
      });
    }
    
    // Validar valores numéricos si se proporcionan
    const camposNumericos = [
      'valor_guardia_pasiva',
      'valor_hora_activa', 
      'valor_adicional_nocturno_habil',
      'valor_adicional_nocturno_no_habil'
    ];
    
    for (const campo of camposNumericos) {
      if (req.body[campo] !== undefined) {
        const numero = parseFloat(req.body[campo]);
        if (isNaN(numero) || numero < 0) {
          return res.status(400).json({
            success: false,
            message: `El campo ${campo} debe ser un número positivo`
          });
        }
      }
    }
    
    // Actualizar la tarifa
    const tarifaActualizada = await tarifaExistente.update(req.body);
    
    console.log('✅ Tarifa actualizada exitosamente:', tarifaActualizada.nombre);
    
    res.status(200).json({
      success: true,
      message: 'Tarifa actualizada correctamente',
      data: tarifaActualizada
    });
  } catch (error) {
    console.error('❌ Error al actualizar tarifa:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al actualizar tarifa',
      error: error.message
    });
  }
};

// Desactivar una tarifa
exports.deactivateTarifa = async (req, res) => {
  try {
    console.log('🗑️ TARIFAS CONTROLLER: Desactivando tarifa ID:', req.params.id);
    
    const tarifa = await Tarifa.findByPk(req.params.id);
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        message: 'Tarifa no encontrada'
      });
    }
    
    await tarifa.deactivate();
    
    console.log('✅ Tarifa desactivada:', tarifa.nombre);
    
    res.status(200).json({
      success: true,
      message: 'Tarifa desactivada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al desactivar tarifa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar tarifa',
      error: error.message
    });
  }
};

// Eliminar una tarifa
exports.deleteTarifa = async (req, res) => {
  try {
    console.log('🗑️ TARIFAS CONTROLLER: Eliminando tarifa ID:', req.params.id);
    
    const tarifa = await Tarifa.findByPk(req.params.id);
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        message: 'Tarifa no encontrada'
      });
    }
    
    try {
      await tarifa.destroy();
      
      console.log('✅ Tarifa eliminada:', tarifa.nombre);
      
      res.status(200).json({
        success: true,
        message: 'Tarifa eliminada correctamente'
      });
    } catch (error) {
      if (error.message.includes('está siendo utilizada')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error al eliminar tarifa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tarifa',
      error: error.message
    });
  }
};

// ✨ SIMULADOR DE CÁLCULOS MEJORADO - CON CÓDIGOS APLICADOS Y FECHAS CORREGIDAS
exports.simularCalculo = async (req, res) => {
  try {
    console.log('🧮 TARIFAS CONTROLLER: Simulando cálculo con parámetros:', req.body);
    
    const {
      fecha,
      hora_inicio,
      hora_fin,
      tipo_guardia,
      id_tarifa
    } = req.body;
    
    // ✅ VALIDACIONES (mantener las existentes)
    if (!fecha || !hora_inicio || !hora_fin || !tipo_guardia) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren: fecha, hora_inicio, hora_fin y tipo_guardia'
      });
    }

    // Validaciones de formato (mantener las existentes)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    const horaRegex = /^\d{2}:\d{2}$/;
    const tiposValidos = ['pasiva', 'activa', 'ambas'];
    
    if (!fechaRegex.test(fecha) || !horaRegex.test(hora_inicio) || !horaRegex.test(hora_fin)) {
      return res.status(400).json({
        success: false,
        message: 'Formatos inválidos. Use fecha: YYYY-MM-DD, hora: HH:MM'
      });
    }

    if (!tiposValidos.includes(tipo_guardia)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de guardia debe ser: pasiva, activa o ambas'
      });
    }
    
    // ✅ OBTENER TARIFA (mantener lógica existente)
    let tarifa;
    try {
      if (id_tarifa) {
        tarifa = await Tarifa.findByPk(id_tarifa);
        if (!tarifa) {
          return res.status(404).json({
            success: false,
            message: `Tarifa con ID ${id_tarifa} no encontrada`
          });
        }
      } else {
        tarifa = await Tarifa.findVigenteEnFecha(fecha);
        if (!tarifa) {
          return res.status(404).json({
            success: false,
            message: `No hay tarifa vigente para la fecha ${fecha}`
          });
        }
      }
      
      console.log('✅ Tarifa obtenida:', tarifa.nombre);
      
    } catch (modelError) {
      console.error('❌ Error accediendo al modelo Tarifa:', modelError);
      return res.status(500).json({
        success: false,
        message: 'Error al acceder a la base de datos de tarifas',
        error: modelError.message
      });
    }
    
    // ✅ ANÁLISIS TEMPORAL (VERSIÓN CORREGIDA)
    let tipoDia;
    try {
      tipoDia = determinarTipoDia(fecha);
      console.log('📅 Análisis temporal corregido:', tipoDia);
    } catch (tipoError) {
      console.error('❌ Error en análisis temporal:', tipoError);
      return res.status(400).json({
        success: false,
        message: 'Error al analizar la fecha proporcionada'
      });
    }
    
    const esDiaNoLaboral = tipoDia.es_fin_semana;
    
    // ✅ CREAR OBJETOS DATE (VERSIÓN CORREGIDA)
    let inicio, fin;
    try {
      // Usar las nuevas funciones para evitar problemas de zona horaria
      inicio = crearFechaConHora(fecha, hora_inicio);
      fin = crearFechaConHora(fecha, hora_fin);
      
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        throw new Error('Fechas u horas inválidas');
      }
      
      // Si la hora de fin es menor o igual a la de inicio, asumir que cruza medianoche
      if (fin <= inicio) {
        fin.setDate(fin.getDate() + 1);
        console.log('🌙 Horario cruza medianoche - ajustado correctamente');
      }
      
      console.log(`📅 Fechas procesadas - Inicio: ${inicio.toString()}, Fin: ${fin.toString()}`);
      
    } catch (fechaError) {
      console.error('❌ Error creando fechas:', fechaError);
      return res.status(400).json({
        success: false,
        message: 'Error al procesar las fechas y horas proporcionadas'
      });
    }
    
    // ✅ CÁLCULOS DE DURACIÓN (mantener lógica existente)
    let duracionMinutos, duracionHoras, minutosNocturnos, horasNocturnas;
    try {
      duracionMinutos = Math.floor((fin - inicio) / (1000 * 60));
      duracionHoras = Math.ceil(duracionMinutos / 60);
      minutosNocturnos = calcularMinutosNocturnos(inicio, fin);
      horasNocturnas = Math.ceil(minutosNocturnos / 60);
      
      if (duracionMinutos < 0 || duracionHoras < 0) {
        throw new Error('Duración calculada inválida');
      }
      
    } catch (calcError) {
      console.error('❌ Error en cálculos de duración:', calcError);
      return res.status(400).json({
        success: false,
        message: 'Error al calcular las duraciones'
      });
    }

    // ✨ NUEVO: OBTENER CÓDIGOS APLICABLES
    let codigosAplicables = [];
    try {
      console.log('🔍 Buscando códigos aplicables...');
      codigosAplicables = await Codigo.findApplicable(fecha, hora_inicio, hora_fin);
      console.log(`✅ Se encontraron ${codigosAplicables.length} códigos aplicables`);
    } catch (codigoError) {
      console.error('❌ Error al obtener códigos aplicables:', codigoError);
      // No fallar por esto, continuar sin códigos
    }
    
    // ✅ INICIALIZAR RESULTADO CON ESTRUCTURA COMPLETA + CÓDIGOS
    const resultado = {
      tarifa_utilizada: {
        id: tarifa.id,
        nombre: tarifa.nombre,
        vigor_desde: tarifa.vigencia_desde,
        valores: {
          guardia_pasiva: parseFloat(tarifa.valor_guardia_pasiva),
          hora_activa: parseFloat(tarifa.valor_hora_activa),
          nocturno_habil: parseFloat(tarifa.valor_adicional_nocturno_habil),
          nocturno_no_habil: parseFloat(tarifa.valor_adicional_nocturno_no_habil)
        }
      },
      parametros_calculo: {
        fecha,
        hora_inicio,
        hora_fin,
        tipo_guardia,
        duracion_minutos: duracionMinutos,
        duracion_horas: duracionHoras,
        minutos_nocturnos: minutosNocturnos,
        horas_nocturnas: horasNocturnas,
        es_dia_no_laboral: esDiaNoLaboral,
        dia_semana: tipoDia.dia_semana_nombre
      },
      calculos: {
        guardia_pasiva: 0,
        guardia_activa: 0,
        adicional_nocturno: 0,
        total: 0
      },
      detalle: [],
      // ✨ NUEVA SECCIÓN: CÓDIGOS APLICABLES
      codigos_aplicables: codigosAplicables.map(codigo => ({
        id: codigo.id,
        codigo: codigo.codigo,
        descripcion: codigo.descripcion,
        tipo: codigo.tipo,
        factor_multiplicador: codigo.factor_multiplicador,
        dias_aplicables: codigo.dias_aplicables,
        horario: {
          inicio: codigo.hora_inicio,
          fin: codigo.hora_fin,
          cruza_medianoche: codigo.hora_inicio && codigo.hora_fin ? 
            Codigo.cruzaMedianoche(codigo.hora_inicio, codigo.hora_fin) : false
        },
        aplicabilidad: {
          aplica_por_dia: true, // Ya filtrado por el modelo
          aplica_por_horario: true, // Ya filtrado por el modelo
          motivo: exports.obtenerMotivoAplicabilidad(codigo, tipoDia)
        }
      }))
    };
    
    // ✅ CÁLCULOS SEGÚN TIPO DE GUARDIA (mantener lógica existente pero mejorada)
    try {
      if (tipo_guardia === 'pasiva' || tipo_guardia === 'ambas') {
        const resultadoGuardiaP = exports.calcularGuardiasPasivas(tarifa, tipoDia, hora_inicio);
        resultado.calculos.guardia_pasiva = resultadoGuardiaP.importe;
        resultado.detalle.push(resultadoGuardiaP.detalle);
      }
      
      if (tipo_guardia === 'activa' || tipo_guardia === 'ambas') {
        const resultadoGuardiaA = exports.calcularGuardiasActivas(
          tarifa, duracionHoras, esDiaNoLaboral
        );
        resultado.calculos.guardia_activa = resultadoGuardiaA.importe;
        resultado.detalle.push(resultadoGuardiaA.detalle);
        
        // Adicional Nocturno si aplica
        if (horasNocturnas > 0) {
          const resultadoNocturno = exports.calcularAdicionalNocturno(
            tarifa, horasNocturnas, esDiaNoLaboral
          );
          resultado.calculos.adicional_nocturno = resultadoNocturno.importe;
          resultado.detalle.push(resultadoNocturno.detalle);
        }
      }
      
      // Calcular total
      resultado.calculos.total = parseFloat((
        resultado.calculos.guardia_pasiva + 
        resultado.calculos.guardia_activa + 
        resultado.calculos.adicional_nocturno
      ).toFixed(2));
      
      console.log('✅ Simulación completada. Total:', resultado.calculos.total);
      console.log(`✅ Códigos aplicables incluidos: ${resultado.codigos_aplicables.length}`);
      
    } catch (calcError) {
      console.error('❌ Error en cálculos de tarifa:', calcError);
      return res.status(500).json({
        success: false,
        message: 'Error al realizar los cálculos de tarifa'
      });
    }
    
    res.status(200).json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Error general en simulación de cálculo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno en simulación de cálculo',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ✨ FUNCIONES AUXILIARES PARA EL SIMULADOR

// Obtener motivo de aplicabilidad de un código
exports.obtenerMotivoAplicabilidad = (codigo, tipoDia) => {
  const motivos = [];
  
  if (codigo.dias_aplicables.includes('F') && tipoDia.es_fin_semana) {
    motivos.push('Es fin de semana');
  }
  
  if (codigo.dias_aplicables.includes(tipoDia.dia_semana_nombre.charAt(0))) {
    motivos.push(`Aplica para ${tipoDia.dia_semana_nombre}`);
  }
  
  if (codigo.hora_inicio && codigo.hora_fin) {
    const cruzaMedianoche = Codigo.cruzaMedianoche(codigo.hora_inicio, codigo.hora_fin);
    motivos.push(`Horario: ${codigo.hora_inicio}-${codigo.hora_fin}${cruzaMedianoche ? ' (cruza medianoche)' : ''}`);
  } else {
    motivos.push('Sin restricción horaria');
  }
  
  return motivos.join(', ');
};

// Calcular guardias pasivas con detalles
exports.calcularGuardiasPasivas = (tarifa, tipoDia, horaInicio) => {
  let valorGuardiaP = parseFloat(tarifa.valor_guardia_pasiva);
  let descripcionGuardiaP = 'Guardia pasiva estándar';
  
  if (tipoDia.es_sabado) {
    const horaInicioNum = parseInt(horaInicio.split(':')[0]);
    if (horaInicioNum >= 7 && horaInicioNum < 13) {
      valorGuardiaP = valorGuardiaP * 0.75;
      descripcionGuardiaP = 'Guardia pasiva sábado mañana (6h)';
    } else {
      valorGuardiaP = valorGuardiaP * 1.375;
      descripcionGuardiaP = 'Guardia pasiva sábado tarde (11h)';
    }
  } else if (tipoDia.es_domingo) {
    valorGuardiaP = valorGuardiaP * 2.125;
    descripcionGuardiaP = 'Guardia pasiva domingo (17h)';
  }
  
  return {
    importe: parseFloat(valorGuardiaP.toFixed(2)),
    detalle: {
      concepto: 'Guardia Pasiva',
      descripcion: descripcionGuardiaP,
      calculo: `${tarifa.valor_guardia_pasiva} × factor`,
      importe: parseFloat(valorGuardiaP.toFixed(2))
    }
  };
};

// Calcular guardias activas con detalles
exports.calcularGuardiasActivas = (tarifa, duracionHoras, esDiaNoLaboral) => {
  let tarifaHoraActiva = parseFloat(tarifa.valor_hora_activa);
  
  if (esDiaNoLaboral) {
    tarifaHoraActiva *= 1.5;
  }
  
  const importeGuardiaA = tarifaHoraActiva * duracionHoras;
  
  return {
    importe: parseFloat(importeGuardiaA.toFixed(2)),
    detalle: {
      concepto: 'Guardia Activa',
      descripcion: `${duracionHoras}h de incidente${esDiaNoLaboral ? ' (día no laboral)' : ''}`,
      calculo: `${duracionHoras}h × ${tarifaHoraActiva.toFixed(2)}`,
      importe: parseFloat(importeGuardiaA.toFixed(2))
    }
  };
};

// Calcular adicional nocturno con detalles
exports.calcularAdicionalNocturno = (tarifa, horasNocturnas, esDiaNoLaboral) => {
  const valorNocturno = esDiaNoLaboral ? 
    parseFloat(tarifa.valor_adicional_nocturno_no_habil) : 
    parseFloat(tarifa.valor_adicional_nocturno_habil);
  
  const importeNocturno = valorNocturno * horasNocturnas;
  
  return {
    importe: parseFloat(importeNocturno.toFixed(2)),
    detalle: {
      concepto: 'Adicional Nocturno',
      descripcion: `${horasNocturnas}h nocturnas ${esDiaNoLaboral ? '(no hábil)' : '(hábil)'}`,
      calculo: `${horasNocturnas}h × ${valorNocturno.toFixed(2)}`,
      importe: parseFloat(importeNocturno.toFixed(2))
    }
  };
};

// ✨ ANALIZAR CÓDIGOS APLICABLES PARA UNA FECHA/HORA
exports.analizarCodigosAplicables = async (req, res) => {
  try {
    console.log('🔍 TARIFAS CONTROLLER: Analizando códigos aplicables:', req.query);
    
    const { fecha, hora_inicio, hora_fin } = req.query;
    
    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros: fecha, hora_inicio, hora_fin'
      });
    }
    
    // Usar el modelo de Código para encontrar aplicables
    const codigosAplicables = await Codigo.findApplicable(fecha, hora_inicio, hora_fin);
    
    // Obtener tarifa vigente
    const tarifa = await Tarifa.findVigenteEnFecha(fecha);
    
    const analisis = {
      fecha,
      hora_inicio,
      hora_fin,
      tarifa_vigente: tarifa,
      codigos_aplicables: codigosAplicables.map(codigo => ({
        id: codigo.id,
        codigo: codigo.codigo,
        descripcion: codigo.descripcion,
        tipo: codigo.tipo,
        factor_multiplicador: codigo.factor_multiplicador,
        dias_aplicables: codigo.dias_aplicables,
        horario: {
          inicio: codigo.hora_inicio,
          fin: codigo.hora_fin
        }
      })),
      total_codigos: codigosAplicables.length
    };
    
    console.log(`✅ Análisis completado. ${codigosAplicables.length} códigos aplicables`);
    
    res.status(200).json({
      success: true,
      data: analisis
    });
  } catch (error) {
    console.error('❌ Error al analizar códigos aplicables:', error);
    res.status(500).json({
      success: false,
      message: 'Error al analizar códigos aplicables',
      error: error.message
    });
  }
};

// ✨ OBTENER EJEMPLOS PRE-CALCULADOS
exports.obtenerEjemplos = async (req, res) => {
  try {
    console.log('📚 TARIFAS CONTROLLER: Generando ejemplos de cálculo');
    
    // Obtener tarifa vigente actual
    const fechaHoy = new Date().toISOString().split('T')[0];
    const tarifa = await Tarifa.findVigenteEnFecha(fechaHoy);
    
    if (!tarifa) {
      return res.status(404).json({
        success: false,
        message: 'No hay tarifa vigente para generar ejemplos'
      });
    }
    
    const ejemplos = [
      {
        nombre: 'Guardia Pasiva Lunes-Viernes',
        descripcion: 'Guardia pasiva en día hábil (8 horas)',
        parametros: {
          fecha: fechaHoy,
          hora_inicio: '16:00',
          hora_fin: '00:00',
          tipo_guardia: 'pasiva'
        },
        resultado_estimado: {
          guardia_pasiva: tarifa.valor_guardia_pasiva,
          total: tarifa.valor_guardia_pasiva
        }
      },
      {
        nombre: 'Incidente Nocturno Día Hábil',
        descripcion: 'Incidente de 2h con componente nocturno en día hábil',
        parametros: {
          fecha: fechaHoy,
          hora_inicio: '22:00',
          hora_fin: '00:00',
          tipo_guardia: 'activa'
        },
        resultado_estimado: {
          guardia_activa: tarifa.valor_hora_activa * 2,
          adicional_nocturno: tarifa.valor_adicional_nocturno_habil * 2,
          total: (tarifa.valor_hora_activa * 2) + (tarifa.valor_adicional_nocturno_habil * 2)
        }
      },
      {
        nombre: 'Guardia Completa Domingo',
        descripcion: 'Guardia pasiva + incidente en domingo',
        parametros: {
          fecha: fechaHoy,
          hora_inicio: '07:00',
          hora_fin: '00:00',
          tipo_guardia: 'ambas'
        },
        resultado_estimado: {
          guardia_pasiva: tarifa.valor_guardia_pasiva * 2.125, // Factor domingo
          guardia_activa: tarifa.valor_hora_activa * 17 * 1.5, // 17h × factor no laboral
          adicional_nocturno: tarifa.valor_adicional_nocturno_no_habil * 8, // Aprox 8h nocturnas
          total: (tarifa.valor_guardia_pasiva * 2.125) + 
                 (tarifa.valor_hora_activa * 17 * 1.5) + 
                 (tarifa.valor_adicional_nocturno_no_habil * 8)
        }
      }
    ];
    
    console.log('✅ Ejemplos generados exitosamente');
    
    res.status(200).json({
      success: true,
      data: {
        tarifa_base: {
          id: tarifa.id,
          nombre: tarifa.nombre,
          vigencia_desde: tarifa.vigencia_desde
        },
        ejemplos
      }
    });
  } catch (error) {
    console.error('❌ Error al generar ejemplos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar ejemplos',
      error: error.message
    });
  }
};

// Obtener estadísticas de tarifas
exports.getEstadisticasTarifas = async (req, res) => {
  try {
    console.log('📊 TARIFAS CONTROLLER: Obteniendo estadísticas');
    
    const estadisticas = await Tarifa.getEstadisticas();
    
    console.log('✅ Estadísticas obtenidas');
    
    res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de tarifas',
      error: error.message
    });
  }
};

module.exports = exports;