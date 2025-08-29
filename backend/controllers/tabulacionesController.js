const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

exports.uploadTabulaciones = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    const filePath = path.join(__dirname, '../', req.file.path);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('Tareas');

    if (!worksheet) return res.status(400).json({ error: 'La hoja "Tareas" no existe en el archivo Excel.' });

    // Limpiar encabezados
    const rawHeaders = worksheet.getRow(1).values.slice(1);
    const headers = rawHeaders.map(h => typeof h === 'string' ? h.trim() : h);
    
    console.log('Headers detectados:', headers);

    // Crear un mapa de índices para evitar repetir búsquedas
    const headerIndices = {
      'tarea_id': findHeaderIndex(headers, ['Id. de tarea', 'ID de tarea', 'Id de tarea', 'ID tarea']),
      'nombre_tarea': findHeaderIndex(headers, ['Nombre de la tarea', 'Nombre tarea']),
      'deposito': findHeaderIndex(headers, ['Nombre del depósito', 'Depósito', 'Deposito']),
      'progreso': findHeaderIndex(headers, ['Progreso']),
      'prioridad': findHeaderIndex(headers, ['Priority', 'Prioridad']),
      'asignado_a': findHeaderIndex(headers, ['Asignado a']),
      'creado_por': findHeaderIndex(headers, ['Creado por']),
      'fecha_creacion': findHeaderIndex(headers, ['Fecha de creación', 'Fecha creación', 'Fecha de creacion']),
      'fecha_inicio': findHeaderIndex(headers, ['Fecha de inicio', 'Fecha inicio']),
      'fecha_vencimiento': findHeaderIndex(headers, ['Fecha de vencimiento', 'Fecha vencimiento']),
      'es_periodica': findHeaderIndex(headers, ['Es periódica', 'Es periodica', 'Periódica', 'Periodica']),
      'con_retraso': findHeaderIndex(headers, ['Con retraso', 'Retraso']),
      'fecha_finalizacion': findHeaderIndex(headers, ['Fecha de finalización', 'Fecha finalización', 'Fecha de finalizacion', 'Fecha finalizacion']),
      'completado_por': findHeaderIndex(headers, ['Completado por']),
      'descripcion': findHeaderIndex(headers, ['Descripción', 'Descripcion'])
    };
    
    // Verificar si se encontraron todos los campos necesarios
    const missingFields = Object.entries(headerIndices)
      .filter(([field, index]) => index === -1)
      .map(([field]) => field);
    
    if (missingFields.length > 0) {
      console.warn('Campos no encontrados en el Excel:', missingFields);
    }

    console.log('Índices de columnas:', headerIndices);

    let totalInsertados = 0;
    let totalDuplicados = 0;
    let totalFilas = 0;
    let errores = [];

    for (let i = 2; i <= worksheet.rowCount; i++) {
      try {
        totalFilas++;
        const row = worksheet.getRow(i);
        
        // Función para obtener de forma segura el valor de una celda
        const getCellValue = (fieldName) => {
          const index = headerIndices[fieldName];
          if (index === -1) return null;
          return row.getCell(index + 1).value;
        };

        // Comprobar si hay al menos un valor en la fila
        const hayDatos = Object.values(headerIndices)
          .filter(index => index !== -1)
          .some(index => {
            const valor = row.getCell(index + 1).value;
            return valor !== null && valor !== undefined && valor !== '';
          });
        
        if (!hayDatos) continue;

        const rowData = {
          tarea_id: getCellValue('tarea_id'),
          nombre_tarea: sanitizeString(getCellValue('nombre_tarea')),
          deposito: sanitizeString(getCellValue('deposito')),
          progreso: sanitizeNumber(getCellValue('progreso')),
          prioridad: sanitizeString(getCellValue('prioridad')),
          asignado_a: sanitizeString(getCellValue('asignado_a')),
          creado_por: sanitizeString(getCellValue('creado_por')),
          fecha_creacion: formatExcelDate(getCellValue('fecha_creacion')),
          fecha_inicio: formatExcelDate(getCellValue('fecha_inicio')),
          fecha_vencimiento: formatExcelDate(getCellValue('fecha_vencimiento')),
          es_periodica: sanitizeBoolean(getCellValue('es_periodica')),
          con_retraso: sanitizeBoolean(getCellValue('con_retraso')),
          fecha_finalizacion: formatExcelDate(getCellValue('fecha_finalizacion')),
          completado_por: sanitizeString(getCellValue('completado_por')),
          descripcion: sanitizeString(getCellValue('descripcion')),
          archivo_origen: req.file.originalname,
        };

        // Log para debugging
        if (i <= 5) {
          console.log(`Fila ${i} procesada:`, rowData);
        }

        if (rowData.tarea_id) {
          const [existing] = await pool.query(
            'SELECT 1 FROM taskmanagementsystem.tabulaciones_data WHERE tarea_id = ?',
            [rowData.tarea_id]
          );

          if (existing.length === 0) {
            await pool.query(`
              INSERT INTO taskmanagementsystem.tabulaciones_data (
                tarea_id, nombre_tarea, deposito, progreso, prioridad, asignado_a,
                creado_por, fecha_creacion, fecha_inicio, fecha_vencimiento,
                es_periodica, con_retraso, fecha_finalizacion, completado_por,
                descripcion, archivo_origen
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, Object.values(rowData));

            totalInsertados++;
          } else {
            totalDuplicados++;
          }
        }
      } catch (rowError) {
        errores.push(`Error en fila ${i}: ${rowError.message}`);
        console.error(`Error procesando fila ${i}:`, rowError);
      }
    }

    // Eliminar el archivo temporal
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'Archivo procesado correctamente.',
      total_filas: totalFilas,
      total_insertados: totalInsertados,
      total_duplicados: totalDuplicados,
      errores: errores.length > 0 ? errores : undefined,
    });
  } catch (error) {
    console.error('Error al procesar archivo Excel:', error);
    res.status(500).json({ error: 'Error procesando el archivo: ' + error.message });
  }
};

// Función para encontrar el índice del encabezado con variantes
function findHeaderIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => {
      if (typeof h === 'string' && typeof name === 'string') {
        return h.toLowerCase() === name.toLowerCase();
      }
      return h === name;
    });
    if (index !== -1) return index;
  }
  return -1;
}

// Función para sanitizar strings
function sanitizeString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && value.text) return value.text.trim();
  if (typeof value === 'object' && value.result) return value.result.toString().trim();
  return String(value);
}

// Función para sanitizar números
function sanitizeNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object' && value.result) return value.result;
  return null;
}

// Función para sanitizar booleanos
function sanitizeBoolean(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === 'sí' || normalized === 'si' || normalized === '1' || normalized === 'yes';
  }
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'object' && value.result !== undefined) return sanitizeBoolean(value.result);
  return false;
}

// Función mejorada para manejar distintos formatos de fecha
function formatExcelDate(excelDate) {
  if (!excelDate) return null;

  try {
    if (excelDate instanceof Date) return excelDate;

    if (typeof excelDate === 'string') {
      // Intentar parsear la fecha en formato español (DD/MM/YYYY)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(excelDate)) {
        const [day, month, year] = excelDate.split('/').map(Number);
        const parsed = new Date(year, month - 1, day);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      
      const parsed = new Date(excelDate);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof excelDate === 'number') {
      // Excel usa un sistema de fecha donde 1 = 1/1/1900
      // 60 se suma porque Excel incorrectamente considera 1900 como año bisiesto
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const excelEpoch = new Date(1899, 11, 30);
      const days = Math.floor(excelDate);
      
      // Ajuste para el error del año bisiesto de Excel
      const adjustedDays = days > 60 ? days - 1 : days;
      
      const msSinceEpoch = adjustedDays * millisecondsPerDay;
      const date = new Date(excelEpoch.getTime() + msSinceEpoch);
      
      // Si tiene parte decimal, añadir las horas/minutos/segundos
      if (excelDate !== days) {
        const fractionalDay = excelDate - days;
        const milliseconds = Math.round(fractionalDay * millisecondsPerDay);
        date.setMilliseconds(date.getMilliseconds() + milliseconds);
      }
      
      return date;
    }

    if (typeof excelDate === 'object') {
      // Manejar objetos de resultado de Excel
      if (excelDate.result !== undefined) {
        return formatExcelDate(excelDate.result);
      }
      if (excelDate.text !== undefined) {
        return formatExcelDate(excelDate.text);
      }
    }
  } catch (error) {
    console.error('Error al procesar fecha:', error, 'Valor original:', excelDate);
  }

  return null;
}