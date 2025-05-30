// controllers/guardias.controller.js - VERSIÓN COMPLETA ACTUALIZADA
const Guardia = require('../models/guardia.model');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { Op } = require('../models/db.operators');

// Función auxiliar para formatear fechas de manera legible
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Obtener todas las guardias
exports.getGuardias = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let whereClause = {};
    
    // Aplicar filtro de fechas si se proporciona
    if (desde && hasta) {
      whereClause.fecha = {
        [Op.between]: [new Date(desde), new Date(hasta)]
      };
    } else if (desde) {
      whereClause.fecha = {
        [Op.gte]: new Date(desde)
      };
    } else if (hasta) {
      whereClause.fecha = {
        [Op.lte]: new Date(hasta)
      };
    }
    
    const guardias = await Guardia.findAll({
      where: whereClause,
      order: [['fecha', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: guardias
    });
  } catch (error) {
    console.error('Error al obtener guardias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener guardias',
      error: error.message
    });
  }
};

// Obtener una guardia por ID
exports.getGuardiaById = async (req, res) => {
  try {
    const guardia = await Guardia.findByPk(req.params.id);
    
    if (!guardia) {
      return res.status(404).json({
        success: false,
        message: 'Guardia no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: guardia
    });
  } catch (error) {
    console.error('Error al obtener guardia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener guardia',
      error: error.message
    });
  }
};

// Crear una nueva guardia
exports.createGuardia = async (req, res) => {
  try {
    const { fecha, usuario, notas } = req.body;
    
    // CAMBIO: Verificar si ya existe una guardia con la misma fecha Y usuario
    const existingGuardia = await Guardia.findOne({
      where: { 
        fecha: new Date(fecha),
        usuario: usuario.trim() // Comparar también por usuario
      }
    });
    
    if (existingGuardia) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una guardia asignada para ${usuario.trim()} en la fecha ${fecha}`
      });
    }
    
    const nuevaGuardia = await Guardia.create({
      fecha,
      usuario: usuario.trim(),
      notas: notas || ''
    });
    
    res.status(201).json({
      success: true,
      data: nuevaGuardia,
      message: 'Guardia creada correctamente'
    });
  } catch (error) {
    console.error('Error al crear guardia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear guardia',
      error: error.message
    });
  }
};

// Actualizar una guardia existente
exports.updateGuardia = async (req, res) => {
  try {
    const { fecha, usuario, notas } = req.body;
    const guardia = await Guardia.findByPk(req.params.id);
    
    if (!guardia) {
      return res.status(404).json({
        success: false,
        message: 'Guardia no encontrada'
      });
    }
    
    // Si la fecha o usuario cambian, verificar que no haya conflicto
    if ((fecha && new Date(fecha).toISOString() !== new Date(guardia.fecha).toISOString()) ||
        (usuario && usuario.trim() !== guardia.usuario.trim())) {
      
      const existingGuardia = await Guardia.findOne({
        where: { 
          fecha: new Date(fecha || guardia.fecha),
          usuario: (usuario || guardia.usuario).trim(),
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingGuardia) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una guardia asignada para ${(usuario || guardia.usuario).trim()} en la fecha ${fecha || guardia.fecha}`
        });
      }
    }
    
    // Actualizar campos directamente en la instancia
    const updatedGuardia = await guardia.update({
      fecha: fecha || guardia.fecha,
      usuario: (usuario || guardia.usuario).trim(),
      notas: notas !== undefined ? notas : guardia.notas
    });
    
    res.status(200).json({
      success: true,
      data: updatedGuardia,
      message: 'Guardia actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar guardia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar guardia',
      error: error.message
    });
  }
};

// Eliminar una guardia
exports.deleteGuardia = async (req, res) => {
  try {
    const guardia = await Guardia.findByPk(req.params.id);
    
    if (!guardia) {
      return res.status(404).json({
        success: false,
        message: 'Guardia no encontrada'
      });
    }
    
    await guardia.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Guardia eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar guardia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar guardia',
      error: error.message
    });
  }
};

// Importar guardias desde archivo Excel - VERSIÓN MEJORADA CON MENSAJES CLAROS
exports.importGuardias = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }
    
    const filePath = req.file.path;
    const guardiasImportadas = [];
    let errores = [];
    let guardiasOmitidas = 0;
    
    console.log(`Procesando archivo: ${req.file.originalname}`);
    
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      const mesesHojas = workbook.worksheets.filter(sheet => 
        nombresMeses.includes(sheet.name)
      );
      
      const mesesNumeros = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
        'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
        'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
      };
      
      for (const worksheet of mesesHojas) {
        const mes = worksheet.name;
        console.log(`\nProcesando mes: ${mes}`);
        
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
          const rowData = [];
          row.eachCell((cell, colNumber) => {
            rowData[colNumber - 1] = cell.value;
          });
          rows[rowNumber - 1] = rowData;
        });
        
        for (let i = 0; i < rows.length - 1; i++) {
          const currentRow = rows[i];
          const nextRow = rows[i + 1];
          
          if (!currentRow || !nextRow) continue;
          
          const containsExcelDates = currentRow.some(cell => 
            cell instanceof Date || 
            (cell && typeof cell === 'object' && cell.t === 'd') ||
            (typeof cell === 'number' && cell > 40000 && cell < 50000)
          );
          
          if (containsExcelDates) {
            const nextRowHasNames = nextRow.some(cell => 
              typeof cell === 'string' || 
              (cell && typeof cell === 'object' && cell.text && cell.text.length > 1)
            );
            
            if (nextRowHasNames) {
              for (let j = 0; j < Math.min(currentRow.length, nextRow.length); j++) {
                const cellFecha = currentRow[j];
                const cellNombre = nextRow[j];
                
                let fechaJS = null;
                
                // Procesamiento de fechas (mantener lógica actual)
                if (cellFecha instanceof Date) {
                  fechaJS = new Date(cellFecha);
                  fechaJS.setDate(fechaJS.getDate() + 1);
                } else if (cellFecha && typeof cellFecha === 'object' && cellFecha.result) {
                  fechaJS = new Date(cellFecha.result);
                  fechaJS.setDate(fechaJS.getDate() + 1);
                } else if (typeof cellFecha === 'number' && cellFecha > 40000 && cellFecha < 50000) {
                  const date = new Date(1900, 0, 1);
                  date.setDate(date.getDate() + Math.floor(cellFecha) - 1);
                  
                  if (cellFecha > 60) {
                    date.setDate(date.getDate() - 1);
                  }
                  
                  date.setDate(date.getDate() + 1);
                  fechaJS = date;
                }
                
                // Procesamiento de nombres (mantener lógica actual)
                let nombre = null;
                if (typeof cellNombre === 'string') {
                  nombre = cellNombre;
                } else if (cellNombre && typeof cellNombre === 'object') {
                  if (cellNombre.text) {
                    nombre = cellNombre.text;
                  } else if (cellNombre.result) {
                    nombre = cellNombre.result.toString();
                  } else if (cellNombre.richText) {
                    nombre = cellNombre.richText.map(rt => rt.text).join('');
                  }
                }
                
                // Validaciones mejoradas
                if (fechaJS && fechaJS instanceof Date && !isNaN(fechaJS.getTime())) {
                  
                  // VALIDACIÓN 1: Verificar que el nombre no esté vacío
                  if (!nombre || nombre.trim() === '') {
                    errores.push(`Fila ${i + 2}, Columna ${j + 1}: Se encontró una fecha (${formatearFecha(fechaJS)}) pero no hay nombre de usuario asignado`);
                    continue;
                  }
                  
                  const usuarioLimpio = nombre.trim();
                  const fechaFormateada = fechaJS.toISOString().split('T')[0];
                  
                  // VALIDACIÓN 2: Verificar que el nombre tenga al menos 2 caracteres
                  if (usuarioLimpio.length < 2) {
                    errores.push(`Fila ${i + 2}: El nombre "${usuarioLimpio}" es demasiado corto para la fecha ${formatearFecha(fechaJS)}`);
                    continue;
                  }
                  
                  try {
                    // VALIDACIÓN 3: Verificar duplicados
                    const existeGuardia = await Guardia.findOne({
                      where: { 
                        fecha: fechaJS,
                        usuario: usuarioLimpio
                      }
                    });
                    
                    if (existeGuardia) {
                      guardiasOmitidas++;
                      errores.push(`✓ Guardia omitida: ${usuarioLimpio} ya tiene asignada la guardia del ${formatearFecha(fechaJS)}`);
                    } else {
                      // Crear nueva guardia
                      const nuevaGuardia = await Guardia.create({
                        fecha: fechaJS,
                        usuario: usuarioLimpio,
                        notas: `Importado desde Excel - ${mes} 2025`
                      });
                      
                      guardiasImportadas.push(nuevaGuardia);
                      console.log(`✅ Guardia creada: ${usuarioLimpio} - ${fechaFormateada}`);
                    }
                  } catch (error) {
                    // MANEJO DE ERRORES MEJORADO
                    let mensajeError = '';
                    
                    if (error.code === 'ER_DUP_ENTRY') {
                      mensajeError = `Guardia duplicada: ${usuarioLimpio} ya está asignado para el ${formatearFecha(fechaJS)}`;
                      guardiasOmitidas++;
                    } else if (error.message.includes('usuario is not defined')) {
                      mensajeError = `Error en fila ${i + 2}: El nombre de usuario no es válido para la fecha ${formatearFecha(fechaJS)}`;
                    } else if (error.message.includes('fecha')) {
                      mensajeError = `Error en fila ${i + 2}: La fecha ${formatearFecha(fechaJS)} no es válida`;
                    } else {
                      mensajeError = `Error al procesar guardia de ${usuarioLimpio || 'usuario desconocido'} para el ${formatearFecha(fechaJS)}: ${error.message}`;
                    }
                    
                    errores.push(mensajeError);
                    console.error(`❌ ${mensajeError}`);
                  }
                }
              }
            }
          }
        }
      }
      
      // Eliminar archivo temporal
      fs.unlinkSync(filePath);
      
      // RESPUESTA MEJORADA
      let mensaje = '';
      let estadoExito = true;
      
      if (guardiasImportadas.length > 0 && guardiasOmitidas === 0 && errores.length === 0) {
        mensaje = `¡Perfecto! Se importaron ${guardiasImportadas.length} guardias correctamente sin ningún problema.`;
      } else if (guardiasImportadas.length > 0 && (guardiasOmitidas > 0 || errores.length > 0)) {
        mensaje = `Importación completada: ${guardiasImportadas.length} guardias nuevas creadas`;
        if (guardiasOmitidas > 0) {
          mensaje += `, ${guardiasOmitidas} guardias omitidas por estar duplicadas`;
        }
        if (errores.length > guardiasOmitidas) {
          mensaje += `, ${errores.length - guardiasOmitidas} errores encontrados`;
        }
      } else if (guardiasImportadas.length === 0 && guardiasOmitidas > 0) {
        mensaje = `Todas las guardias del archivo ya existen en el sistema (${guardiasOmitidas} guardias omitidas)`;
        estadoExito = true; // No es un error, simplemente no había nada nuevo que importar
      } else {
        mensaje = `No se pudieron importar guardias. Se encontraron ${errores.length} errores`;
        estadoExito = false;
      }
      
      res.status(estadoExito ? 200 : 400).json({
        success: estadoExito,
        message: mensaje,
        errors: errores.length > 0 ? errores : null,
        totalImportadas: guardiasImportadas.length,
        totalErrores: errores.length - guardiasOmitidas, // Errores reales, sin contar omisiones
        totalOmitidas: guardiasOmitidas,
        resumen: {
          guardiasNuevas: guardiasImportadas.length,
          guardiasDuplicadas: guardiasOmitidas,
          erroresReales: errores.length - guardiasOmitidas,
          archivoOriginal: req.file.originalname
        }
      });
      
    } catch (excelError) {
      console.error('Error al procesar el archivo Excel:', excelError);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.status(400).json({
        success: false,
        message: 'Error al procesar el archivo Excel. Verifique que el archivo tenga el formato correcto.',
        error: excelError.message,
        errors: [`Error de archivo: ${excelError.message}`],
        totalImportadas: 0,
        totalErrores: 1,
        totalOmitidas: 0
      });
    }
  } catch (error) {
    console.error('Error general al importar guardias:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la importación',
      error: error.message,
      totalImportadas: 0,
      totalErrores: 1,
      totalOmitidas: 0
    });
  }
};

module.exports = exports;