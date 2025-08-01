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

// 📋 NUEVA FUNCIÓN: EXPORTAR TODOS LOS HITOS A PDF - REPORTE CONSOLIDADO
exports.exportAllHitosToPDF = async (req, res) => {
  try {
    console.log('📋 Iniciando exportación de todos los hitos...');

    // Obtener todos los hitos ordenados cronológicamente
    const hitos = await hitoModel.getHitos({});
    
    if (!hitos || hitos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay hitos disponibles para exportar' 
      });
    }

    console.log(`📊 Exportando ${hitos.length} hitos...`);

    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear nombre de archivo único
    const fileName = `reporte_hitos_completo_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    // 🎨 CONFIGURACIÓN DEL DOCUMENTO
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Reporte Completo de Hitos',
        Author: 'Sistema de Gestión de Hitos',
        Subject: 'Informe consolidado de todos los hitos',
        Creator: 'Bitácora System',
        Producer: 'PDFKit'
      }
    });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🎨 COLORES Y ESTILOS (reutilizando los del individual)
    const colors = {
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#334155',
      text: '#000000',
      lightGray: '#f8fafc',
      darkGray: '#475569'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // 🖼️ FUNCIÓN PARA LOGO (reutilizada del individual)
    const addLogo = () => {
      const logoPath = path.join(__dirname, '../assets/logo.png');
      
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, margin, { width: 50, height: 50 });
        } else {
          doc.fontSize(14)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TASKMANAGER', margin, margin + 15)
             .fontSize(8)
             .fillColor(colors.secondary)
             .font('Helvetica')
             .text('Sistema de Gestión', margin, margin + 35);
        }
      } catch (error) {
        doc.fontSize(14)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('TASKMANAGER', margin, margin + 15)
           .fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('Sistema de Gestión', margin, margin + 35);
      }
    };

    // 🎨 PORTADA DEL REPORTE
    const addCoverPage = () => {
      addLogo();
      
      // Título principal
      doc.fontSize(28)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('REPORTE COMPLETO DE HITOS', margin, 150, { align: 'center' });
      
      // Información del reporte
      doc.fontSize(12)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`Total de Hitos: ${hitos.length}`, margin, 220, { align: 'center' })
         .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, 240, { align: 'center' });
    };

    // 🎨 FUNCIÓN PARA AGREGAR CADA HITO
    const addHitoToPDF = async (hito, index) => {
      if (index > 0) {
        doc.addPage();
      }
      
      let currentY = margin;
      
      // Título del hito
      doc.fontSize(16)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${hito.nombre}`, margin, currentY);
      
      currentY += 30;
      
      // Información básica
      const info = [
        `ID: ${hito.id}`,
        `Fecha Inicio: ${hito.fecha_inicio ? new Date(hito.fecha_inicio).toLocaleDateString('es-ES') : 'No especificada'}`,
        `Fecha Fin: ${hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES') : 'No especificada'}`,
        `Proyecto Origen: ${hito.proyecto_origen_nombre || 'Hito manual'}`
      ];
      
      info.forEach(item => {
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(item, margin, currentY);
        currentY += 15;
      });
      
      currentY += 10;
      
      // Descripción
      if (hito.descripcion) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('DESCRIPCIÓN:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.descripcion, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
           
        currentY = doc.y + 15;
      }
      
      // Impacto
      if (hito.impacto) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('IMPACTO:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.impacto, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
           
        currentY = doc.y + 15;
      }
      
      // Obtener usuarios y tareas
      try {
        const usuarios = await hitoModel.getHitoUsers(hito.id);
        const tareas = await hitoModel.getHitoTasks(hito.id);
        
        // Usuarios
        if (usuarios && usuarios.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('USUARIOS:', margin, currentY);
             
          currentY += 15;
          
          usuarios.forEach(usuario => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${usuario.nombre} (${usuario.email}) - ${usuario.rol}`, margin + 10, currentY);
            currentY += 12;
          });
          
          currentY += 10;
        }
        
        // Tareas
        if (tareas && tareas.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TAREAS:', margin, currentY);
             
          currentY += 15;
          
          tareas.forEach(tarea => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${tarea.nombre_tarea} - ${tarea.estado}`, margin + 10, currentY);
            currentY += 12;
          });
        }
      } catch (error) {
        console.error(`Error al obtener detalles del hito ${hito.id}:`, error);
      }
    };

    // 🚀 GENERAR EL PDF
    
    // Portada
    addCoverPage();
    
    // Agregar cada hito
    for (let i = 0; i < hitos.length; i++) {
      if (i === 0) {
        doc.addPage();
      }
      await addHitoToPDF(hitos[i], i);
    }
    
    // Finalizar documento
    doc.end();

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'EXPORTACIÓN_MASIVA',
        descripcion: `Exportación completa de ${hitos.length} hitos a PDF`,
        id_usuario: req.user?.id
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Esperar a que se complete la escritura del archivo
    stream.on('finish', () => {
      console.log('✅ PDF completo generado exitosamente');
      
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

    // Manejar errores
    stream.on('error', (err) => {
      console.error('Error al escribir el archivo PDF:', err);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF',
        error: err.message
      });
    });

  } catch (error) {
    console.error('❌ Error al exportar todos los hitos a PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar los hitos a PDF',
      error: error.message
    });
  }
};

// 📋 NUEVA FUNCIÓN: EXPORTAR TODOS LOS HITOS A PDF - REPORTE CONSOLIDADO
exports.exportAllHitosToPDF = async (req, res) => {
  try {
    console.log('📋 Iniciando exportación de todos los hitos...');

    // Obtener todos los hitos ordenados cronológicamente
    const hitos = await hitoModel.getHitos({});
    
    if (!hitos || hitos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay hitos disponibles para exportar' 
      });
    }

    console.log(`📊 Exportando ${hitos.length} hitos...`);

    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear nombre de archivo único
    const fileName = `reporte_hitos_completo_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    // 🎨 CONFIGURACIÓN DEL DOCUMENTO
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Reporte Completo de Hitos',
        Author: 'Sistema de Gestión de Hitos',
        Subject: 'Informe consolidado de todos los hitos',
        Creator: 'Bitácora System',
        Producer: 'PDFKit'
      }
    });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🎨 COLORES Y ESTILOS (reutilizando los del individual)
    const colors = {
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#334155',
      text: '#000000',
      lightGray: '#f8fafc',
      darkGray: '#475569'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // 🖼️ FUNCIÓN PARA LOGO (reutilizada del individual)
    const addLogo = () => {
      const logoPath = path.join(__dirname, '../assets/logo.png');
      
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, margin, { width: 50, height: 50 });
        } else {
          doc.fontSize(14)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TASKMANAGER', margin, margin + 15)
             .fontSize(8)
             .fillColor(colors.secondary)
             .font('Helvetica')
             .text('Sistema de Gestión', margin, margin + 35);
        }
      } catch (error) {
        doc.fontSize(14)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('TASKMANAGER', margin, margin + 15)
           .fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('Sistema de Gestión', margin, margin + 35);
      }
    };

    // 🎨 PORTADA DEL REPORTE
    const addCoverPage = () => {
      addLogo();
      
      // Título principal
      doc.fontSize(28)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('REPORTE COMPLETO DE HITOS', margin, 150, { align: 'center' });
      
      // Información del reporte
      doc.fontSize(12)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`Total de Hitos: ${hitos.length}`, margin, 220, { align: 'center' })
         .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, 240, { align: 'center' });
    };

    // 🎨 FUNCIÓN PARA AGREGAR CADA HITO
    const addHitoToPDF = async (hito, index) => {
      if (index > 0) {
        doc.addPage();
      }
      
      let currentY = margin;
      
      // Título del hito
      doc.fontSize(16)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${hito.nombre}`, margin, currentY);
      
      currentY += 30;
      
      // Información básica
      const info = [
        `ID: ${hito.id}`,
        `Fecha Inicio: ${hito.fecha_inicio ? new Date(hito.fecha_inicio).toLocaleDateString('es-ES') : 'No especificada'}`,
        `Fecha Fin: ${hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES') : 'No especificada'}`,
        `Proyecto Origen: ${hito.proyecto_origen_nombre || 'Hito manual'}`
      ];
      
      info.forEach(item => {
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(item, margin, currentY);
        currentY += 15;
      });
      
      currentY += 10;
      
      // Descripción
      if (hito.descripcion) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('DESCRIPCIÓN:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.descripcion, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
           
        currentY = doc.y + 15;
      }
      
      // Impacto
      if (hito.impacto) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('IMPACTO:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.impacto, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
           
        currentY = doc.y + 15;
      }
      
      // Obtener usuarios y tareas
      try {
        const usuarios = await hitoModel.getHitoUsers(hito.id);
        const tareas = await hitoModel.getHitoTasks(hito.id);
        
        // Usuarios
        if (usuarios && usuarios.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('USUARIOS:', margin, currentY);
             
          currentY += 15;
          
          usuarios.forEach(usuario => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${usuario.nombre} (${usuario.email}) - ${usuario.rol}`, margin + 10, currentY);
            currentY += 12;
          });
          
          currentY += 10;
        }
        
        // Tareas
        if (tareas && tareas.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TAREAS:', margin, currentY);
             
          currentY += 15;
          
          tareas.forEach(tarea => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${tarea.nombre_tarea} - ${tarea.estado}`, margin + 10, currentY);
            currentY += 12;
          });
        }
      } catch (error) {
        console.error(`Error al obtener detalles del hito ${hito.id}:`, error);
      }
    };

    // 🚀 GENERAR EL PDF
    
    // Portada
    addCoverPage();
    
    // Agregar cada hito
    for (let i = 0; i < hitos.length; i++) {
      if (i === 0) {
        doc.addPage();
      }
      await addHitoToPDF(hitos[i], i);
    }
    
    // Finalizar documento
    doc.end();

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'EXPORTACIÓN_MASIVA',
        descripcion: `Exportación completa de ${hitos.length} hitos a PDF`,
        id_usuario: req.user?.id
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Esperar a que se complete la escritura del archivo
    stream.on('finish', () => {
      console.log('✅ PDF completo generado exitosamente');
      
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

    // Manejar errores
    stream.on('error', (err) => {
      console.error('Error al escribir el archivo PDF:', err);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF',
        error: err.message
      });
    });

  } catch (error) {
    console.error('❌ Error al exportar todos los hitos a PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar los hitos a PDF',
      error: error.message
    });
  }
};

// 📋 NUEVA FUNCIÓN: EXPORTAR TODOS LOS HITOS A PDF - REPORTE CONSOLIDADO
exports.exportAllHitosToPDF = async (req, res) => {
  try {
    console.log('📋 Iniciando exportación de todos los hitos...');

    // Obtener todos los hitos ordenados cronológicamente
    const hitos = await hitoModel.getHitos({});
    
    if (!hitos || hitos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay hitos disponibles para exportar' 
      });
    }

    console.log(`📊 Exportando ${hitos.length} hitos...`);

    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear nombre de archivo único
    const fileName = `reporte_hitos_completo_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    // 🎨 CONFIGURACIÓN DEL DOCUMENTO
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Reporte Completo de Hitos',
        Author: 'Sistema de Gestión de Hitos',
        Subject: 'Informe consolidado de todos los hitos',
        Creator: 'Bitácora System',
        Producer: 'PDFKit'
      }
    });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🎨 COLORES Y ESTILOS (reutilizando los del individual)
    const colors = {
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#334155',
      text: '#000000',
      lightGray: '#f8fafc',
      darkGray: '#475569'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // 🖼️ FUNCIÓN PARA LOGO (reutilizada del individual)
    const addLogo = () => {
      const logoPath = path.join(__dirname, '../assets/logo.png');
      
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, margin, { width: 50, height: 50 });
        } else {
          doc.fontSize(14)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TASKMANAGER', margin, margin + 15)
             .fontSize(8)
             .fillColor(colors.secondary)
             .font('Helvetica')
             .text('Sistema de Gestión', margin, margin + 35);
        }
      } catch (error) {
        doc.fontSize(14)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('TASKMANAGER', margin, margin + 15)
           .fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('Sistema de Gestión', margin, margin + 35);
      }
    };

    // 🎨 PORTADA DEL REPORTE
    const addCoverPage = () => {
      addLogo();
      
      // Título principal
      doc.fontSize(28)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('REPORTE COMPLETO DE HITOS', margin, 150, { align: 'center' });
      
      // Información del reporte
      doc.fontSize(12)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`Total de Hitos: ${hitos.length}`, margin, 220, { align: 'center' })
         .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, 240, { align: 'center' });
    };

    // 🎨 FUNCIÓN PARA AGREGAR CADA HITO
    const addHitoToPDF = async (hito, index) => {
      if (index > 0) {
        doc.addPage();
      }
      
      let currentY = margin;
      
      // Título del hito
      doc.fontSize(16)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${hito.nombre}`, margin, currentY);
      
      currentY += 30;
      
      // Información básica
      const info = [
        `ID: ${hito.id}`,
        `Fecha Inicio: ${hito.fecha_inicio ? new Date(hito.fecha_inicio).toLocaleDateString('es-ES') : 'No especificada'}`,
        `Fecha Fin: ${hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES') : 'No especificada'}`,
        `Proyecto Origen: ${hito.proyecto_origen_nombre || 'Hito manual'}`
      ];
      
      info.forEach(item => {
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(item, margin, currentY);
        currentY += 15;
      });
      
      currentY += 10;
      
      // Descripción
      if (hito.descripcion) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('DESCRIPCIÓN:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.descripcion, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
           
        currentY = doc.y + 15;
      }
      
      // Impacto
      if (hito.impacto) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('IMPACTO:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.impacto, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
           
        currentY = doc.y + 15;
      }
      
      // Obtener usuarios y tareas
      try {
        const usuarios = await hitoModel.getHitoUsers(hito.id);
        const tareas = await hitoModel.getHitoTasks(hito.id);
        
        // Usuarios
        if (usuarios && usuarios.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('USUARIOS:', margin, currentY);
             
          currentY += 15;
          
          usuarios.forEach(usuario => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${usuario.nombre} (${usuario.email}) - ${usuario.rol}`, margin + 10, currentY);
            currentY += 12;
          });
          
          currentY += 10;
        }
        
        // Tareas
        if (tareas && tareas.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TAREAS:', margin, currentY);
             
          currentY += 15;
          
          tareas.forEach(tarea => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${tarea.nombre_tarea} - ${tarea.estado}`, margin + 10, currentY);
            currentY += 12;
          });
        }
      } catch (error) {
        console.error(`Error al obtener detalles del hito ${hito.id}:`, error);
      }
    };

    // 🚀 GENERAR EL PDF
    
    // Portada
    addCoverPage();
    
    // Agregar cada hito
    for (let i = 0; i < hitos.length; i++) {
      if (i === 0) {
        doc.addPage();
      }
      await addHitoToPDF(hitos[i], i);
    }
    
    // Finalizar documento
    doc.end();

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'EXPORTACIÓN_MASIVA',
        descripcion: `Exportación completa de ${hitos.length} hitos a PDF`,
        id_usuario: req.user?.id
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Esperar a que se complete la escritura del archivo
    stream.on('finish', () => {
      console.log('✅ PDF completo generado exitosamente');
      
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

    // Manejar errores
    stream.on('error', (err) => {
      console.error('Error al escribir el archivo PDF:', err);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF',
        error: err.message
      });
    });

  } catch (error) {
    console.error('❌ Error al exportar todos los hitos a PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar los hitos a PDF',
      error: error.message
    });
  }
};

// 📋 EXPORTAR TODOS LOS HITOS A PDF - REPORTE CONSOLIDADO
exports.exportAllHitosToPDF = async (req, res) => {
  try {
    console.log('📋 Iniciando exportación de todos los hitos...');

    // Obtener todos los hitos ordenados cronológicamente
    const hitos = await hitoModel.getHitos({});
    
    if (!hitos || hitos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay hitos disponibles para exportar' 
      });
    }

    console.log(`📊 Exportando ${hitos.length} hitos...`);

    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear nombre de archivo único
    const fileName = `reporte_hitos_completo_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    // 🎨 CONFIGURACIÓN DEL DOCUMENTO
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Reporte Completo de Hitos',
        Author: 'Sistema de Gestión de Hitos',
        Subject: 'Informe consolidado de todos los hitos',
        Creator: 'Bitácora System',
        Producer: 'PDFKit'
      }
    });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🎨 COLORES Y ESTILOS (reutilizando los del individual)
    const colors = {
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#334155',
      text: '#000000',
      lightGray: '#f8fafc',
      darkGray: '#475569',
      success: '#16a34a',
      warning: '#eab308',
      danger: '#dc2626'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // 🖼️ FUNCIÓN PARA LOGO (reutilizada)
    const addLogo = () => {
      const logoPath = path.join(__dirname, '../assets/logo.png');
      
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, margin, { width: 50, height: 50 });
        } else {
          doc.fontSize(14)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TASKMANAGER', margin, margin + 15)
             .fontSize(8)
             .fillColor(colors.secondary)
             .font('Helvetica')
             .text('Sistema de Gestión', margin, margin + 35);
        }
      } catch (error) {
        doc.fontSize(14)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('TASKMANAGER', margin, margin + 15)
           .fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('Sistema de Gestión', margin, margin + 35);
      }
    };

    // 🎨 PORTADA DEL REPORTE
    const addCoverPage = () => {
      addLogo();
      
      // Título principal
      doc.fontSize(28)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('REPORTE COMPLETO', margin, 150, { align: 'center' });
         
      doc.fontSize(24)
         .fillColor(colors.darkGray)
         .text('DE HITOS', margin, 185, { align: 'center' });
      
      // Información del reporte
      const reportInfo = [
        `Total de Hitos: ${hitos.length}`,
        `Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`,
        `Hora: ${new Date().toLocaleTimeString('es-ES')}`
      ];
      
      let infoY = 280;
      reportInfo.forEach(info => {
        doc.fontSize(12)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text(info, margin, infoY, { align: 'center' });
        infoY += 25;
      });
      
      // Estadísticas rápidas
      const stats = getHitosStats(hitos);
      
      doc.fontSize(16)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('RESUMEN EJECUTIVO', margin, 400, { align: 'center' });
      
      let statsY = 430;
      Object.entries(stats).forEach(([key, value]) => {
        doc.fontSize(11)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(`${key}: ${value}`, margin + 50, statsY);
        statsY += 20;
      });
    };

    // 📊 FUNCIÓN PARA CALCULAR ESTADÍSTICAS
    const getHitosStats = (hitosData) => {
      const stats = {
        'Hitos activos': hitosData.filter(h => h.fecha_fin && new Date(h.fecha_fin) >= new Date()).length,
        'Hitos completados': hitosData.filter(h => h.fecha_fin && new Date(h.fecha_fin) < new Date()).length,
        'Hitos sin fecha fin': hitosData.filter(h => !h.fecha_fin).length,
        'Proyectos origen': [...new Set(hitosData.map(h => h.proyecto_origen_nombre).filter(Boolean))].length
      };
      return stats;
    };

    // 🎨 FUNCIÓN PARA AGREGAR HITO AL PDF
    const addHitoToPDF = async (hito, index) => {
      // Nueva página para cada hito (excepto el primero después de la portada)
      if (index > 0) {
        doc.addPage();
      }
      
      let currentY = margin;
      
      // Encabezado del hito
      doc.fontSize(18)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${hito.nombre}`, margin, currentY);
      
      currentY += 35;
      
      // ID y fechas
      doc.fontSize(10)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`ID: #${hito.id} | Creado: ${new Date(hito.fecha_creacion).toLocaleDateString('es-ES')}`, pageWidth - margin - 200, currentY - 25, { align: 'right' });
      
      // Información básica en cajas
      const infoBoxes = [
        { label: 'Fecha Inicio', value: hito.fecha_inicio ? new Date(hito.fecha_inicio).toLocaleDateString('es-ES') : 'No especificada' },
        { label: 'Fecha Fin', value: hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES') : 'No especificada' },
        { label: 'Proyecto Origen', value: hito.proyecto_origen_nombre || 'Hito manual' }
      ];
      
      const boxWidth = (contentWidth - 20) / 3;
      infoBoxes.forEach((box, i) => {
        const boxX = margin + (i * (boxWidth + 10));
        
        // Caja con fondo
        doc.rect(boxX, currentY, boxWidth, 40)
           .fillColor(colors.lightGray)
           .fill();
        
        // Label
        doc.fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica-Bold')
           .text(box.label, boxX + 5, currentY + 5);
        
        // Valor
        doc.fontSize(9)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(box.value, boxX + 5, currentY + 20, {
             width: boxWidth - 10,
             ellipsis: true
           });
      });
      
      currentY += 60;
      
      // Descripción
      if (hito.descripcion) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('DESCRIPCIÓN', margin, currentY);
        
        currentY += 20;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.descripcion, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
        
        currentY = doc.y + 20;
      }
      
      // Impacto
      if (hito.impacto) {
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('IMPACTO', margin, currentY);
        
        currentY += 20;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.impacto, margin, currentY, {
             width: contentWidth,
             lineGap: 3
           });
        
        currentY = doc.y + 20;
      }
      
      // Obtener usuarios y tareas del hito
      try {
        const usuarios = await hitoModel.getHitoUsers(hito.id);
        const tareas = await hitoModel.getHitoTasks(hito.id);
        
        // Usuarios (si hay)
        if (usuarios && usuarios.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('USUARIOS INVOLUCRADOS', margin, currentY);
          
          currentY += 20;
          
          usuarios.forEach(usuario => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${usuario.nombre} (${usuario.email}) - ${usuario.rol.toUpperCase()}`, margin + 10, currentY);
            currentY += 15;
          });
          
          currentY += 10;
        }
        
        // Tareas (si hay)
        if (tareas && tareas.length > 0) {
          doc.fontSize(12)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TAREAS ASOCIADAS', margin, currentY);
          
          currentY += 20;
          
          tareas.forEach((tarea, i) => {
            if (currentY > pageHeight - 100) {
              doc.addPage();
              currentY = margin;
            }
            
            doc.fontSize(10)
               .fillColor(colors.darkGray)
               .font('Helvetica-Bold')
               .text(`${i + 1}. ${tarea.nombre_tarea}`, margin + 10, currentY);
            
            currentY += 15;
            
            if (tarea.descripcion) {
              doc.fontSize(9)
                 .fillColor(colors.text)
                 .font('Helvetica')
                 .text(`   ${tarea.descripcion}`, margin + 10, currentY);
              currentY += 12;
            }
            
            doc.fontSize(8)
               .fillColor(colors.secondary)
               .font('Helvetica')
               .text(`   Estado: ${tarea.estado} | ${tarea.fecha_inicio ? new Date(tarea.fecha_inicio).toLocaleDateString('es-ES') : 'Sin fecha'} - ${tarea.fecha_fin ? new Date(tarea.fecha_fin).toLocaleDateString('es-ES') : 'Sin fecha'}`, margin + 10, currentY);
            
            currentY += 20;
          });
        }
      } catch (error) {
        console.error(`Error al obtener detalles del hito ${hito.id}:`, error);
      }
      
      // Línea separadora al final del hito
      doc.strokeColor(colors.lightGray)
         .lineWidth(1)
         .moveTo(margin, pageHeight - margin - 30)
         .lineTo(pageWidth - margin, pageHeight - margin - 30)
         .stroke();
      
      // Pie de página
      doc.fontSize(8)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`Página ${doc.pageNumber} | Hito ${index + 1} de ${hitos.length}`, margin, pageHeight - margin - 15, { align: 'right' });
    };

    // 🚀 GENERAR EL PDF
    
    // Portada
    addCoverPage();
    
    // Agregar cada hito
    for (let i = 0; i < hitos.length; i++) {
      doc.addPage();
      await addHitoToPDF(hitos[i], i);
    }
    
    // Finalizar documento
    doc.end();

    // Registrar evento
    try {
      await logEvento({
        tipo_evento: 'EXPORTACIÓN_MASIVA',
        descripcion: `Exportación completa de ${hitos.length} hitos a PDF`,
        id_usuario: req.user?.id
      });
    } catch (logError) {
      console.error('⚠️ Error al registrar evento:', logError.message);
    }

    // Esperar a que se complete la escritura del archivo
    stream.on('finish', () => {
      console.log('✅ PDF generado exitosamente');
      
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

    // Manejar errores
    stream.on('error', (err) => {
      console.error('Error al escribir el archivo PDF:', err);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF',
        error: err.message
      });
    });

  } catch (error) {
    console.error('❌ Error al exportar todos los hitos a PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar los hitos a PDF',
      error: error.message
    });
  }
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

    // 🎨 CONFIGURACIÓN MEJORADA DEL DOCUMENTO
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Reporte de Hito - ${hito.nombre}`,
        Author: 'Sistema de Gestión de Hitos',
        Subject: 'Informe detallado de hito',
        Creator: 'Bitácora System',
        Producer: 'PDFKit'
      }
    });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🎨 COLORES SOBRIOS Y PROFESIONALES
    const colors = {
      primary: '#1e293b',    // Azul oscuro
      secondary: '#64748b',  // Gris medio
      accent: '#334155',     // Gris azulado
      text: '#000000',       // Negro para texto
      lightGray: '#f8fafc',  // Gris muy claro para fondos
      darkGray: '#475569'    // Gris oscuro
    };

    // 📐 DIMENSIONES Y POSICIONES
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    // 🖼️ FUNCIÓN PARA AGREGAR LOGO (tamaño más pequeño y proporcional)
    const addLogo = () => {
      // 🔧 OPCIÓN 1: Logo desde archivo con tamaño reducido
      const logoPath = path.join(__dirname, '../assets/logo.png');
      
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, margin, { width: 50, height: 50 });
        } else {
          // 🔧 OPCIÓN 2: Logo de texto más sobrio
          doc.fontSize(14)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TASKMANAGER', margin, margin + 15)
             .fontSize(8)
             .fillColor(colors.secondary)
             .font('Helvetica')
             .text('Sistema de Gestión', margin, margin + 35);
        }
      } catch (error) {
        console.log('Logo no disponible, usando texto:', error.message);
        // Fallback a logo de texto sobrio
        doc.fontSize(14)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('TASKMANAGER', margin, margin + 15)
           .fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('Sistema de Gestión', margin, margin + 35);
      }
    };

    // 🎨 FUNCIÓN PARA ENCABEZADO PROFESIONAL
    const addHeader = () => {
      // Logo
      addLogo();
      
      // Información de la empresa (lado derecho)
      const headerRightX = pageWidth - margin - 200;
      doc.fontSize(10)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text('Fecha de generación:', headerRightX, margin + 10)
         .font('Helvetica-Bold')
         .fillColor(colors.text)
         .text(new Date().toLocaleDateString('es-ES', {
           year: 'numeric',
           month: 'long',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         }), headerRightX, margin + 25)
         .font('Helvetica')
         .fillColor(colors.secondary)
         .text('ID del Hito:', headerRightX, margin + 45)
         .font('Helvetica-Bold')
         .fillColor(colors.primary)
         .text(`#${hitoId}`, headerRightX + 60, margin + 45);

      // Línea separadora más sutil
      doc.strokeColor(colors.primary)
         .lineWidth(2)
         .moveTo(margin, margin + 75)
         .lineTo(pageWidth - margin, margin + 75)
         .stroke();
    };

    // 🎨 FUNCIÓN PARA TÍTULOS CON ESTILO
    const addStyledTitle = (title, y, options = {}) => {
      const fontSize = options.fontSize || 20;
      const color = options.color || colors.primary;
      const moveDown = options.moveDown !== false;
      
      doc.fontSize(fontSize)
         .fillColor(color)
         .font('Helvetica-Bold')
         .text(title, margin, y, { align: options.align || 'center' });
         
      if (moveDown) {
        doc.moveDown(0.5);
      }
      
      return doc.y;
    };

    // 🎨 FUNCIÓN PARA SECCIONES CON FONDO
    const addSection = (title, content, y) => {
      const sectionHeight = 25;
      
      // Fondo de la sección
      doc.rect(margin, y, contentWidth, sectionHeight)
         .fillColor(colors.lightGray)
         .fill();
      
      // Título de la sección
      doc.fontSize(12)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(title, margin + 10, y + 8);
      
      // Contenido
      const contentY = y + sectionHeight + 10;
      doc.fontSize(10)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(content, margin + 10, contentY, { 
           width: contentWidth - 20,
           lineGap: 3
         });
      
      return doc.y + 15; // Retornar nueva posición Y
    };

    // 🎨 FUNCIÓN PARA TABLAS ESTILIZADAS
    const addStyledTable = (title, data, y) => {
      let currentY = y;
      
      // Título de la tabla
      doc.fontSize(12)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(title, margin, currentY);
      
      currentY += 25;
      
      if (data.length === 0) {
        doc.fontSize(10)
           .fillColor(colors.secondary)
           .font('Helvetica-Oblique')
           .text('No hay información disponible', margin + 10, currentY);
        return currentY + 20;
      }
      
      // Cabecera de la tabla
      const rowHeight = 25;
      
      // Fondo de cabecera
      doc.rect(margin, currentY, contentWidth, rowHeight)
         .fillColor(colors.primary)
         .fill();
      
      data.forEach((item, index) => {
        const rowY = currentY + (index * rowHeight);
        
        // Fondo alternado
        if (index > 0 && index % 2 === 0) {
          doc.rect(margin, rowY, contentWidth, rowHeight)
             .fillColor(colors.lightGray)
             .fill();
        }
        
        // Texto del elemento
        doc.fontSize(9)
           .fillColor(index === 0 ? 'white' : colors.text)
           .font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
           .text(item.text || item, margin + 10, rowY + 8, {
             width: contentWidth - 20,
             ellipsis: true
           });
      });
      
      return currentY + (data.length * rowHeight) + 15;
    };

    // 🎨 GENERAR CONTENIDO DEL PDF
    
    // Encabezado
    addHeader();
    
    let currentY = margin + 90;
    
    // Título principal del hito
    currentY = addStyledTitle('INFORME DE HITO', currentY, { fontSize: 22 });
    currentY = addStyledTitle(hito.nombre, currentY, { 
      fontSize: 16, 
      color: colors.darkGray,
      moveDown: true 
    });
    
    currentY += 20;
    
    // Información general
    const infoGeneral = [
      `Fecha de inicio: ${hito.fecha_inicio ? new Date(hito.fecha_inicio).toLocaleDateString('es-ES') : 'No especificada'}`,
      `Fecha de finalización: ${hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES') : 'No especificada'}`,
      `Proyecto origen: ${hito.proyecto_origen_nombre || 'Ninguno (hito manual)'}`,
      `Usuarios involucrados: ${usuarios.length}`,
      `Tareas asociadas: ${tareas.length}`
    ].join('\n\n');
    
    currentY = addSection('INFORMACIÓN GENERAL', infoGeneral, currentY);
    
    // Descripción
    if (hito.descripcion) {
      currentY = addSection('DESCRIPCIÓN', hito.descripcion, currentY);
    }
    
    // Impacto
    if (hito.impacto) {
      currentY = addSection('IMPACTO', hito.impacto, currentY);
    }
    
    // Nueva página si es necesario
    if (currentY > pageHeight - 200) {
      doc.addPage();
      currentY = margin;
    }
    
    // Usuarios involucrados
    const usuariosData = usuarios.length > 0 
      ? [{ text: 'Usuario - Email - Rol' }, ...usuarios.map(u => `${u.nombre} - ${u.email} - ${u.rol.toUpperCase()}`)]
      : [];
    
    currentY = addStyledTable('USUARIOS INVOLUCRADOS', usuariosData, currentY);
    
    // Tareas relacionadas
    if (tareas.length > 0) {
      currentY += 10;
      
      doc.fontSize(12)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('TAREAS RELACIONADAS', margin, currentY);
      
      currentY += 25;
      
      tareas.forEach((tarea, index) => {
        // Verificar si necesitamos nueva página
        if (currentY > pageHeight - 150) {
          doc.addPage();
          currentY = margin;
        }
        
        // Caja para cada tarea con bordes más sutiles
        const taskBoxHeight = 80;
        
        doc.rect(margin, currentY, contentWidth, taskBoxHeight)
           .strokeColor(colors.lightGray)
           .lineWidth(1)
           .stroke();
        
        // Contenido de la tarea
        doc.fontSize(11)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${tarea.nombre_tarea}`, margin + 10, currentY + 10);
        
        doc.fontSize(9)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(`Descripción: ${tarea.descripcion || 'Sin descripción'}`, margin + 10, currentY + 28)
           .text(`Estado: ${tarea.estado}`, margin + 10, currentY + 45)
           .text(`Período: ${tarea.fecha_inicio ? new Date(tarea.fecha_inicio).toLocaleDateString('es-ES') : 'N/A'} - ${tarea.fecha_fin ? new Date(tarea.fecha_fin).toLocaleDateString('es-ES') : 'N/A'}`, margin + 10, currentY + 60);
        
        currentY += taskBoxHeight + 10;
      });
    }
    
    // Pie de página con texto personalizado
    const addFooter = () => {
      const footerY = pageHeight - margin - 30;
      
      // Línea separadora más sutil
      doc.strokeColor(colors.lightGray)
         .lineWidth(1)
         .moveTo(margin, footerY)
         .lineTo(pageWidth - margin, footerY)
         .stroke();
      
      // Texto del pie personalizado
      doc.fontSize(8)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text('Informe generado por TaskManager', margin, footerY + 10)
         .text(`Página 1 | ${new Date().toLocaleString('es-ES')}`, margin, footerY + 20, { align: 'right' });
    };
    
    addFooter();
    
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