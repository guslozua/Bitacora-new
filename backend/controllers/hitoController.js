// controllers/hitoController.js - VERSIÓN CON DEBUG MEJORADO
const hitoModel = require('../models/HitoModel');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logEvento = require('../utils/logEvento');

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

// Crear un nuevo hito
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

    // Crear el hito
    const result = await hitoModel.createHito({
      nombre,
      fecha_inicio,
      fecha_fin,
      descripcion,
      impacto,
      id_proyecto_origen
    });

    const hitoId = result.insertId;

    // Asignar usuarios si se proporcionaron
    if (usuarios.length > 0) {
      for (const usuario of usuarios) {
        await hitoModel.assignUserToHito(hitoId, usuario.id_usuario, usuario.rol || 'colaborador');
      }
    }

    // Registrar evento
    await logEvento({
      tipo_evento: 'CREACIÓN',
      descripcion: `Hito creado: ${nombre}`,
      id_usuario,
      id_hito: hitoId
    });

    // Obtener el hito creado con toda su información
    const nuevoHito = await hitoModel.getHitoById(hitoId);
    const hitosUsuarios = await hitoModel.getHitoUsers(hitoId);

    res.status(201).json({
      success: true,
      message: 'Hito creado correctamente',
      data: {
        ...nuevoHito,
        usuarios: hitosUsuarios
      }
    });
  } catch (error) {
    console.error('Error al crear hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el hito',
      error: error.message
    });
  }
};

// Actualizar un hito existente
exports.updateHito = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const hitoId = req.params.id;
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

    // Verificar que el hito existe
    const hito = await hitoModel.getHitoById(hitoId);
    if (!hito) {
      return res.status(404).json({ 
        success: false, 
        message: 'Hito no encontrado' 
      });
    }

    // Actualizar el hito
    await hitoModel.updateHito(hitoId, {
      nombre,
      fecha_inicio,
      fecha_fin,
      descripcion,
      impacto,
      id_proyecto_origen
    });

    // Actualizar usuarios si se proporcionaron
    if (usuarios && Array.isArray(usuarios)) {
      // Obtener usuarios actuales
      const usuariosActuales = await hitoModel.getHitoUsers(hitoId);
      
      // Eliminar usuarios que ya no están en la lista
      for (const usuarioActual of usuariosActuales) {
        const mantenerUsuario = usuarios.some(u => u.id_usuario === usuarioActual.id_usuario);
        if (!mantenerUsuario) {
          await hitoModel.removeUserFromHito(hitoId, usuarioActual.id_usuario);
        }
      }
      
      // Agregar o actualizar usuarios nuevos
      for (const usuario of usuarios) {
        await hitoModel.assignUserToHito(hitoId, usuario.id_usuario, usuario.rol || 'colaborador');
      }
    }

    // Registrar evento
    await logEvento({
      tipo_evento: 'ACTUALIZACIÓN',
      descripcion: `Hito actualizado: ${nombre || 'ID ' + hitoId}`,
      id_usuario,
      id_hito: hitoId
    });

    // Obtener el hito actualizado con toda su información
    const hitoActualizado = await hitoModel.getHitoById(hitoId);
    const hitosUsuarios = await hitoModel.getHitoUsers(hitoId);
    const hitoTareas = await hitoModel.getHitoTasks(hitoId);

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
    console.error('Error al actualizar hito:', error);
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
    await logEvento({
      tipo_evento: 'ELIMINACIÓN',
      descripcion: `Hito eliminado: ${hito.nombre}`,
      id_usuario
    });

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
    const hitoId = req.params.id;
    const { action, userId, rol } = req.body;
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
    await logEvento({
      tipo_evento: action === 'add' ? 'ASIGNACIÓN' : 'DESASIGNACIÓN',
      descripcion: `Usuario ${action === 'add' ? 'asignado a' : 'eliminado de'} hito: ${hito.nombre}`,
      id_usuario,
      id_hito: hitoId
    });

    // Obtener la lista actualizada de usuarios
    const usuarios = await hitoModel.getHitoUsers(hitoId);

    res.status(200).json({
      success: true,
      message: mensaje,
      data: usuarios
    });
  } catch (error) {
    console.error('Error al gestionar usuarios del hito:', error);
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
    await logEvento({
      tipo_evento: action === 'add' ? 'CREACIÓN' : (action === 'update' ? 'ACTUALIZACIÓN' : 'ELIMINACIÓN'),
      descripcion: `Tarea ${action === 'add' ? 'agregada a' : (action === 'update' ? 'actualizada en' : 'eliminada de')} hito: ${hito.nombre}`,
      id_usuario,
      id_hito: hitoId
    });

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

// Exportar hito a PDF
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

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Título y encabezado
    doc.fontSize(25).text('Informe de Hito', { align: 'center' });
    doc.moveDown();
    doc.fontSize(15).text(hito.nombre, { align: 'center' });
    doc.moveDown();

    // Información general
    doc.fontSize(12).text('Información General', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Fecha de inicio: ${hito.fecha_inicio ? new Date(hito.fecha_inicio).toLocaleDateString() : 'No especificada'}`);
    doc.fontSize(10).text(`Fecha de finalización: ${hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString() : 'No especificada'}`);
    doc.fontSize(10).text(`Proyecto origen: ${hito.proyecto_origen_nombre || 'Ninguno (hito manual)'}`);
    doc.moveDown();

    // Descripción
    doc.fontSize(12).text('Descripción', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(hito.descripcion || 'Sin descripción');
    doc.moveDown();

    // Impacto
    doc.fontSize(12).text('Impacto', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(hito.impacto || 'No especificado');
    doc.moveDown();

    // Usuarios involucrados
    doc.fontSize(12).text('Usuarios Involucrados', { underline: true });
    doc.moveDown(0.5);
    if (usuarios.length > 0) {
      usuarios.forEach(usuario => {
        doc.fontSize(10).text(`- ${usuario.nombre} (${usuario.email}) - Rol: ${usuario.rol}`);
      });
    } else {
      doc.fontSize(10).text('No hay usuarios asignados');
    }
    doc.moveDown();

    // Tareas
    doc.fontSize(12).text('Tareas Relacionadas', { underline: true });
    doc.moveDown(0.5);
    if (tareas.length > 0) {
      tareas.forEach(tarea => {
        doc.fontSize(10).text(`- ${tarea.nombre_tarea}`);
        doc.fontSize(8).text(`  Descripción: ${tarea.descripcion || 'Sin descripción'}`);
        doc.fontSize(8).text(`  Estado: ${tarea.estado}`);
        doc.fontSize(8).text(`  Fechas: ${tarea.fecha_inicio ? new Date(tarea.fecha_inicio).toLocaleDateString() : 'No especificada'} - ${tarea.fecha_fin ? new Date(tarea.fecha_fin).toLocaleDateString() : 'No especificada'}`);
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(10).text('No hay tareas registradas');
    }

    // Pie de página
    doc.moveDown(2);
    doc.fontSize(8).text(`Generado el ${new Date().toLocaleString()}`, { align: 'center' });

    // Finalizar documento
    doc.end();

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