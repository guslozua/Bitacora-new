// controllers/abmPicController.js
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const crypto = require('crypto');

const normalize = (val) => (val || '').toString().trim().toLowerCase();

const generateKey = (row) => {
  // Usar fecha, centro, operacion, cant_usuarios, gestion para evitar duplicados reales
  const base = `${row.fecha.toISOString().split('T')[0]}-${normalize(row.centro)}-${normalize(row.operacion)}-${row.cant_usuarios}-${normalize(row.gestion)}-${row.tipo}`;
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
      cleanupFile(filePath);
      return res.status(400).json({ error: 'Este archivo no corresponde a datos de PIC. Revisá el archivo.' });
    }

    const altasSheet = workbook.getWorksheet('Altas carga manual');
    const bajasSheet = workbook.getWorksheet('Bajas carga manual');

    if (!altasSheet && !bajasSheet) {
      cleanupFile(filePath);
      return res.status(400).json({ error: 'El archivo no contiene hojas válidas de Altas o Bajas para PIC.' });
    }

    // NUEVA FUNCIONALIDAD: Limpiar tabla antes de cargar datos frescos
    console.log('Limpiando datos existentes de PIC antes de cargar archivo...');
    await pool.query('DELETE FROM taskmanagementsystem.abm_pic');
    console.log('Tabla abm_pic limpiada correctamente');

    let totalInsertados = 0;
    let totalOmitidos = 0;

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

        // FILTRO: Solo procesar datos de 2023 en adelante
        const año = fecha.getFullYear();
        if (año < 2023) {
          totalOmitidos++;
          continue;
        }

        const finalData = {
          fecha,
          tipo,
          centro_region: rowData['centro_region'] || null,
          centro: rowData['centro'] || null,
          operacion: rowData['operación'] || null,
          cant_usuarios: parseInt(rowData['cant usuarios'] || rowData['cant_usuarios']) || 0,
          gestion: rowData['gestion'] || null,
          itracker: rowData['itracker'] || null,
          fuente: req.file.originalname,
        };

        const unique_key = generateKey(finalData);

        // Obtener el próximo ID disponible
        const [maxIdResult] = await pool.query(
          'SELECT ISNULL(MAX(id), 0) + 1 as next_id FROM taskmanagementsystem.abm_pic'
        );
        const nextId = maxIdResult[0].next_id;

        await pool.query(
          `INSERT INTO taskmanagementsystem.abm_pic (id, fecha, tipo, centro_region, centro, operacion, cant_usuarios, gestion, itracker, fuente, unique_key)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nextId,
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
      }
    };

    await processSheet(altasSheet, 'Alta');
    await processSheet(bajasSheet, 'Baja');

    cleanupFile(filePath);
    filePath = null;

    res.status(200).json({
      message: 'Archivo PIC procesado correctamente. Tabla limpiada y recargada.',
      total_insertados: totalInsertados,
      total_omitidos: totalOmitidos,
      años_procesados: '2023-2025',
    });
  } catch (error) {
    console.error('Error al procesar archivo PIC:', error);
    res.status(500).json({ error: 'Error procesando el archivo PIC' });
  } finally {
    if (filePath) {
      cleanupFile(filePath);
    }
  }
};

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

exports.cleanupUploadsFolder = () => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
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
