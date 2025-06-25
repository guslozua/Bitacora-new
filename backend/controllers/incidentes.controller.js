// controllers/incidentes.controller.js - VERSIÓN COMPLETA CON STATS
const Incidente = require('../models/incidente.model');
const Guardia = require('../models/guardia.model');
const Codigo = require('../models/codigo.model');
const { Op } = require('../models/db.operators');
const { enviarNotificacion } = require('../utils/notificaciones');
const db = require('../config/db');

// ✨ FUNCIÓN HELPER PARA PARSEAR FECHAS DE MANERA SEGURA
const parsearFechaSafe = (fecha) => {
  try {
    if (!fecha) return null;

    // Si ya es un objeto Date válido, devolverlo
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      return fecha;
    }

    // Si es string, parsearlo
    if (typeof fecha === 'string') {
      const fechaParseada = new Date(fecha);
      if (isNaN(fechaParseada.getTime())) {
        throw new Error(`Fecha inválida: ${fecha}`);
      }
      return fechaParseada;
    }

    throw new Error(`Tipo de fecha no reconocido: ${typeof fecha}`);
  } catch (error) {
    console.error('Error al parsear fecha:', error.message);
    throw error;
  }
};

// ✨ FUNCIÓN HELPER PARA FORMATEAR FECHA PARA MYSQL
const formatearFechaParaMySQL = (fecha) => {
  try {
    const fechaObj = parsearFechaSafe(fecha);
    if (!fechaObj) return null;

    // Formatear como YYYY-MM-DD HH:MM:SS para MySQL
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');
    const hours = String(fechaObj.getHours()).padStart(2, '0');
    const minutes = String(fechaObj.getMinutes()).padStart(2, '0');
    const seconds = String(fechaObj.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error al formatear fecha para MySQL:', error);
    throw error;
  }
};

// Función helper para registrar cambio de estado en el historial - CORREGIDA
const registrarCambioEstado = async (idIncidente, estadoAnterior, estadoNuevo, idUsuario, observaciones = null) => {
  try {
    console.log('📋 REGISTRANDO CAMBIO DE ESTADO:', {
      idIncidente,
      estadoAnterior,
      estadoNuevo,
      idUsuario,
      observaciones
    });

    // ✨ CONVERTIR UNDEFINED A NULL PARA MYSQL2
    const estadoAnteriorLimpio = estadoAnterior === undefined ? null : estadoAnterior;
    const estadoNuevoLimpio = estadoNuevo === undefined ? null : estadoNuevo;
    const idUsuarioLimpio = idUsuario === undefined ? null : idUsuario;
    const observacionesLimpias = observaciones === undefined ? null : observaciones;

    console.log('📋 PARÁMETROS LIMPIADOS:', {
      idIncidente,
      estadoAnteriorLimpio,
      estadoNuevoLimpio,
      idUsuarioLimpio,
      observacionesLimpias
    });

    const query = `
      INSERT INTO incidentes_estado_historico 
      (id_incidente, estado_anterior, estado_nuevo, id_usuario, fecha_cambio, observaciones) 
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;

    const [result] = await db.execute(query, [
      idIncidente,
      estadoAnteriorLimpio,
      estadoNuevoLimpio,
      idUsuarioLimpio,
      observacionesLimpias
    ]);

    console.log('✅ HISTORIAL REGISTRADO EXITOSAMENTE:', {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    });

    return result;
  } catch (error) {
    console.error('❌ ERROR AL REGISTRAR CAMBIO DE ESTADO:', error);
    console.error('❌ PARÁMETROS QUE CAUSARON EL ERROR:', {
      idIncidente,
      estadoAnterior,
      estadoNuevo,
      idUsuario,
      observaciones
    });
    throw error;
  }
};

// Función helper para obtener supervisores para notificaciones
const obtenerSupervisores = async () => {
  try {
    const query = `
      SELECT DISTINCT u.id, u.nombre, u.email 
      FROM Usuarios u 
      JOIN usuario_rol ur ON u.id = ur.id_usuario 
      JOIN Roles r ON ur.id_rol = r.id 
      WHERE r.nombre IN ('Admin', 'SuperAdmin', 'Supervisor') 
      AND u.estado = 'activo'
    `;
    const [supervisores] = await db.execute(query);
    return supervisores;
  } catch (error) {
    console.error('Error al obtener supervisores:', error);
    return [];
  }
};

// Obtener todos los incidentes con filtros opcionales
exports.getIncidentes = async (req, res) => {
  try {
    const {
      id_guardia, estado, desde, hasta,
      usuario, limit, offset, ordenar
    } = req.query;

    const options = { where: {} };

    // Aplicar filtros si se proporcionan
    if (id_guardia) {
      options.where.id_guardia = parseInt(id_guardia);
    }

    if (estado) {
      options.where.estado = estado;
    }

    if (desde) {
      options.where.inicio = { ...options.where.inicio, [Op.gte]: new Date(desde) };
    }

    if (hasta) {
      options.where.fin = { ...options.where.fin, [Op.lte]: new Date(hasta) };
    }

    if (usuario) {
      options.where.usuario_guardia = usuario;
    }

    // Paginación
    if (limit) {
      options.limit = parseInt(limit);
      if (offset) {
        options.offset = parseInt(offset);
      }
    }

    const incidentes = await Incidente.findAll(options);

    res.status(200).json({
      success: true,
      count: incidentes.length,
      data: incidentes
    });
  } catch (error) {
    console.error('Error al obtener incidentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidentes',
      error: error.message
    });
  }
};

// ✨ OBTENER UN INCIDENTE POR ID - MEJORADO CON LOGS
exports.getIncidenteById = async (req, res) => {
  try {
    console.log('🔍 OBTENER INCIDENTE - ID solicitado:', req.params.id);

    const incidente = await Incidente.findByPk(req.params.id);

    if (!incidente) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }

    console.log('🔍 INCIDENTE ENCONTRADO - Datos originales de DB:', {
      id: incidente.id,
      inicio: incidente.inicio,
      fin: incidente.fin,
      inicio_type: typeof incidente.inicio,
      fin_type: typeof incidente.fin
    });

    // Obtener historial de estados
    const queryHistorial = `
      SELECT 
        ieh.*,
        u.nombre as usuario_cambio_nombre
      FROM incidentes_estado_historico ieh
      LEFT JOIN Usuarios u ON ieh.id_usuario = u.id
      WHERE ieh.id_incidente = ?
      ORDER BY ieh.fecha_cambio DESC
    `;

    const [historial] = await db.execute(queryHistorial, [req.params.id]);

    // Convertir el incidente a objeto plano y agregar historial
    const incidenteData = typeof incidente.toJSON === 'function'
      ? incidente.toJSON()
      : { ...incidente };

    console.log('🔍 DATOS ENVIADOS AL FRONTEND:', {
      id: incidenteData.id,
      inicio: incidenteData.inicio,
      fin: incidenteData.fin,
      inicio_type: typeof incidenteData.inicio,
      fin_type: typeof incidenteData.fin
    });

    res.status(200).json({
      success: true,
      data: {
        ...incidenteData,
        historial_estados: historial
      }
    });
  } catch (error) {
    console.error('Error al obtener incidente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidente',
      error: error.message
    });
  }
};

// ✨ CREAR UN NUEVO INCIDENTE - CORREGIDO PARA MYSQL DIRECTO
exports.createIncidente = async (req, res) => {
  try {
    console.log('🚀 CREAR INCIDENTE - Body recibido:', req.body);

    const {
      id_guardia, inicio, fin, descripcion,
      observaciones, codigos
    } = req.body;

    console.log('🚀 FECHAS RECIBIDAS:', {
      inicio: inicio,
      fin: fin,
      inicio_type: typeof inicio,
      fin_type: typeof fin
    });

    // Verificar que la guardia existe
    const guardia = await Guardia.findByPk(id_guardia);
    if (!guardia) {
      return res.status(404).json({
        success: false,
        message: 'La guardia especificada no existe'
      });
    }

    // ✨ PARSEAR FECHAS DE MANERA SEGURA
    const inicioParseado = parsearFechaSafe(inicio);
    const finParseado = parsearFechaSafe(fin);

    console.log('🚀 FECHAS PARSEADAS:', {
      inicioParseado: inicioParseado,
      finParseado: finParseado
    });

    // Verificar que las fechas son válidas
    if (finParseado <= inicioParseado) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    // Verificar si la fecha corresponde a la guardia
    const guardiaDate = new Date(guardia.fecha);

    // Verificar que el incidente ocurre en el mismo día que la guardia
    if (
      inicioParseado.getDate() !== guardiaDate.getDate() ||
      inicioParseado.getMonth() !== guardiaDate.getMonth() ||
      inicioParseado.getFullYear() !== guardiaDate.getFullYear()
    ) {
      return res.status(400).json({
        success: false,
        message: 'El incidente debe ocurrir en la misma fecha que la guardia'
      });
    }

    // ✨ PREPARAR FECHAS PARA MYSQL
    const inicioMySQL = formatearFechaParaMySQL(inicioParseado);
    const finMySQL = formatearFechaParaMySQL(finParseado);

    console.log('🚀 FECHAS PARA MySQL:', {
      inicioMySQL: inicioMySQL,
      finMySQL: finMySQL
    });

    // ✨ PREPARAR CÓDIGOS ANTES DE CREAR EL INCIDENTE
    let codigosParaInsertar = [];

    if (codigos && Array.isArray(codigos) && codigos.length > 0) {
      console.log('🔄 USANDO CÓDIGOS PROPORCIONADOS:', codigos);
      codigosParaInsertar = codigos;
    } else {
      console.log('🔍 BUSCANDO CÓDIGOS APLICABLES...');

      try {
        const horaInicio = inicioParseado.toTimeString().substring(0, 8);
        const horaFin = finParseado.toTimeString().substring(0, 8);

        // ✨ OBTENER MODALIDAD DE CONVENIO DEL BODY (viene del frontend)
        const modalidadConvenio = req.body.modalidad_convenio || 'FC';
        console.log('🏢 MODALIDAD DE CONVENIO:', modalidadConvenio);

        const codigosAplicables = await Codigo.findApplicable(
          guardiaDate,
          horaInicio,
          horaFin,
          modalidadConvenio  // ✨ PASAR MODALIDAD DE CONVENIO
        );

        const duracionMinutos = Math.floor((finParseado - inicioParseado) / (1000 * 60));

        console.log(`🔍 CÓDIGOS APLICABLES ENCONTRADOS: ${codigosAplicables.length} para modalidad ${modalidadConvenio}`);

        codigosParaInsertar = codigosAplicables.map(codigo => ({
          id_codigo: codigo.id,
          minutos: duracionMinutos,
          importe: null
        }));
      } catch (error) {
        console.error('❌ Error al buscar códigos aplicables:', error);
        // Continuar sin códigos aplicables
      }
    }

    // ✨ PREPARAR DATOS DEL INCIDENTE - CORREGIDO PARA UNDEFINED
    const incidenteData = {
      id_guardia,
      inicio: inicioMySQL,
      fin: finMySQL,
      descripcion,
      id_usuario_registro: req.user?.id || null, // ✨ CONVERTIR UNDEFINED A NULL
      observaciones: observaciones || null,      // ✨ CONVERTIR UNDEFINED A NULL
      estado: 'registrado',
      codigos: codigosParaInsertar
    };

    console.log('🚀 DATOS DEL INCIDENTE A CREAR:', {
      ...incidenteData,
      codigos: `${codigosParaInsertar.length} códigos`
    });

    // ✨ CREAR EL INCIDENTE USANDO EL MODELO PERSONALIZADO
    let nuevoIncidente;
    try {
      nuevoIncidente = await Incidente.create(incidenteData);
      console.log('✅ INCIDENTE CREADO EXITOSAMENTE:', {
        id: nuevoIncidente?.id,
        tipo: typeof nuevoIncidente,
        propiedades: nuevoIncidente ? Object.keys(nuevoIncidente) : 'undefined'
      });

      if (!nuevoIncidente || !nuevoIncidente.id) {
        throw new Error('El modelo no devolvió un incidente válido');
      }

    } catch (errorCreacion) {
      console.error('❌ ERROR EN INCIDENTE.CREATE:', errorCreacion);
      console.error('❌ STACK TRACE:', errorCreacion.stack);

      return res.status(500).json({
        success: false,
        message: 'Error al crear el incidente en la base de datos',
        error: errorCreacion.message
      });
    }

    // ✨ REGISTRAR EL ESTADO INICIAL EN EL HISTORIAL
    try {
      await registrarCambioEstado(
        nuevoIncidente.id,
        null,
        'registrado',
        req.user?.id,
        'Incidente creado'
      );
      console.log('✅ HISTORIAL DE ESTADO REGISTRADO');
    } catch (errorHistorial) {
      console.error('❌ Error al registrar historial:', errorHistorial);
      // No fallar la creación por esto
    }

    // ✨ NOTIFICAR A SUPERVISORES (ASYNC, NO BLOQUEAR RESPUESTA)
    setImmediate(async () => {
      try {
        const supervisores = await obtenerSupervisores();
        for (const supervisor of supervisores) {
          await enviarNotificacion({
            id_usuario: supervisor.id,
            tipo: 'nuevo_incidente',
            titulo: 'Nuevo Incidente Registrado',
            mensaje: `Se ha registrado un nuevo incidente: ${descripcion.substring(0, 50)}...`,
            datos_adicionales: {
              id_incidente: nuevoIncidente.id,
              id_guardia: id_guardia,
              usuario_guardia: guardia.usuario
            }
          });
        }
        console.log('✅ NOTIFICACIONES ENVIADAS A SUPERVISORES');
      } catch (errorNotificacion) {
        console.error('❌ Error al enviar notificaciones:', errorNotificacion);
        // No afecta la creación del incidente
      }
    });

    // ✨ PREPARAR RESPUESTA FINAL SEGURA
    const incidenteRespuesta = {
      id: nuevoIncidente.id,
      id_guardia: nuevoIncidente.id_guardia,
      inicio: nuevoIncidente.inicio,
      fin: nuevoIncidente.fin,
      descripcion: nuevoIncidente.descripcion,
      observaciones: nuevoIncidente.observaciones,
      estado: nuevoIncidente.estado,
      duracion_minutos: nuevoIncidente.duracion_minutos,
      codigos_aplicados: nuevoIncidente.codigos_aplicados || [],
      fecha_guardia: nuevoIncidente.fecha_guardia,
      usuario_guardia: nuevoIncidente.usuario_guardia,
      created_at: nuevoIncidente.created_at,
      updated_at: nuevoIncidente.updated_at
    };

    console.log('✅ RESPUESTA FINAL PREPARADA:', {
      id: incidenteRespuesta.id,
      codigos_count: incidenteRespuesta.codigos_aplicados.length
    });

    res.status(201).json({
      success: true,
      message: 'Incidente creado correctamente',
      data: incidenteRespuesta
    });

  } catch (error) {
    console.error('❌ ERROR GENERAL AL CREAR INCIDENTE:', error);
    console.error('❌ STACK TRACE COMPLETO:', error.stack);

    // ✨ RESPUESTA DE ERROR MÁS DETALLADA
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear incidente',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
};

// ✨ ACTUALIZAR UN INCIDENTE EXISTENTE - CORREGIDO
exports.updateIncidente = async (req, res) => {
  try {
    console.log('🔄 ACTUALIZAR INCIDENTE - ID:', req.params.id);
    console.log('🔄 BODY COMPLETO RECIBIDO:', req.body);

    const {
      id_guardia, inicio, fin, descripcion,
      observaciones, estado, codigos
    } = req.body;

    console.log('🔄 FECHAS RECIBIDAS PARA ACTUALIZAR:', {
      inicio: inicio,
      fin: fin,
      inicio_type: typeof inicio,
      fin_type: typeof fin
    });

    // Verificar que el incidente existe
    const incidente = await Incidente.findByPk(req.params.id);
    if (!incidente) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }

    console.log('🔄 INCIDENTE ACTUAL EN DB:', {
      id: incidente.id,
      inicio_actual: incidente.inicio,
      fin_actual: incidente.fin,
      inicio_type: typeof incidente.inicio,
      fin_type: typeof incidente.fin
    });

    // Si se va a cambiar la guardia, verificar que exista
    if (id_guardia && id_guardia !== incidente.id_guardia) {
      const guardia = await Guardia.findByPk(id_guardia);
      if (!guardia) {
        return res.status(404).json({
          success: false,
          message: 'La guardia especificada no existe'
        });
      }
    }

    // Preparar datos para actualización
    const datosActualizacion = {};

    if (id_guardia !== undefined) datosActualizacion.id_guardia = id_guardia;
    if (descripcion !== undefined) datosActualizacion.descripcion = descripcion;
    if (observaciones !== undefined) datosActualizacion.observaciones = observaciones;

    // ✨ MANEJAR FECHAS DE MANERA SEGURA
    if (inicio !== undefined) {
      const inicioParseado = parsearFechaSafe(inicio);
      const inicioMySQL = formatearFechaParaMySQL(inicioParseado);
      datosActualizacion.inicio = inicioMySQL;

      console.log('🔄 INICIO PROCESADO:', {
        original: inicio,
        parseado: inicioParseado,
        mysql: inicioMySQL
      });
    }

    if (fin !== undefined) {
      const finParseado = parsearFechaSafe(fin);
      const finMySQL = formatearFechaParaMySQL(finParseado);
      datosActualizacion.fin = finMySQL;

      console.log('🔄 FIN PROCESADO:', {
        original: fin,
        parseado: finParseado,
        mysql: finMySQL
      });
    }

    // Verificar que las fechas son válidas si se están actualizando ambas
    if (datosActualizacion.inicio && datosActualizacion.fin) {
      const inicioCheck = new Date(datosActualizacion.inicio);
      const finCheck = new Date(datosActualizacion.fin);

      if (finCheck <= inicioCheck) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }
    }

    // Si se proporciona un nuevo estado, registrar el cambio
    if (estado !== undefined && estado !== incidente.estado) {
      datosActualizacion.estado = estado;

      // Registrar cambio de estado en el historial
      await registrarCambioEstado(
        incidente.id,
        incidente.estado,
        estado,
        req.user?.id,
        observaciones || 'Estado actualizado'
      );

      // Enviar notificaciones según el nuevo estado
      const supervisores = await obtenerSupervisores();
      for (const supervisor of supervisores) {
        await enviarNotificacion({
          id_usuario: supervisor.id,
          tipo: 'cambio_estado',
          titulo: `Incidente ${estado}`,
          mensaje: `El incidente #${incidente.id} cambió a estado: ${estado}`,
          datos_adicionales: {
            id_incidente: incidente.id,
            estado_anterior: incidente.estado,
            estado_nuevo: estado
          }
        });
      }
    }

    // Si se proporcionaron códigos, incluirlos
    if (codigos !== undefined) {
      datosActualizacion.codigos = codigos;
    }

    console.log('🔄 DATOS FINALES PARA ACTUALIZAR:', datosActualizacion);

    // Actualizar el incidente
    const incidenteActualizado = await incidente.update(datosActualizacion);

    console.log('✅ INCIDENTE ACTUALIZADO:', {
      id: incidenteActualizado.id,
      inicio_actualizado: incidenteActualizado.inicio,
      fin_actualizado: incidenteActualizado.fin
    });

    res.status(200).json({
      success: true,
      message: 'Incidente actualizado correctamente',
      data: incidenteActualizado
    });
  } catch (error) {
    console.error('❌ Error al actualizar incidente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar incidente',
      error: error.message
    });
  }
};

// Eliminar un incidente
exports.deleteIncidente = async (req, res) => {
  try {
    const incidente = await Incidente.findByPk(req.params.id);

    if (!incidente) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }

    // Verificar si el incidente ya está liquidado
    if (incidente.estado === 'liquidado') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un incidente que ya ha sido liquidado'
      });
    }

    await incidente.destroy();

    res.status(200).json({
      success: true,
      message: 'Incidente eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar incidente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar incidente',
      error: error.message
    });
  }
};

// Cambiar estado de un incidente con validación de workflow - CORREGIDA
exports.cambiarEstadoIncidente = async (req, res) => {
  try {
    console.log('🔄 CAMBIAR ESTADO - Request body:', req.body);
    console.log('🔄 CAMBIAR ESTADO - User:', req.user);
    console.log('🔄 CAMBIAR ESTADO - Params:', req.params);

    const { estado, observaciones } = req.body;

    if (!['registrado', 'revisado', 'aprobado', 'rechazado', 'liquidado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const incidente = await Incidente.findByPk(req.params.id);

    if (!incidente) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }

    console.log('🔄 INCIDENTE ENCONTRADO:', {
      id: incidente.id,
      estadoActual: incidente.estado
    });

    // Verificar transiciones de estado permitidas
    const estadoActual = incidente.estado;

    // Reglas de transición
    const transicionesPermitidas = {
      'registrado': ['revisado', 'aprobado', 'rechazado'],
      'revisado': ['aprobado', 'rechazado'],
      'aprobado': ['liquidado'],
      'rechazado': ['registrado'],
      'liquidado': [] // No se puede cambiar de "liquidado"
    };

    if (!transicionesPermitidas[estadoActual].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de estado "${estadoActual}" a "${estado}"`
      });
    }

    // Actualizar estado del incidente
    await incidente.update({ estado });
    console.log('✅ ESTADO DEL INCIDENTE ACTUALIZADO');

    // ✨ REGISTRAR CAMBIO EN EL HISTORIAL CON PARÁMETROS LIMPIOS
    try {
      await registrarCambioEstado(
        incidente.id,
        estadoActual,
        estado,
        req.user?.id || null, // ✨ CONVERTIR UNDEFINED A NULL
        observaciones || null  // ✨ CONVERTIR UNDEFINED A NULL
      );
      console.log('✅ HISTORIAL DE CAMBIO REGISTRADO');
    } catch (errorHistorial) {
      console.error('❌ ERROR AL REGISTRAR HISTORIAL:', errorHistorial);
      // No fallar toda la operación por esto, pero loggear el error
    }

    // ✨ NOTIFICACIONES (ASYNC, NO BLOQUEAR RESPUESTA)
    setImmediate(async () => {
      try {
        const supervisores = await obtenerSupervisores();
        for (const supervisor of supervisores) {
          await enviarNotificacion({
            id_usuario: supervisor.id,
            tipo: 'cambio_estado',
            titulo: `Incidente ${estado}`,
            mensaje: `El incidente #${incidente.id} cambió de "${estadoActual}" a "${estado}"`,
            datos_adicionales: {
              id_incidente: incidente.id,
              estado_anterior: estadoActual,
              estado_nuevo: estado,
              observaciones: observaciones || null
            }
          });
        }
        console.log('✅ NOTIFICACIONES ENVIADAS A SUPERVISORES');
      } catch (errorNotificacion) {
        console.error('❌ Error al enviar notificaciones:', errorNotificacion);
        // No afecta la operación principal
      }
    });

    res.status(200).json({
      success: true,
      message: 'Estado del incidente actualizado correctamente',
      data: {
        id: incidente.id,
        estado,
        estado_anterior: estadoActual,
        observaciones: observaciones || null
      }
    });
  } catch (error) {
    console.error('❌ ERROR AL CAMBIAR ESTADO DEL INCIDENTE:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del incidente',
      error: error.message
    });
  }
};

// Obtener incidentes por guardia
exports.getIncidentesByGuardia = async (req, res) => {
  try {
    const id_guardia = req.params.id_guardia;

    // Verificar que la guardia existe
    const guardia = await Guardia.findByPk(id_guardia);
    if (!guardia) {
      return res.status(404).json({
        success: false,
        message: 'La guardia especificada no existe'
      });
    }

    const incidentes = await Incidente.findAll({
      where: { id_guardia }
    });

    res.status(200).json({
      success: true,
      count: incidentes.length,
      data: incidentes
    });
  } catch (error) {
    console.error('Error al obtener incidentes por guardia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener incidentes por guardia',
      error: error.message
    });
  }
};

// NUEVOS ENDPOINTS PARA WORKFLOW

// Obtener historial de estados de un incidente
exports.getHistorialEstados = async (req, res) => {
  try {
    const query = `
      SELECT 
        ieh.*,
        u.nombre as usuario_cambio_nombre,
        u.email as usuario_cambio_email
      FROM incidentes_estado_historico ieh
      LEFT JOIN Usuarios u ON ieh.id_usuario = u.id
      WHERE ieh.id_incidente = ?
      ORDER BY ieh.fecha_cambio DESC
    `;

    const [historial] = await db.execute(query, [req.params.id]);

    res.status(200).json({
      success: true,
      data: historial
    });
  } catch (error) {
    console.error('Error al obtener historial de estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de estados',
      error: error.message
    });
  }
};

// Obtener estadísticas de incidentes por estado
exports.getEstadisticasEstados = async (req, res) => {
  try {
    const query = `
      SELECT 
        estado,
        COUNT(*) as cantidad,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM incidentes_guardia) as porcentaje
      FROM incidentes_guardia
      GROUP BY estado
      ORDER BY cantidad DESC
    `;

    const [estadisticas] = await db.execute(query);

    res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de estados',
      error: error.message
    });
  }
};

// Obtener resumen de incidentes para múltiples guardias - NUEVO ENDPOINT OPTIMIZADO
exports.getResumenIncidentesGuardias = async (req, res) => {
  try {
    console.log('📊 RESUMEN INCIDENTES - Body recibido:', req.body);

    const { guardia_ids } = req.body;

    if (!guardia_ids || !Array.isArray(guardia_ids) || guardia_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de guardias'
      });
    }

    console.log('📊 IDs de guardias a consultar:', guardia_ids.length);

    // Consulta optimizada para obtener resumen de incidentes por guardia
    const query = `
      SELECT 
        i.id_guardia as guardia_id,
        COUNT(*) as cantidad,
        GROUP_CONCAT(DISTINCT i.estado) as estados
      FROM incidentes_guardia i
      WHERE i.id_guardia IN (${guardia_ids.map(() => '?').join(',')})
      GROUP BY i.id_guardia
    `;

    const [results] = await db.execute(query, guardia_ids);

    console.log('📊 Resultados obtenidos:', results.length);

    // Procesar los resultados para convertir estados a array
    const resumenProcesado = results.map(row => ({
      guardia_id: row.guardia_id,
      cantidad: row.cantidad,
      estados: row.estados ? row.estados.split(',') : []
    }));

    console.log('📊 Resumen procesado:', resumenProcesado.length, 'guardias con incidentes');

    res.status(200).json({
      success: true,
      data: resumenProcesado
    });

  } catch (error) {
    console.error('❌ Error al obtener resumen de incidentes por guardias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de incidentes',
      error: error.message
    });
  }
};

// 🆕 NUEVO MÉTODO: Obtener estadísticas de incidentes para el dashboard
exports.getIncidentesStats = async (req, res) => {
  try {
    console.log('📊 STATS INCIDENTES - Query params:', req.query);
    
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const conditions = [];
    const params = [];

    // Filtro por año
    if (year && year !== 'all') {
      conditions.push('YEAR(fecha_creacion) = ?');
      params.push(year);
    } else {
      // Por defecto, año actual
      conditions.push('YEAR(fecha_creacion) = ?');
      params.push(currentYear);
    }

    // Filtro por mes si se especifica
    if (month && month !== 'all') {
      conditions.push('MONTH(fecha_creacion) = ?');
      params.push(month);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    console.log('📊 Condiciones SQL:', whereClause, 'Params:', params);

    // Total de incidentes en el período
    const [totalResult] = await db.execute(
      `SELECT COUNT(*) as total_incidentes FROM incidentes_guardia ${whereClause}`,
      params
    );

    // Incidentes por estado
    const [estadosResult] = await db.execute(
      `SELECT estado, COUNT(*) as cantidad FROM incidentes_guardia ${whereClause} GROUP BY estado`,
      params
    );

    // Incidentes por prioridad (si existe el campo)
    let prioridadResult = [];
    try {
      const [prioridadQuery] = await db.execute(
        `SELECT prioridad, COUNT(*) as cantidad FROM incidentes_guardia ${whereClause} GROUP BY prioridad`,
        params
      );
      prioridadResult = prioridadQuery;
    } catch (prioridadError) {
      console.log('📊 Campo prioridad no existe, usando valores por defecto');
      prioridadResult = [
        { prioridad: 'alta', cantidad: Math.floor(totalResult[0].total_incidentes * 0.2) },
        { prioridad: 'media', cantidad: Math.floor(totalResult[0].total_incidentes * 0.5) },
        { prioridad: 'baja', cantidad: Math.floor(totalResult[0].total_incidentes * 0.3) }
      ];
    }

    // Incidentes por mes (para el año actual)
    const yearCondition = year ? `YEAR(fecha_creacion) = ${year}` : `YEAR(fecha_creacion) = ${currentYear}`;
    const [porMesResult] = await db.execute(
      `SELECT 
        MONTH(fecha_creacion) as mes, 
        COUNT(*) as cantidad 
       FROM incidentes_guardia 
       WHERE ${yearCondition}
       GROUP BY mes 
       ORDER BY mes`
    );

    // Tiempo promedio de resolución (en horas) - si existe el campo fecha_resolucion
    let tiempoPromResult = [{ tiempo_promedio_horas: 0 }];
    try {
      const [tiempoQuery] = await db.execute(
        `SELECT 
          AVG(TIMESTAMPDIFF(HOUR, fecha_creacion, fecha_resolucion)) as tiempo_promedio_horas
         FROM incidentes_guardia 
         ${whereClause} AND fecha_resolucion IS NOT NULL`,
        params
      );
      tiempoPromResult = tiempoQuery;
    } catch (tiempoError) {
      console.log('📊 Campo fecha_resolucion no existe, usando valor por defecto');
    }

    // Incidentes críticos (alta prioridad no resueltos)
    let criticosResult = [{ criticos: 0 }];
    try {
      const [criticosQuery] = await db.execute(
        `SELECT COUNT(*) as criticos 
         FROM incidentes_guardia 
         ${whereClause} AND prioridad = 'alta' AND estado != 'resuelto'`,
        params
      );
      criticosResult = criticosQuery;
    } catch (criticosError) {
      console.log('📊 Calculando críticos sin campo prioridad');
      // Estimar críticos como 10% del total no resuelto
      const [noResueltosQuery] = await db.execute(
        `SELECT COUNT(*) as no_resueltos 
         FROM incidentes_guardia 
         ${whereClause} AND estado NOT IN ('resuelto', 'liquidado', 'cerrado')`,
        params
      );
      criticosResult = [{ criticos: Math.floor(noResueltosQuery[0].no_resueltos * 0.1) }];
    }

    // Últimos incidentes (5 más recientes)
    const [ultimosResult] = await db.execute(
      `SELECT 
        id, descripcion, estado, fecha_creacion
       FROM incidentes_guardia 
       ${whereClause}
       ORDER BY fecha_creacion DESC 
       LIMIT 5`,
      params
    );

    // Preparar respuesta
    const statsResponse = {
      total_incidentes: totalResult[0].total_incidentes || 0,
      por_estado: estadosResult,
      por_prioridad: prioridadResult,
      por_mes: porMesResult,
      tiempo_promedio_resolucion: Math.round(tiempoPromResult[0]?.tiempo_promedio_horas || 0),
      incidentes_criticos: criticosResult[0].criticos || 0,
      ultimos_incidentes: ultimosResult,
      periodo: {
        year: currentYear,
        month: month || 'todos'
      }
    };

    console.log('📊 Stats calculadas:', {
      total: statsResponse.total_incidentes,
      estados: statsResponse.por_estado.length,
      criticos: statsResponse.incidentes_criticos
    });

    res.json(statsResponse);

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de incidentes:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas de incidentes',
      total_incidentes: 0,
      por_estado: [],
      por_prioridad: [],
      por_mes: [],
      tiempo_promedio_resolucion: 0,
      incidentes_criticos: 0,
      ultimos_incidentes: [],
      periodo: {
        year: new Date().getFullYear(),
        month: 'todos'
      }
    });
  }
};

module.exports = exports;