// controllers/abmPicController.js
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const crypto = require('crypto');

const normalize = (val) => (val || '').toString().trim().toLowerCase();

const generateKey = (row, index) => {
  const base = `${row.fecha.toISOString().split('T')[0]}-${normalize(row.centro)}-${normalize(row.operacion)}-${row.cant_usuarios}-${normalize(row.gestion)}-${normalize(row.itracker)}-${index}`;
  return crypto.createHash('md5').update(base).digest('hex');
};

exports.uploadPicExcel = async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    filePath = path.join(__dirname, '../', req.file.path);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const isPic = workbook.worksheets.some(ws =>
      ws.name.toLowerCase().includes('pic') || ws.name.toLowerCase().includes('altas carga manual')
    );

    if (!isPic) {
      // Eliminar archivo si no es válido
      cleanupFile(filePath);
      return res.status(400).json({ error: 'Este archivo no corresponde a datos de PIC. Revisá el archivo.' });
    }

    const altasSheet = workbook.getWorksheet('Altas carga manual');
    const bajasSheet = workbook.getWorksheet('Bajas carga manual');

    if (!altasSheet && !bajasSheet) {
      // Eliminar archivo si no tiene las hojas requeridas
      cleanupFile(filePath);
      return res.status(400).json({ error: 'El archivo no contiene hojas válidas de Altas o Bajas para PIC.' });
    }

    let totalInsertados = 0;
    let totalDuplicados = 0;

    const processSheet = async (sheet, tipo) => {
      if (!sheet) return;
      const headers = sheet.getRow(1).values.slice(1);

      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const rowData = {};

        headers.forEach((header, idx) => {
          rowData[normalize(header)] = row.getCell(idx + 1).value;
        });

        const fecha = rowData['fecha'] ? new Date(rowData['fecha']) : null;
        if (!fecha || isNaN(fecha.getTime())) continue;

        const finalData = {
          fecha,
          tipo,
          centro_region: rowData['centro_region'] || null,
          centro: rowData['centro'] || null,
          operacion: rowData['operación'] || null,
          cant_usuarios: parseInt(rowData['cant usuarios']) || 0,
          gestion: rowData['gestion'] || null,
          itracker: rowData['itracker'] || null,
          fuente: req.file.originalname,
        };

        const unique_key = generateKey(finalData, i);

        const [existing] = await pool.query('SELECT 1 FROM abm_pic WHERE unique_key = ?', [unique_key]);

        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO abm_pic (fecha, tipo, centro_region, centro, operacion, cant_usuarios, gestion, itracker, fuente, unique_key)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              finalData.fecha,
              finalData.tipo,
              finalData.centro_region,
              finalData.centro,
              finalData.operacion,
              finalData.cant_usuarios,
              finalData.gestion,
              finalData.itracker,
              finalData.fuente,
              unique_key,
            ]
          );
          totalInsertados++;
        } else {
          totalDuplicados++;
        }
      }
    };

    await processSheet(altasSheet, 'Alta');
    await processSheet(bajasSheet, 'Baja');

    // Eliminar el archivo después de procesarlo
    cleanupFile(filePath);
    filePath = null; // Para evitar intentar eliminarlo de nuevo en el bloque finally

    res.status(200).json({
      message: 'Archivo PIC procesado correctamente.',
      total_insertados: totalInsertados,
      total_duplicados: totalDuplicados,
    });
  } catch (error) {
    console.error('Error al procesar archivo PIC:', error);
    res.status(500).json({ error: 'Error procesando el archivo PIC' });
  } finally {
    // Asegurarse de que el archivo siempre se elimine, incluso si hay errores
    if (filePath) {
      cleanupFile(filePath);
    }
  }
};

// Función auxiliar para eliminar archivos de forma segura
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Archivo eliminado: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error al eliminar el archivo ${filePath}:`, err);
  }
}

// Función para limpiar archivos huérfanos en la carpeta uploads
exports.cleanupUploadsFolder = () => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Verificar si la carpeta existe
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      
      // Establecer tiempo límite (archivos más antiguos que 1 hora)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        // Si el archivo es más antiguo que el límite, eliminarlo
        if (stats.mtime < oneHourAgo) {
          fs.unlinkSync(filePath);
          console.log(`Archivo huérfano eliminado: ${filePath}`);
        }
      });
    }
  } catch (err) {
    console.error('Error al limpiar la carpeta uploads:', err);
  }
};