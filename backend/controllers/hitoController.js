// controllers/hitoController.js - VERSIÓN CORREGIDA Y MEJORADA
const hitoModel = require('../models/HitoModel');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { logEvento } = require('../utils/logEvento');

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

    res.status(200).json({
      success: true,
      count: hitos.length,
      data: hitos
    });
  } catch (error) {
    console.error('Error al obtener hitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los hitos',
      error: error.message
    });
  }
};

// Obtener un hito por ID
exports.getHitoById = async (req, res) => {
  try {
    const hitoId = req.params.id;
    const hito = await hitoModel.getHitoById(hitoId);

    if (!hito) {
      return res.status(404).json({
        success: false,
        message: 'Hito no encontrado'
      });
    }

    // Obtener usuarios asignados al hito
    const usuarios = await hitoModel.getHitoUsers(hitoId);
    
    // Obtener tareas asociadas al hito
    const tareas = await hitoModel.getHitoTasks(hitoId);

    res.status(200).json({
      success: true,
      data: {
        ...hito,
        usuarios,
        tareas
      }
    });
  } catch (error) {
    console.error('Error al obtener el hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el hito',
      error: error.message
    });
  }
};

// Crear un nuevo hito - VERSIÓN CORREGIDA
exports.createHito = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { 
      nombre, 
      fecha_inicio, 
      fecha_fin, 
      descripcion, 
      impacto, 
      id_proyecto_origen,
      usuarios = []
    } = req.body;
    
    const id_usuario = req.user?.id;

    console.log('🆕 Creando hito con datos:', {
      nombre,
      fecha_inicio,
      fecha_fin,
      descripcion,
      impacto,
      id_proyecto_origen,
      usuariosCount: usuarios.length,
      id_usuario
    });

    // Validar datos básicos
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del hito es obligatorio'
      });
    }

    // Crear el hito
    const result = await hitoModel.createHito({
      nombre: nombre.trim(),
      fecha_inicio,
      fecha_fin,
      descripcion: descripcion?.trim(),
      impacto: impacto?.trim(),
      id_proyecto_origen
    });

    const hitoId = result.insertId;
    console.log('✅ Hito creado con ID:', hitoId);

    // Validar que se creó correctamente
    if (!hitoId || hitoId <= 0) {
      throw new Error('Error al crear hito: no se generó un ID válido');
    }

    // Asignar usuarios si se proporcionaron
    if (usuarios && usuarios.length > 0) {
      console.log('👥 Asignando usuarios al hito...');
      
      for (const usuario of usuarios) {
        // Validar datos del usuario
        if (!usuario.id_usuario || usuario.id_usuario <= 0) {
          console.error('❌ Usuario inválido:', usuario);
          continue; // Saltar usuario inválido pero continuar con los demás
        }

        try {
          await hitoModel.assignUserToHito(
            hitoId, 
            usuario.id_usuario, 
            usuario.rol || 'colaborador'
          );
          console.log(`✅ Usuario ${usuario.id_usuario} asignado correctamente`);
        } catch (userError) {
          console.error(`❌ Error al asignar usuario ${usuario.id_usuario}:`, userError.message);
          // No fallar todo el proceso por un usuario problemático
        }
      }
    }

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'CREACIÓN',
        descripcion: `Hito creado: ${nombre}`,
        id_usuario,
        id_hito: hitoId
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Obtener el hito creado con toda su información
    const nuevoHito = await hitoModel.getHitoById(hitoId);
    const hitosUsuarios = await hitoModel.getHitoUsers(hitoId);

    console.log('🎉 Hito creado exitosamente:', {
      id: nuevoHito.id,
      nombre: nuevoHito.nombre,
      usuariosAsignados: hitosUsuarios.length
    });

    res.status(201).json({
      success: true,
      message: 'Hito creado correctamente',
      data: {
        ...nuevoHito,
        usuarios: hitosUsuarios
      }
    });
  } catch (error) {
    console.error('❌ Error al crear hito:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Error al crear el hito',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Actualizar un hito existente - VERSIÓN CORREGIDA
exports.updateHito = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const hitoId = parseInt(req.params.id);
    const { 
      nombre, 
      fecha_inicio, 
      fecha_fin, 
      descripcion, 
      impacto, 
      id_proyecto_origen,
      usuarios
    } = req.body;
    
    const id_usuario = req.user?.id;

    // Validar ID del hito
    if (!hitoId || hitoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de hito inválido'
      });
    }

    // Verificar que el hito existe
    const hito = await hitoModel.getHitoById(hitoId);
    if (!hito) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hito no encontrado' 
      });
    }

    console.log('📝 Actualizando hito:', {
      hitoId,
      nombre,
      usuariosCount: usuarios?.length || 0
    });

    // Actualizar el hito
    await hitoModel.updateHito(hitoId, {
      nombre: nombre?.trim(),
      fecha_inicio,
      fecha_fin,
      descripcion: descripcion?.trim(),
      impacto: impacto?.trim(),
      id_proyecto_origen
    });

    // Actualizar usuarios si se proporcionaron
    if (usuarios && Array.isArray(usuarios)) {
      console.log('👥 Actualizando usuarios del hito...');
      
      // Obtener usuarios actuales
      const usuariosActuales = await hitoModel.getHitoUsers(hitoId);
      
      // Eliminar usuarios que ya no están en la lista
      for (const usuarioActual of usuariosActuales) {
        const mantenerUsuario = usuarios.some(u => 
          parseInt(u.id_usuario) === parseInt(usuarioActual.id_usuario)
        );
        if (!mantenerUsuario) {
          try {
            await hitoModel.removeUserFromHito(hitoId, usuarioActual.id_usuario);
            console.log(`👤 Usuario ${usuarioActual.id_usuario} eliminado`);
          } catch (removeError) {
            console.error(`❌ Error al eliminar usuario ${usuarioActual.id_usuario}:`, removeError.message);
          }
        }
      }
      
      // Agregar o actualizar usuarios nuevos
      for (const usuario of usuarios) {
        if (!usuario.id_usuario || usuario.id_usuario <= 0) {
          console.error('❌ Usuario inválido:', usuario);
          continue;
        }

        try {
          await hitoModel.assignUserToHito(hitoId, usuario.id_usuario, usuario.rol || 'colaborador');
          console.log(`👤 Usuario ${usuario.id_usuario} asignado/actualizado`);
        } catch (assignError) {
          console.error(`❌ Error al asignar usuario ${usuario.id_usuario}:`, assignError.message);
        }
      }
    }

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'ACTUALIZACIÓN',
        descripcion: `Hito actualizado: ${nombre || hito.nombre}`,
        id_usuario,
        id_hito: hitoId
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Obtener el hito actualizado con toda su información
    const hitoActualizado = await hitoModel.getHitoById(hitoId);
    const hitosUsuarios = await hitoModel.getHitoUsers(hitoId);
    const hitoTareas = await hitoModel.getHitoTasks(hitoId);

    console.log('✅ Hito actualizado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Hito actualizado correctamente',
      data: {
        ...hitoActualizado,
        usuarios: hitosUsuarios,
        tareas: hitoTareas
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el hito',
      error: error.message
    });
  }
};

// Eliminar un hito
exports.deleteHito = async (req, res) => {
  try {
    const hitoId = req.params.id;
    const id_usuario = req.user?.id;

    // Verificar que el hito existe
    const hito = await hitoModel.getHitoById(hitoId);
    if (!hito) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hito no encontrado' 
      });
    }

    // Eliminar el hito
    await hitoModel.deleteHito(hitoId);

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'ELIMINACIÓN',
        descripcion: `Hito eliminado: ${hito.nombre}`,
        id_usuario
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Hito eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el hito',
      error: error.message
    });
  }
};

// 🎯 CONVERTIR PROYECTO A HITO - VERSIÓN CON DEBUG COMPLETO
exports.convertProjectToHito = async (req, res) => {
  console.log('🎯 LLEGÓ PETICIÓN DE CONVERSIÓN:', {
    projectId: req.params.id,
    body: req.body,
    user: req.user ? {
      id: req.user.id,
      nombre: req.user.nombre,
      email: req.user.email
    } : 'NO USER',
    headers: {
      'x-auth-token': req.headers['x-auth-token'] ? 'Presente' : 'Ausente',
      'authorization': req.headers.authorization ? 'Presente' : 'Ausente'
    }
  });

  try {
    const projectId = req.params.id;
    const id_usuario = req.user?.id;
    const { impacto } = req.body;

    console.log('📋 DATOS EXTRAÍDOS:', {
      projectId,
      id_usuario,
      impacto,
      userExists: !!req.user
    });

    // Validar que el proyecto ID sea un número válido
    if (!projectId || isNaN(projectId)) {
      console.log('❌ ERROR: Project ID inválido:', projectId);
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    // Validar que el usuario esté autenticado
    if (!id_usuario) {
      console.log('❌ ERROR: Usuario no autenticado');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    console.log('✅ VALIDACIONES PASADAS, llamando al modelo...');

    // Llamar al modelo para convertir el proyecto
    const hito = await hitoModel.convertProjectToHito(projectId, impacto);

    console.log('✅ MODELO EJECUTADO EXITOSAMENTE:', {
      hitoId: hito?.id,
      hitoNombre: hito?.nombre
    });

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'CONVERSIÓN',
        descripcion: `Proyecto convertido a hito: ${hito.nombre}`,
        id_usuario,
        id_proyecto: projectId,
        id_hito: hito.id
      });
      console.log('✅ EVENTO REGISTRADO en bitácora');
    } catch (logError) {
      console.log('⚠️ ERROR AL REGISTRAR EVENTO (no crítico):', logError.message);
    }

    console.log('🎉 ENVIANDO RESPUESTA EXITOSA...');

    res.status(200).json({
      success: true,
      message: 'Proyecto convertido a hito correctamente',
      data: hito
    });

  } catch (error) {
    console.error('❌ ERROR DETALLADO EN CONVERSIÓN:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });

    res.status(500).json({
      success: false,
      message: 'Error al convertir proyecto a hito',
      error: error.message
    });
  }
};

// Gestionar usuarios de un hito
exports.manageHitoUsers = async (req, res) => {
  try {
    const hitoId = parseInt(req.params.id);
    const { action, userId, rol } = req.body;
    const id_usuario = req.user?.id;

    console.log('👥 Gestionando usuarios de hito:', {
      hitoId,
      action,
      userId,
      rol
    });

    // Validaciones
    if (!hitoId || hitoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de hito inválido'
      });
    }

    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // Verificar que el hito existe
    const hito = await hitoModel.getHitoById(hitoId);
    if (!hito) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hito no encontrado' 
      });
    }

    let result;
    let mensaje;

    switch (action) {
      case 'add':
        result = await hitoModel.assignUserToHito(hitoId, userId, rol || 'colaborador');
        mensaje = 'Usuario asignado al hito correctamente';
        break;
      case 'remove':
        result = await hitoModel.removeUserFromHito(hitoId, userId);
        mensaje = 'Usuario eliminado del hito correctamente';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida'
        });
    }

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: action === 'add' ? 'ASIGNACIÓN' : 'DESASIGNACIÓN',
        descripcion: `Usuario ${action === 'add' ? 'asignado a' : 'eliminado de'} hito: ${hito.nombre}`,
        id_usuario,
        id_hito: hitoId
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Obtener la lista actualizada de usuarios
    const usuarios = await hitoModel.getHitoUsers(hitoId);

    res.status(200).json({
      success: true,
      message: mensaje,
      data: usuarios
    });
  } catch (error) {
    console.error('❌ Error al gestionar usuarios del hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al gestionar usuarios del hito',
      error: error.message
    });
  }
};

// Gestionar tareas de un hito
exports.manageHitoTasks = async (req, res) => {
  try {
    const hitoId = req.params.id;
    const { action, taskId, taskData } = req.body;
    const id_usuario = req.user?.id;

    // Verificar que el hito existe
    const hito = await hitoModel.getHitoById(hitoId);
    if (!hito) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hito no encontrado' 
      });
    }

    let result;
    let mensaje;

    switch (action) {
      case 'add':
        result = await hitoModel.addTaskToHito(hitoId, taskData);
        mensaje = 'Tarea agregada al hito correctamente';
        break;
      case 'update':
        result = await hitoModel.updateHitoTask(taskId, taskData);
        mensaje = 'Tarea actualizada correctamente';
        break;
      case 'remove':
        result = await hitoModel.removeTaskFromHito(taskId);
        mensaje = 'Tarea eliminada del hito correctamente';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Acción no válida'
        });
    }

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: action === 'add' ? 'CREACIÓN' : (action === 'update' ? 'ACTUALIZACIÓN' : 'ELIMINACIÓN'),
        descripcion: `Tarea ${action === 'add' ? 'agregada a' : (action === 'update' ? 'actualizada en' : 'eliminada de')} hito: ${hito.nombre}`,
        id_usuario,
        id_hito: hitoId
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Obtener la lista actualizada de tareas
    const tareas = await hitoModel.getHitoTasks(hitoId);

    res.status(200).json({
      success: true,
      message: mensaje,
      data: tareas
    });
  } catch (error) {
    console.error('Error al gestionar tareas del hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al gestionar tareas del hito',
      error: error.message
    });
  }
};

// 🎨 VERSIÓN MEJORADA: Exportar hito a PDF con logo y diseño profesional
exports.exportHitoToPDF = async (req, res) => {
  try {
    const hitoId = req.params.id;

    // Obtener información completa del hito
    const hito = await hitoModel.getHitoById(hitoId);
    if (!hito) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hito no encontrado' 
      });
    }

    // Obtener usuarios asignados al hito
    const usuarios = await hitoModel.getHitoUsers(hitoId);
    
    // Obtener tareas asociadas al hito
    const tareas = await hitoModel.getHitoTasks(hitoId);

    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear nombre de archivo único
    const fileName = `hito_${hitoId}_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Reporte de Hito - ${hito.nombre}`,
        Author: 'Sistema de Gestión de Hitos'
      }
    });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Contenido simplificado del PDF
    doc.fontSize(20)
       .text('REPORTE DE HITO', 50, 50)
       .fontSize(16)
       .text(hito.nombre, 50, 90)
       .fontSize(12)
       .text(`ID: ${hitoId}`, 50, 120)
       .text(`Fecha: ${new Date().toLocaleDateString()}`, 50, 140);

    if (hito.descripcion) {
      doc.text(`Descripción: ${hito.descripcion}`, 50, 180);
    }

    if (usuarios.length > 0) {
      doc.text('Usuarios asignados:', 50, 220);
      usuarios.forEach((usuario, index) => {
        doc.text(`• ${usuario.nombre} (${usuario.rol})`, 70, 240 + (index * 20));
      });
    }

    // Finalizar documento
    doc.end();

    // Registrar evento de exportación
    try {
      await logEvento({
        tipo_evento: 'EXPORTACIÓN',
        descripcion: `Hito exportado a PDF: ${hito.nombre}`,
        id_usuario: req.user?.id,
        id_hito: hitoId
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Esperar a que se complete la escritura del archivo
    stream.on('finish', () => {
      // Enviar archivo al cliente
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error al enviar el archivo:', err);
          return res.status(500).json({
            success: false,
            message: 'Error al generar el PDF',
            error: err.message
          });
        }
        
        // Eliminar archivo temporal después de enviarlo
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error al eliminar archivo temporal:', unlinkErr);
          }
        });
      });
    });

    // Manejar errores en la escritura del archivo
    stream.on('error', (err) => {
      console.error('Error al escribir el archivo PDF:', err);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF',
        error: err.message
      });
    });
  } catch (error) {
    console.error('Error al exportar hito a PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar el hito a PDF',
      error: error.message
    });
  }
};

module.exports = exports;