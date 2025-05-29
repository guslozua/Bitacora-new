// controllers/codigos.controller.js - VERSIÓN CON MODALIDAD DE CONVENIO
const Codigo = require('../models/codigo.model');

// ✨ ACTUALIZADO: Obtener todos los códigos con filtros opcionales (incluye modalidad)
exports.getCodigos = async (req, res) => {
  try {
    const { 
      tipo, 
      estado, 
      fecha_vigencia, 
      search, 
      incluir_inactivos, 
      modalidad_convenio // ✨ NUEVO FILTRO
    } = req.query;
    
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
    
    // ✨ NUEVO: Filtrar por modalidad de convenio
    if (modalidad_convenio) {
      options.where.modalidad_convenio = modalidad_convenio;
    }
    
    if (fecha_vigencia) {
      options.where.fecha_vigencia = fecha_vigencia;
    }
    
    if (search) {
      options.where.search = search;
    }
    
    const codigos = await Codigo.findAll(options);
    
    console.log(`✅ Se encontraron ${codigos.length} códigos con filtros:`, {
      tipo,
      estado,
      modalidad_convenio,
      incluir_inactivos
    });
    
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

// ✨ ACTUALIZADO: Crear un nuevo código (incluye modalidad)
exports.createCodigo = async (req, res) => {
  try {
    console.log('🚀 CREAR CÓDIGO - Body completo recibido:', req.body);
    
    const { 
      codigo, descripcion, notas, tipo, dias_aplicables, 
      hora_inicio, hora_fin, factor_multiplicador,
      fecha_vigencia_desde, fecha_vigencia_hasta, estado,
      modalidad_convenio = 'FC' // ✨ NUEVO CAMPO CON DEFAULT
    } = req.body;
    
    console.log('🚀 CREAR CÓDIGO - Campos extraídos:', {
      codigo,
      descripcion,
      notas: notas,
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado,
      modalidad_convenio // ✨ NUEVO
    });
    
    // Validaciones
    if (!codigo || !descripcion || !tipo || !fecha_vigencia_desde) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }
    
    // ✨ ACTUALIZADO: Verificar si ya existe un código con el mismo código Y modalidad
    const codigosExistentes = await Codigo.findAll({
      where: {
        codigo,
        modalidad_convenio
      }
    });
    
    if (codigosExistentes.length > 0) {
      return res.status(409).json({
        success: false,
        message: `El código "${codigo}" ya existe para la modalidad ${modalidad_convenio}.`
      });
    }
    
    // Crear el código
    const nuevoCodigo = await Codigo.create({
      codigo,
      descripcion,
      notas,
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado,
      modalidad_convenio // ✨ INCLUIR MODALIDAD
    });
    
    console.log('✅ CÓDIGO CREADO EXITOSAMENTE:', {
      id: nuevoCodigo.id,
      codigo: nuevoCodigo.codigo,
      modalidad_convenio: nuevoCodigo.modalidad_convenio
    });
    
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

// ✨ ACTUALIZADO: Actualizar un código existente (incluye modalidad)
exports.updateCodigo = async (req, res) => {
  try {
    console.log('🔄 ACTUALIZAR CÓDIGO - Body completo recibido:', req.body);
    console.log('🔄 ACTUALIZAR CÓDIGO - ID:', req.params.id);
    
    const { 
      codigo, descripcion, notas, tipo, dias_aplicables, 
      hora_inicio, hora_fin, factor_multiplicador,
      fecha_vigencia_desde, fecha_vigencia_hasta, estado,
      modalidad_convenio // ✨ NUEVO CAMPO
    } = req.body;
    
    console.log('🔄 ACTUALIZAR CÓDIGO - Campos extraídos:', {
      codigo,
      descripcion,
      notas: notas,
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado,
      modalidad_convenio // ✨ NUEVO
    });
    
    // Verificar que el código existe
    const codigoObj = await Codigo.findByPk(req.params.id);
    if (!codigoObj) {
      return res.status(404).json({
        success: false,
        message: 'Código no encontrado'
      });
    }
    
    // ✨ ACTUALIZADO: Si se va a cambiar el código o modalidad, verificar que no haya conflictos
    if ((codigo && codigo !== codigoObj.codigo) || 
        (modalidad_convenio && modalidad_convenio !== codigoObj.modalidad_convenio)) {
      
      const nuevoCodigo = codigo || codigoObj.codigo;
      const nuevaModalidad = modalidad_convenio || codigoObj.modalidad_convenio;
      
      const codConflicto = await Codigo.findAll({
        where: {
          codigo: nuevoCodigo,
          modalidad_convenio: nuevaModalidad
        }
      });
      
      if (codConflicto.some(c => c.id !== parseInt(req.params.id))) {
        return res.status(409).json({
          success: false,
          message: `El código "${nuevoCodigo}" ya existe para la modalidad ${nuevaModalidad}.`
        });
      }
    }
    
    // Actualizar el código
    const codigoActualizado = await codigoObj.update({
      codigo,
      descripcion,
      notas,
      tipo,
      dias_aplicables,
      hora_inicio,
      hora_fin,
      factor_multiplicador,
      fecha_vigencia_desde,
      fecha_vigencia_hasta,
      estado,
      modalidad_convenio // ✨ INCLUIR MODALIDAD
    });
    
    console.log('✅ CÓDIGO ACTUALIZADO EXITOSAMENTE:', {
      id: codigoActualizado.id,
      codigo: codigoActualizado.codigo,
      modalidad_convenio: codigoActualizado.modalidad_convenio
    });
    
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

// ✨ ACTUALIZADO: Obtener códigos aplicables a un rango de fecha y hora (incluye modalidad)
exports.getCodigosAplicables = async (req, res) => {
  try {
    const { 
      fecha, 
      hora_inicio, 
      hora_fin, 
      modalidad_convenio = 'FC' // ✨ NUEVO PARÁMETRO CON DEFAULT
    } = req.query;
    
    console.log('🔍 CÓDIGOS APLICABLES - Parámetros recibidos:', {
      fecha,
      hora_inicio,
      hora_fin,
      modalidad_convenio
    });
    
    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros: fecha, hora_inicio, hora_fin'
      });
    }
    
    // ✨ USAR FUNCIÓN ACTUALIZADA CON MODALIDAD
    const codigosAplicables = await Codigo.findApplicable(
      fecha,
      hora_inicio,
      hora_fin,
      modalidad_convenio // ✨ PASAR MODALIDAD
    );
    
    console.log(`✅ CÓDIGOS APLICABLES ENCONTRADOS: ${codigosAplicables.length} para modalidad ${modalidad_convenio}`);
    
    res.status(200).json({
      success: true,
      count: codigosAplicables.length,
      data: codigosAplicables,
      modalidad_convenio: modalidad_convenio // ✨ INCLUIR EN RESPUESTA
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