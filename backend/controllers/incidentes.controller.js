// controllers/incidentes.controller.js
const Incidente = require('../models/incidente.model');
const Guardia = require('../models/guardia.model');
const Codigo = require('../models/codigo.model');
const { Op } = require('../models/db.operators');

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

// Obtener un incidente por ID
exports.getIncidenteById = async (req, res) => {
  try {
    const incidente = await Incidente.findByPk(req.params.id);
    
    if (!incidente) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: incidente
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

// Crear un nuevo incidente
exports.createIncidente = async (req, res) => {
  try {
    const { 
      id_guardia, inicio, fin, descripcion, 
      observaciones, codigos_ids 
    } = req.body;
    
    // Verificar que la guardia existe
    const guardia = await Guardia.findByPk(id_guardia);
    if (!guardia) {
      return res.status(404).json({
        success: false,
        message: 'La guardia especificada no existe'
      });
    }
    
    // Verificar que las fechas son válidas
    if (new Date(fin) <= new Date(inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }
    
    // Verificar si la fecha corresponde a la guardia
    const guardiaDate = new Date(guardia.fecha);
    const incidenteDate = new Date(inicio);
    
    // Verificar que el incidente ocurre en el mismo día que la guardia
    if (
      incidenteDate.getDate() !== guardiaDate.getDate() || 
      incidenteDate.getMonth() !== guardiaDate.getMonth() || 
      incidenteDate.getFullYear() !== guardiaDate.getFullYear()
    ) {
      return res.status(400).json({
        success: false,
        message: 'El incidente debe ocurrir en la misma fecha que la guardia'
      });
    }
    
    // Preparar el objeto de incidente
    const incidenteData = {
      id_guardia,
      inicio,
      fin,
      descripcion,
      id_usuario_registro: req.user?.id,
      observaciones,
      estado: 'registrado'
    };
    
    // Si se proporcionaron códigos, obtenerlos
    let codigos = [];
    if (codigos_ids && Array.isArray(codigos_ids) && codigos_ids.length > 0) {
      // Buscar cada código por ID
      const codigosPromises = codigos_ids.map(id => Codigo.findByPk(id));
      const codigosEncontrados = await Promise.all(codigosPromises);
      
      // Filtrar los códigos que no existen
      codigos = codigosEncontrados
        .filter(codigo => codigo !== null)
        .map(codigo => {
          // Calcular minutos aplicables (inicialmente, todos los minutos del incidente)
          const duracionMinutos = 
            Math.floor((new Date(fin) - new Date(inicio)) / (1000 * 60));
          
          return {
            id_codigo: codigo.id,
            minutos: duracionMinutos,
            importe: null // Se calculará después si es necesario
          };
        });
    } else {
      // Si no se proporcionaron códigos, buscar códigos aplicables automáticamente
      const horaInicio = new Date(inicio).toTimeString().substring(0, 8); // HH:MM:SS
      const horaFin = new Date(fin).toTimeString().substring(0, 8); // HH:MM:SS
      
      const codigosAplicables = await Codigo.findApplicable(
        guardiaDate,
        horaInicio,
        horaFin
      );
      
      // Calcular duración total del incidente en minutos
      const duracionMinutos = 
        Math.floor((new Date(fin) - new Date(inicio)) / (1000 * 60));
      
      // Convertir los códigos aplicables al formato necesario
      codigos = codigosAplicables.map(codigo => ({
        id_codigo: codigo.id,
        minutos: duracionMinutos,
        importe: null // Se calculará después si es necesario
      }));
    }
    
    incidenteData.codigos = codigos;
    
    // Crear el incidente
    const nuevoIncidente = await Incidente.create(incidenteData);
    
    res.status(201).json({
      success: true,
      message: 'Incidente creado correctamente',
      data: nuevoIncidente
    });
  } catch (error) {
    console.error('Error al crear incidente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear incidente',
      error: error.message
    });
  }
};

// Actualizar un incidente existente
exports.updateIncidente = async (req, res) => {
  try {
    const { 
      id_guardia, inicio, fin, descripcion, 
      observaciones, estado, codigos 
    } = req.body;
    
    // Verificar que el incidente existe
    const incidente = await Incidente.findByPk(req.params.id);
    if (!incidente) {
      return res.status(404).json({
        success: false,
        message: 'Incidente no encontrado'
      });
    }
    
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
    
    // Verificar que las fechas son válidas si se están actualizando
    if (inicio && fin && new Date(fin) <= new Date(inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }
    
    // Preparar datos para actualización
    const datosActualizacion = {};
    
    if (id_guardia !== undefined) datosActualizacion.id_guardia = id_guardia;
    if (inicio !== undefined) datosActualizacion.inicio = inicio;
    if (fin !== undefined) datosActualizacion.fin = fin;
    if (descripcion !== undefined) datosActualizacion.descripcion = descripcion;
    if (observaciones !== undefined) datosActualizacion.observaciones = observaciones;
    if (estado !== undefined) datosActualizacion.estado = estado;
    
    // Si se proporcionaron códigos, incluirlos
    if (codigos !== undefined) {
      datosActualizacion.codigos = codigos;
    }
    
    // Actualizar el incidente
    const incidenteActualizado = await incidente.update(datosActualizacion);
    
    res.status(200).json({
      success: true,
      message: 'Incidente actualizado correctamente',
      data: incidenteActualizado
    });
  } catch (error) {
    console.error('Error al actualizar incidente:', error);
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

// Cambiar estado de un incidente
exports.cambiarEstadoIncidente = async (req, res) => {
  try {
    const { estado } = req.body;
    
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
    
    // Actualizar estado
    await incidente.update({ estado });
    
    res.status(200).json({
      success: true,
      message: 'Estado del incidente actualizado correctamente',
      data: { id: incidente.id, estado }
    });
  } catch (error) {
    console.error('Error al cambiar estado del incidente:', error);
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

module.exports = exports;