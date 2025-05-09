// controllers/guardias.controller.js
const Guardia = require('../models/guardia.model');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { Op } = require('../models/db.operators');

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
    
    // Verificar si ya existe una guardia en esa fecha
    const existingGuardia = await Guardia.findOne({
      where: { fecha: new Date(fecha) }
    });
    
    if (existingGuardia) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una guardia asignada para esta fecha'
      });
    }
    
    const nuevaGuardia = await Guardia.create({
      fecha,
      usuario,
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
    
    // Si la fecha cambia, verificar que no haya conflicto
    if (fecha && new Date(fecha).toISOString() !== new Date(guardia.fecha).toISOString()) {
      const existingGuardia = await Guardia.findOne({
        where: { 
          fecha: new Date(fecha),
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingGuardia) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una guardia asignada para esta fecha'
        });
      }
    }
    
    // Actualizar campos directamente en la instancia
    const updatedGuardia = await guardia.update({
      fecha: fecha || guardia.fecha,
      usuario: usuario || guardia.usuario,
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

// Importar guardias desde archivo Excel usando ExcelJS
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
    
    console.log(`Procesando archivo: ${req.file.originalname}`);
    
    try {
      // Leer el archivo Excel usando ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      console.log(`Archivo cargado. Número de hojas: ${workbook.worksheets.length}`);
      
      // Nombres de meses para filtrar
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      
      // Filtrar para procesar solo hojas que son nombres de meses
      const mesesHojas = workbook.worksheets.filter(sheet => 
        nombresMeses.includes(sheet.name)
      );
      
      console.log(`Hojas de meses encontradas: ${mesesHojas.map(sheet => sheet.name).join(', ')}`);
      
      // Mapeo de nombres de mes a números
      const mesesNumeros = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
        'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
        'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
      };
      
      // Procesar cada hoja mensual
      for (const worksheet of mesesHojas) {
        const mes = worksheet.name;
        const mesNumero = mesesNumeros[mes];
        const anio = 2025; // Año fijo del cronograma
        
        console.log(`\nProcesando mes: ${mes} (${mesNumero}/${anio})`);
        
        // Extraer todas las filas
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
          const rowData = [];
          row.eachCell((cell, colNumber) => {
            rowData[colNumber - 1] = cell.value;
          });
          rows[rowNumber - 1] = rowData;
        });
        
        console.log(`  Filas extraídas: ${rows.length}`);
        
        // Buscar filas que contienen fechas y nombres
        for (let i = 0; i < rows.length - 1; i++) {
          const currentRow = rows[i];
          const nextRow = rows[i + 1];
          
          if (!currentRow || !nextRow) continue;
          
          // Verificar si la fila actual contiene fechas (objetos Date de ExcelJS)
          const containsExcelDates = currentRow.some(cell => 
            cell instanceof Date || 
            (cell && typeof cell === 'object' && cell.t === 'd') ||
            // Para números seriales de Excel
            (typeof cell === 'number' && cell > 40000 && cell < 50000)
          );
          
          if (containsExcelDates) {
            console.log(`  Fila ${i+1}: Contiene fechas Excel`);
            
            // Verificar si la siguiente fila contiene strings (nombres)
            const nextRowHasNames = nextRow.some(cell => 
              typeof cell === 'string' || 
              (cell && typeof cell === 'object' && cell.text && cell.text.length > 1)
            );
            
            if (nextRowHasNames) {
              console.log(`  Fila ${i+2}: Contiene nombres`);
              
              // Procesar cada columna
              for (let j = 0; j < Math.min(currentRow.length, nextRow.length); j++) {
                const cellFecha = currentRow[j];
                const cellNombre = nextRow[j];
                
                // ExcelJS puede devolver fechas como objeto Date directamente
                let fechaJS = null;
                
                // Manejar diferentes tipos de celdas de fecha en ExcelJS
                if (cellFecha instanceof Date) {
                  fechaJS = new Date(cellFecha);
                  // Corregir el problema de desplazamiento de fechas
                  fechaJS.setDate(fechaJS.getDate() + 1);
                } else if (cellFecha && typeof cellFecha === 'object' && cellFecha.result) {
                  // Para celdas con resultado de fórmula
                  fechaJS = new Date(cellFecha.result);
                  // Corregir el problema de desplazamiento de fechas
                  fechaJS.setDate(fechaJS.getDate() + 1);
                } else if (typeof cellFecha === 'number' && cellFecha > 40000 && cellFecha < 50000) {
                  // Cuando ExcelJS devuelve la fecha como número serial
                  // En este caso, debemos asegurarnos de que la fecha convertida sea correcta
                  
                  // Forma directa y corregida de convertir número serial a fecha
                  // Excel comienza desde 1/1/1900, y el día 60 (29/2/1900) no existe realmente
                  // Ajustamos estos detalles para obtener la fecha correcta
                  
                  // Calculamos días desde 1/1/1900
                  const date = new Date(1900, 0, 1);
                  date.setDate(date.getDate() + Math.floor(cellFecha) - 1);
                  
                  // Corrección para fechas posteriores al 28/2/1900 debido al error del año bisiesto en Excel
                  if (cellFecha > 60) {
                    date.setDate(date.getDate() - 1);
                  }
                  
                  // Y sumamos un día para corregir el desplazamiento observado
                  date.setDate(date.getDate() + 1);
                  
                  fechaJS = date;
                }
                
                // Extraer el nombre, manejando diferentes tipos de celdas en ExcelJS
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
                
                // Verificar si tenemos una fecha y un nombre válido
                if (fechaJS && fechaJS instanceof Date && !isNaN(fechaJS.getTime()) && 
                    nombre && nombre.trim() !== '') {
                  
                  console.log(`    Guardia encontrada: ${fechaJS.toISOString().split('T')[0]} - ${nombre.trim()}`);
                  
                  try {
                    // Verificar si ya existe una guardia para esta fecha
                    const existeGuardia = await Guardia.findOne({
                      where: { fecha: fechaJS }
                    });
                    
                    if (existeGuardia) {
                      console.log(`    Ya existe una guardia para el ${fechaJS.toISOString().split('T')[0]}`);
                      errores.push(`Ya existe una guardia asignada para el ${fechaJS.toISOString().split('T')[0]}`);
                    } else {
                      // Crear nueva guardia
                      const nuevaGuardia = await Guardia.create({
                        fecha: fechaJS,
                        usuario: nombre.trim(),
                        notas: `Importado desde Excel - ${mes} 2025`
                      });
                      
                      guardiasImportadas.push(nuevaGuardia);
                      console.log(`    Guardia creada: ${nombre.trim()} - ${fechaJS.toISOString()}`);
                    }
                  } catch (error) {
                    console.error(`    Error al crear guardia: ${error.message}`);
                    errores.push(`Error al crear guardia para ${fechaJS.toISOString().split('T')[0]}: ${error.message}`);
                  }
                }
              }
            }
          }
        }
      }
      
      // Eliminar archivo temporal
      fs.unlinkSync(filePath);
      
      res.status(200).json({
        success: true,
        message: `Se importaron ${guardiasImportadas.length} guardias correctamente`,
        errors: errores.length > 0 ? errores : null,
        totalImportadas: guardiasImportadas.length,
        totalErrores: errores.length
      });
    } catch (excelError) {
      console.error('Error al procesar el archivo Excel:', excelError);
      errores.push(`Error al procesar el archivo Excel: ${excelError.message}`);
      
      // Eliminar archivo temporal si existe
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.status(400).json({
        success: false,
        message: 'Error al procesar el archivo Excel',
        error: excelError.message,
        errors: errores
      });
    }
  } catch (error) {
    console.error('Error general al importar guardias:', error);
    
    // Eliminar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al importar guardias',
      error: error.message
    });
  }
};

module.exports = exports;