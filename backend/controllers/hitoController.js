// controllers/hitoController.js - VERSIÓN SIMPLIFICADA PARA SQL SERVER
const hitoModel = require('../models/HitoModel');
const { validationResult } = require('express-validator');

// Obtener todos los hitos con filtros opcionales
exports.getHitos = async (req, res) => {
  try {
    const filters = {
      nombre: req.query.nombre,
      fechaInicio: req.query.fechaInicio,
      fechaFin: req.query.fechaFin,
      idProyectoOrigen: req.query.idProyectoOrigen,
      usuario: req.query.usuario
    };

    const hitos = await hitoModel.getHitos(filters);
    
    res.json({
      success: true,
      count: hitos.length,
      data: hitos
    });
  } catch (error) {
    console.error('❌ Error obteniendo hitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener hitos: ' + error.message
    });
  }
};

// Obtener un hito por ID
exports.getHitoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de hito inválido'
      });
    }

    const hito = await hitoModel.getHitoById(id);
    
    if (!hito) {
      return res.status(404).json({
        success: false,
        message: 'Hito no encontrado'
      });
    }

    res.json({
      success: true,
      data: hito
    });
  } catch (error) {
    console.error('❌ Error obteniendo hito por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener hito: ' + error.message
    });
  }
};

// Crear un nuevo hito
exports.createHito = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const hitoData = req.body;
    const result = await hitoModel.createHito(hitoData);
    
    res.status(201).json({
      success: true,
      message: 'Hito creado exitosamente',
      data: { id: result.insertId || result.id }
    });
  } catch (error) {
    console.error('❌ Error creando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear hito: ' + error.message
    });
  }
};

// Actualizar un hito
exports.updateHito = async (req, res) => {
  try {
    const { id } = req.params;
    const hitoData = req.body;
    
    const result = await hitoModel.updateHito(id, hitoData);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hito no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Hito actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar hito: ' + error.message
    });
  }
};

// Eliminar un hito
exports.deleteHito = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await hitoModel.deleteHito(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hito no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Hito eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar hito: ' + error.message
    });
  }
};

// Funciones básicas para evitar errores en las rutas
exports.convertProjectToHito = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidad en desarrollo'
  });
};

exports.manageHitoUsers = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidad en desarrollo'
  });
};

exports.manageHitoTasks = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidad en desarrollo'
  });
};

exports.exportHitoToPDF = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidad en desarrollo'
  });
};
