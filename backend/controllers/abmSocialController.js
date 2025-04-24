// controllers/abmSocialController.js
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

exports.uploadSocialExcel = async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    filePath = path.join(__dirname, '../', req.file.path);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const altasSheet = workbook.worksheets.find(ws => ws.name.toLowerCase().includes('alta'));
    const bajasSheet = workbook.worksheets.find(ws => ws.name.toLowerCase().includes('baja'));

    if (!altasSheet && !bajasSheet) {
      // Eliminar archivo si no tiene las hojas requeridas
      cleanupFile(filePath);
      return res.status(400).json({ error: 'El archivo no contiene hojas válidas de Altas o Bajas para YSocial.' });
    }

    // Validar columnas esperadas para altas y bajas
    const expectedHeadersAltas = ['fecha', 'centro', 'cant usuarios', 'gestion', 'itracker'];
    const expectedHeadersBajas = ['fecha', 'cant usuarios', 'itracker'];

    const validateSheet = (sheet, expectedCols) => {
      const headers = sheet.getRow(1).values.slice(1).map(normalize);
      return expectedCols.every(col => headers.includes(col));
    };

    if ((altasSheet && !validateSheet(altasSheet, expectedHeadersAltas)) ||
        (bajasSheet && !validateSheet(bajasSheet, expectedHeadersBajas))) {
      // Eliminar archivo si no tiene el formato esperado
      cleanupFile(filePath);
      return res.status(400).json({ error: 'El archivo no tiene el formato esperado para YSocial. Verificá que sea el archivo correcto.' });
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
          centro: rowData['centro'] || null,
          operacion: rowData['operación'] || null,
          cant_usuarios: parseInt(rowData['cant usuarios']) || 0,
          gestion: rowData['gestion'] || null,
          itracker: rowData['itracker'] || null,
          fuente: req.file.originalname,
        };

        const unique_key = generateKey(finalData, i);

        const [existing] = await pool.query('SELECT 1 FROM abm_social WHERE unique_key = ?', [unique_key]);

        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO abm_social (fecha, tipo, centro, operacion, cant_usuarios, gestion, itracker, fuente, unique_key)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              finalData.fecha,
              finalData.tipo,
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
      message: 'Archivo YSocial procesado correctamente.',
      total_insertados: totalInsertados,
      total_duplicados: totalDuplicados,
    });
  } catch (error) {
    console.error('Error al procesar archivo YSocial:', error);
    res.status(500).json({ error: 'Error procesando el archivo YSocial' });
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