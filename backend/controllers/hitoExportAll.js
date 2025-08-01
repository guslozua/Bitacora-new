// Imports necesarios
const hitoModel = require('../models/HitoModel');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 📋 EXPORTAR TODOS LOS HITOS A PDF - REPORTE CONSOLIDADO MEJORADO
exports.exportAllHitosToPDF = async (req, res) => {
  try {
    console.log('📋 Iniciando exportación de todos los hitos...');

    // Obtener todos los hitos ordenados cronológicamente (más antiguos primero)
    const hitos = await hitoModel.getHitos({});
    
    if (!hitos || hitos.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No hay hitos disponibles para exportar' 
      });
    }

    // Ordenar hitos cronológicamente (más antiguos primero)
    hitos.sort((a, b) => {
      const fechaA = new Date(a.fecha_inicio || a.fecha_creacion || '1970-01-01');
      const fechaB = new Date(b.fecha_inicio || b.fecha_creacion || '1970-01-01');
      return fechaA.getTime() - fechaB.getTime();
    });

    console.log(`📊 Exportando ${hitos.length} hitos ordenados cronológicamente...`);

    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crear nombre de archivo único
    const fileName = `reporte_ejecutivo_hitos_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    // 🎨 CONFIGURACIÓN DEL DOCUMENTO PROFESIONAL
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Reporte Ejecutivo de Hitos',
        Author: 'Sistema de Gestión de Proyectos',
        Subject: 'Informe consolidado y análisis de hitos',
        Creator: 'TaskManager Pro',
        Producer: 'PDFKit Professional'
      }
    });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🎨 COLORES PROFESIONALES
    const colors = {
      primary: '#1e293b',      // Azul oscuro profesional
      secondary: '#64748b',    // Gris medio
      accent: '#3b82f6',       // Azul vibrante
      success: '#16a34a',      // Verde
      warning: '#eab308',      // Amarillo
      danger: '#dc2626',       // Rojo
      text: '#000000',         // Negro
      lightGray: '#f8fafc',    // Gris muy claro
      darkGray: '#475569',     // Gris oscuro
      white: '#ffffff'
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // 🖼️ FUNCIÓN PARA LOGO PROFESIONAL (igual que los individuales)
    const addLogo = (x = margin, y = margin) => {
      const logoPath = path.join(__dirname, '../assets/logo.png');
      
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, x, y, { width: 50, height: 50 });
        } else {
          // Logo de texto con estilo profesional
          doc.fontSize(14)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('TASKMANAGER', x, y + 15)
             .fontSize(8)
             .fillColor(colors.secondary)
             .font('Helvetica')
             .text('Sistema de Gestión', x, y + 35);
        }
      } catch (error) {
        // Fallback al logo de texto
        doc.fontSize(14)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('TASKMANAGER', x, y + 15)
           .fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('Sistema de Gestión', x, y + 35);
      }
    };

    // 📊 FUNCIÓN PARA CALCULAR ESTADÍSTICAS
    const calculateStats = () => {
      const now = new Date();
      const stats = {
        total: hitos.length,
        activos: hitos.filter(h => {
          if (!h.fecha_fin) return true;
          return new Date(h.fecha_fin) >= now;
        }).length,
        completados: hitos.filter(h => {
          if (!h.fecha_fin) return false;
          return new Date(h.fecha_fin) < now;
        }).length,
        sinFechaFin: hitos.filter(h => !h.fecha_fin).length,
        conProyectoOrigen: hitos.filter(h => h.proyecto_origen_nombre).length,
        manuales: hitos.filter(h => !h.proyecto_origen_nombre).length,
        porMes: {}
      };
      
      // Agrupar por mes
      hitos.forEach(hito => {
        const fecha = new Date(hito.fecha_inicio || hito.fecha_creacion);
        const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        stats.porMes[mesAno] = (stats.porMes[mesAno] || 0) + 1;
      });
      
      return stats;
    };

    // 📊 FUNCIÓN PARA CREAR GRÁFICO SIMPLE DE BARRAS
    const drawBarChart = (x, y, width, height, data, title) => {
      const maxValue = Math.max(...Object.values(data));
      const barWidth = width / Object.keys(data).length;
      
      // Título del gráfico
      doc.fontSize(10)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(title, x, y - 15);
      
      // Marco del gráfico
      doc.rect(x, y, width, height)
         .strokeColor(colors.lightGray)
         .stroke();
      
      // Barras
      Object.entries(data).forEach(([key, value], index) => {
        const barHeight = (value / maxValue) * (height - 20);
        const barX = x + (index * barWidth) + 5;
        const barY = y + height - barHeight - 10;
        
        // Barra
        doc.rect(barX, barY, barWidth - 10, barHeight)
           .fillColor(colors.accent)
           .fill();
        
        // Valor encima de la barra
        doc.fontSize(8)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(value.toString(), barX + (barWidth - 10) / 2 - 5, barY - 15);
        
        // Etiqueta del mes
        doc.fontSize(7)
           .fillColor(colors.secondary)
           .text(key.substring(5), barX, y + height + 5, {
             width: barWidth - 10,
             align: 'center'
           });
      });
    };

    // 🎨 PORTADA EJECUTIVA CON ESTADÍSTICAS
    const addExecutiveCoverPage = () => {
      // Logo en la esquina superior izquierda
      addLogo();
      
      // Información de la empresa en la esquina superior derecha
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
         }), headerRightX, margin + 25);

      // Línea separadora profesional
      doc.strokeColor(colors.primary)
         .lineWidth(3)
         .moveTo(margin, margin + 75)
         .lineTo(pageWidth - margin, margin + 75)
         .stroke();
      
      // Título principal
      doc.fontSize(32)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('REPORTE EJECUTIVO', margin, 130, { align: 'center' });
         
      doc.fontSize(28)
         .fillColor(colors.accent)
         .text('DE HITOS', margin, 170, { align: 'center' });
      
      // Subtítulo
      doc.fontSize(14)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text('Análisis Consolidado y Estadísticas', margin, 210, { align: 'center' });
      
      // Calcular estadísticas
      const stats = calculateStats();
      
      // Caja de estadísticas principales
      const statsY = 260;
      const statBoxWidth = (contentWidth - 30) / 4;
      
      const mainStats = [
        { label: 'Total Hitos', value: stats.total, color: colors.primary },
        { label: 'Activos', value: stats.activos, color: colors.success },
        { label: 'Completados', value: stats.completados, color: colors.accent },
        { label: 'Sin Fecha Fin', value: stats.sinFechaFin, color: colors.warning }
      ];
      
      mainStats.forEach((stat, index) => {
        const boxX = margin + (index * (statBoxWidth + 10));
        
        // Caja con sombra
        doc.rect(boxX + 2, statsY + 2, statBoxWidth, 80)
           .fillColor('#00000020')
           .fill();
           
        doc.rect(boxX, statsY, statBoxWidth, 80)
           .fillColor(colors.white)
           .fill()
           .strokeColor(stat.color)
           .lineWidth(2)
           .stroke();
        
        // Valor grande
        doc.fontSize(28)
           .fillColor(stat.color)
           .font('Helvetica-Bold')
           .text(stat.value.toString(), boxX, statsY + 15, {
             width: statBoxWidth,
             align: 'center'
           });
        
        // Label
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(stat.label, boxX, statsY + 55, {
             width: statBoxWidth,
             align: 'center'
           });
      });
      
      // Estadísticas adicionales
      const additionalStatsY = 370;
      doc.fontSize(14)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('DISTRIBUCIÓN DE HITOS', margin, additionalStatsY);
      
      const additionalStats = [
        `• Hitos con Proyecto Origen: ${stats.conProyectoOrigen} (${Math.round((stats.conProyectoOrigen/stats.total)*100)}%)`,
        `• Hitos Manuales: ${stats.manuales} (${Math.round((stats.manuales/stats.total)*100)}%)`,
        `• Período de análisis: ${Object.keys(stats.porMes).length} meses`,
        `• Promedio de hitos por mes: ${Math.round(stats.total / Math.max(Object.keys(stats.porMes).length, 1))}`
      ];
      
      let currentY = additionalStatsY + 25;
      additionalStats.forEach(stat => {
        doc.fontSize(11)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(stat, margin + 20, currentY);
        currentY += 20;
      });
      
      // Gráfico de hitos por mes (últimos 6 meses)
      if (Object.keys(stats.porMes).length > 0) {
        const chartY = 500;
        const recentMonths = Object.entries(stats.porMes)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6);
        
        if (recentMonths.length > 0) {
          const chartData = Object.fromEntries(recentMonths);
          drawBarChart(margin, chartY, contentWidth, 100, chartData, 'HITOS POR MES (Últimos 6 meses)');
        }
      }
      
      // Pie de página de portada
      doc.fontSize(10)
         .fillColor(colors.secondary)
         .font('Helvetica-Oblique')
         .text('Generado automáticamente por TaskManager Pro', margin, pageHeight - 100, {
           width: contentWidth,
           align: 'center'
         });
    };

    // 🎨 FUNCIÓN PARA AGREGAR CADA HITO (continuo, no una página por hito)
    const addHitoToPDF = async (hito, index, currentY) => {
      const hitoHeight = 200; // Altura estimada por hito
      
      // Verificar si necesitamos nueva página
      if (currentY + hitoHeight > pageHeight - margin - 50) {
        doc.addPage();
        currentY = margin;
      }
      
      // Línea separadora entre hitos (excepto el primero)
      if (index > 0) {
        doc.strokeColor(colors.lightGray)
           .lineWidth(1)
           .moveTo(margin, currentY)
           .lineTo(pageWidth - margin, currentY)
           .stroke();
        currentY += 15;
      }
      
      // Número y título del hito
      doc.fontSize(16)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${hito.nombre}`, margin, currentY);
      
      currentY += 25;
      
      // Información básica en formato de tabla
      const infoData = [
        ['ID:', `#${hito.id}`],
        ['Fecha Inicio:', hito.fecha_inicio ? new Date(hito.fecha_inicio).toLocaleDateString('es-ES') : 'No especificada'],
        ['Fecha Fin:', hito.fecha_fin ? new Date(hito.fecha_fin).toLocaleDateString('es-ES') : 'No especificada'],
        ['Proyecto Origen:', hito.proyecto_origen_nombre || 'Hito manual'],
        ['Estado:', hito.fecha_fin && new Date(hito.fecha_fin) < new Date() ? 'Completado' : 'Activo']
      ];
      
      infoData.forEach(([label, value]) => {
        doc.fontSize(10)
           .fillColor(colors.secondary)
           .font('Helvetica-Bold')
           .text(label, margin, currentY, { continued: true })
           .fillColor(colors.text)
           .font('Helvetica')
           .text(` ${value}`);
        currentY += 15;
      });
      
      currentY += 5;
      
      // Descripción
      if (hito.descripcion) {
        doc.fontSize(11)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('DESCRIPCIÓN:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.descripcion, margin + 10, currentY, {
             width: contentWidth - 10,
             lineGap: 2
           });
           
        currentY = doc.y + 10;
      }
      
      // Impacto
      if (hito.impacto) {
        doc.fontSize(11)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('IMPACTO:', margin, currentY);
           
        currentY += 15;
        
        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(hito.impacto, margin + 10, currentY, {
             width: contentWidth - 10,
             lineGap: 2
           });
           
        currentY = doc.y + 10;
      }
      
      // Obtener y mostrar usuarios
      try {
        const usuarios = await hitoModel.getHitoUsers(hito.id);
        
        if (usuarios && usuarios.length > 0) {
          doc.fontSize(11)
             .fillColor(colors.primary)
             .font('Helvetica-Bold')
             .text('EQUIPO ASIGNADO:', margin, currentY);
             
          currentY += 15;
          
          usuarios.forEach(usuario => {
            doc.fontSize(9)
               .fillColor(colors.text)
               .font('Helvetica')
               .text(`• ${usuario.nombre} (${usuario.email}) - ${usuario.rol.toUpperCase()}`, margin + 10, currentY);
            currentY += 12;
          });
          
          currentY += 5;
        }
      } catch (error) {
        console.error(`Error al obtener usuarios del hito ${hito.id}:`, error);
      }
      
      return currentY + 20; // Espacio adicional después del hito
    };

    // 🚀 GENERAR EL PDF MEJORADO
    
    // 1. Portada ejecutiva con estadísticas
    addExecutiveCoverPage();
    
    // 2. Nueva página para el contenido de hitos
    doc.addPage();
    
    // Encabezado de la sección de hitos
    addLogo(margin, margin);
    
    doc.fontSize(20)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('DETALLE DE HITOS', margin, margin + 60);
    
    doc.fontSize(12)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text(`${hitos.length} hitos ordenados cronológicamente`, margin, margin + 90);
    
    // Línea separadora
    doc.strokeColor(colors.primary)
       .lineWidth(2)
       .moveTo(margin, margin + 110)
       .lineTo(pageWidth - margin, margin + 110)
       .stroke();
    
    let currentY = margin + 130;
    
    // 3. Agregar todos los hitos de forma continua
    for (let i = 0; i < hitos.length; i++) {
      currentY = await addHitoToPDF(hitos[i], i, currentY);
    }
    
    // Finalizar documento
    doc.end();

    // Esperar a que se complete la escritura del archivo
    stream.on('finish', () => {
      console.log('✅ PDF ejecutivo generado exitosamente');
      
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
