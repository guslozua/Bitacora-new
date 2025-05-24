// controllers/codigos.controller.js - VERSIÓN CON DEBUG
const Codigo = require('../models/codigo.model');

// Obtener todos los códigos con filtros opcionales
exports.getCodigos = async (req, res) => {
  try {
    const { tipo, estado, fecha_vigencia, search, incluir_inactivos } = req.query;
    
    const options = { where: {} };
    
    // Aplicar filtros si se proporcionan
    if (tipo) {
      options.where.tipo = tipo;
    }
    
    if (estado) {
      options.where.estado = estado;
    } else if (incluir_inactivos !== 'true') {
      // Por defecto, mostrar solo activos
      options.where.estado = 'activo';
    }
    
    if (fecha_vigencia) {
      options.where.fecha_vigencia = fecha_vigencia;
    }
    
    if (search) {
      options.where.search = search;
    }
    
    const codigos = await Codigo.findAll(options);
    
    res.status(200).json({
      success: true,
      count: codigos.length,
      data: codigos
    });
  } catch (error) {
    console.error('Error al obtener códigos de facturación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener códigos de facturación',
      error: error.message
    });
  }
};

// Obtener un código por ID
exports.getCodigoById = async (req, res) => {
  try {
    const codigo = await Codigo.findByPk(req.params.id);
    
    if (!codigo) {
      return res.status(404).json({
        success: false,
        message: 'Código no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: codigo
    });
  } catch (error) {
    console.error('Error al obtener código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener código',
      error: error.message
    });
  }
};

// Crear un nuevo código
exports.createCodigo = async (req, res) => {
  try {
    console.log('🚀 CREAR CÓDIGO - Body completo recibido:', req.body);
    
    const { 
      codigo, descripcion, notas, tipo, dias_aplicables, 
      hora_inicio, hora_fin, factor_multiplicador,
      fecha_vigencia_desde, fecha_vigencia_hasta, estado 
    } = req.body;
    
    console.log('🚀 CREAR CÓDIGO - Campos extraídos:', {
      codigo,
      descripcion,
      notas: notas, // Ver exactamente qué llega
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado
    });
    
    // Validaciones
    if (!codigo || !descripcion || !tipo || !fecha_vigencia_desde) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    // Verificar si ya existe un código con el mismo código
    const codigosExistentes = await Codigo.findAll({
      where: {
        codigo
      }
    });
    
    if (codigosExistentes.length > 0) {
      return res.status(409).json({
        success: false,
        message: `El código "${codigo}" ya existe en el sistema.`
      });
    }
    
    // Crear el código
    const nuevoCodigo = await Codigo.create({
      codigo,
      descripcion,
      notas, // ✨ Incluir el campo notas
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado
    });
    
    console.log('✅ CÓDIGO CREADO EXITOSAMENTE:', nuevoCodigo);
    
    res.status(201).json({
      success: true,
      message: 'Código creado correctamente',
      data: nuevoCodigo
    });
  } catch (error) {
    console.error('❌ Error al crear código:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al crear código',
      error: error.message
    });
  }
};

// Actualizar un código existente
exports.updateCodigo = async (req, res) => {
  try {
    console.log('🔄 ACTUALIZAR CÓDIGO - Body completo recibido:', req.body);
    console.log('🔄 ACTUALIZAR CÓDIGO - ID:', req.params.id);
    
    const { 
      codigo, descripcion, notas, tipo, dias_aplicables, 
      hora_inicio, hora_fin, factor_multiplicador,
      fecha_vigencia_desde, fecha_vigencia_hasta, estado 
    } = req.body;
    
    console.log('🔄 ACTUALIZAR CÓDIGO - Campos extraídos:', {
      codigo,
      descripcion,
      notas: notas, // Ver exactamente qué llega
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado
    });
    
    // Verificar que el código existe
    const codigoObj = await Codigo.findByPk(req.params.id);
    if (!codigoObj) {
      return res.status(404).json({
        success: false,
        message: 'Código no encontrado'
      });
    }
    
    // Si se va a cambiar el código, verificar que no haya conflictos
    if (codigo && codigo !== codigoObj.codigo) {
      const codConflicto = await Codigo.findAll({
        where: {
          codigo
        }
      });
      
      if (codConflicto.some(c => c.id !== parseInt(req.params.id))) {
        return res.status(409).json({
          success: false,
          message: `El código "${codigo}" ya existe en el sistema.`
        });
      }
    }
    
    // Actualizar el código
    const codigoActualizado = await codigoObj.update({
      codigo,
      descripcion,
      notas, // ✨ Incluir el campo notas
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado
    });
    
    console.log('✅ CÓDIGO ACTUALIZADO EXITOSAMENTE:', codigoActualizado);
    
    res.status(200).json({
      success: true,
      message: 'Código actualizado correctamente',
      data: codigoActualizado
    });
  } catch (error) {
    console.error('❌ Error al actualizar código:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error al actualizar código',
      error: error.message
    });
  }
};

// Desactivar un código
exports.deactivateCodigo = async (req, res) => {
  try {
    const codigo = await Codigo.findByPk(req.params.id);
    
    if (!codigo) {
      return res.status(404).json({
        success: false,
        message: 'Código no encontrado'
      });
    }
    
    await codigo.deactivate();
    
    res.status(200).json({
      success: true,
      message: 'Código desactivado correctamente'
    });
  } catch (error) {
    console.error('Error al desactivar código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar código',
      error: error.message
    });
  }
};

// Eliminar un código (solo si no está en uso)
exports.deleteCodigo = async (req, res) => {
  try {
    const codigo = await Codigo.findByPk(req.params.id);
    
    if (!codigo) {
      return res.status(404).json({
        success: false,
        message: 'Código no encontrado'
      });
    }
    
    try {
      await codigo.destroy();
      
      res.status(200).json({
        success: true,
        message: 'Código eliminado correctamente'
      });
    } catch (error) {
      if (error.message.includes('está siendo utilizado')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error al eliminar código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar código',
      error: error.message
    });
  }
};

// Obtener códigos aplicables a un rango de fecha y hora
exports.getCodigosAplicables = async (req, res) => {
  try {
    const { fecha, hora_inicio, hora_fin } = req.query;
    
    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros: fecha, hora_inicio, hora_fin'
      });
    }
    
    const codigosAplicables = await Codigo.findApplicable(
      fecha,
      hora_inicio,
      hora_fin
    );
    
    res.status(200).json({
      success: true,
      count: codigosAplicables.length,
      data: codigosAplicables
    });
  } catch (error) {
    console.error('Error al obtener códigos aplicables:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener códigos aplicables',
      error: error.message
    });
  }
};

module.exports = exports;