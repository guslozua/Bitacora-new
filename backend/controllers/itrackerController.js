const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    const filePath = path.join(__dirname, '../', req.file.path);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const headers = worksheet.getRow(1).values.slice(1);
    let totalInsertados = 0;
    let totalDuplicados = 0;

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const rowData = {};

      headers.forEach((header, idx) => {
        rowData[header] = row.getCell(idx + 1).value;
      });

      // Función para convertir ticket_id según el tipo esperado por la base de datos
      const processTicketId = (id) => {
        if (!id) return null;
        const idStr = String(id).trim();
        // Si es un número válido, convertir a entero para BIGINT
        if (/^\d+$/.test(idStr)) {
          return parseInt(idStr, 10);
        }
        // Si no es numérico, mantener como string (puede fallar si la columna es BIGINT)
        return idStr;
      };

      const finalData = {
        ticket_id: processTicketId(rowData['ID']),
        unido_a: rowData['UNIDO A'],
        t_0: rowData['T_0'],
        t_1: rowData['T_1'],
        t_2: rowData['T_2'],
        t_3: rowData['T_3'],
        fecha_apertura: rowData['FECHA APERTURA'],
        u_apertura: rowData['U APERTURA'],
        usuario_apertura: rowData['USUARIO APERTURA'],
        equipo_apertura: rowData['EQUIPO APERTURA'],
        estado: rowData['ESTADO'],
        abierto_a: rowData['ABIERTO A'],
        fecha_cierre: rowData['FECHA CIERRE'],
        u_cierre: rowData['U CIERRE'],
        usuario_cierre: rowData['USUARIO CIERRE'],
        cierre_tipo: rowData['CIERRE_TIPO:'],
        cierre_falla: rowData['CIERRE_FALLA:'],
        cierre_novedad: rowData['CIERRE_NOVEDAD:'],
        cierre_comentario: rowData['CIERRE_COMENTARIO:'],
        apertura_descripcion_error: rowData['APERTURA_DESCRIPCION DEL ERROR'],
        archivo_origen: req.file.originalname,
      };

      if (finalData.ticket_id) {
        try {
          const [existing] = await pool.query(
            'SELECT 1 FROM taskmanagementsystem.itracker_data WHERE ticket_id = ?',
            [finalData.ticket_id]
          );

          if (existing.length === 0) {
            // Obtener el próximo ID disponible
            const [maxIdResult] = await pool.query(
              'SELECT ISNULL(MAX(id), 0) + 1 as next_id FROM taskmanagementsystem.itracker_data'
            );
            const nextId = maxIdResult[0].next_id;
            
            // Agregar el ID al objeto de datos
            const dataWithId = {
              id: nextId,
              ...finalData
            };
            
            await pool.query(`
              INSERT INTO taskmanagementsystem.itracker_data (
                id, ticket_id, unido_a, t_0, t_1, t_2, t_3,
                fecha_apertura, u_apertura, usuario_apertura, equipo_apertura,
                estado, abierto_a, fecha_cierre, u_cierre, usuario_cierre,
                cierre_tipo, cierre_falla, cierre_novedad, cierre_comentario,
                apertura_descripcion_error, archivo_origen
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, Object.values(dataWithId));

            totalInsertados++;
          } else {
            totalDuplicados++;
          }
        } catch (err) {
          console.error(`Error insertando fila ${i}:`, err.message);
        }
      }
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'Archivo procesado correctamente.',
      total_insertados: totalInsertados,
      total_duplicados: totalDuplicados,
    });
  } catch (error) {
    console.error('Error al procesar archivo Excel:', error);
    res.status(500).json({ error: 'Error procesando el archivo' });
  }
};
