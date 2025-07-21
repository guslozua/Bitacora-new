// controllers/sessionAnalysisController.js
const db = require('../config/db');
const ExcelJS = require('exceljs');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const CIDRUtils = require('../utils/cidrUtils');

class SessionAnalysisController {
  
  // Procesar archivo CSV/Excel subido
  static async processSessionFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se encontró archivo para procesar'
        });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const fileExt = path.extname(fileName).toLowerCase();
      
      let processedData = [];

      if (fileExt === '.csv') {
        processedData = await SessionAnalysisController.processCSV(filePath);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        processedData = await SessionAnalysisController.processExcel(filePath);
      } else {
        throw new Error('Formato de archivo no soportado. Use CSV o Excel.');
      }

      // Procesar y enriquecer datos
      const enrichedData = await SessionAnalysisController.enrichSessionData(processedData, fileName);
      
      // Guardar en base de datos
      const savedCount = await SessionAnalysisController.saveSessionData(enrichedData);
      
      // Generar métricas históricas
      await SessionAnalysisController.generateHistoricalMetrics(new Date(), fileName);
      
      // Limpiar archivo temporal
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: `Archivo procesado exitosamente`,
        data: {
          fileName,
          totalRecords: processedData.length,
          savedRecords: savedCount,
          processingDate: new Date().toISOString().split('T')[0]
        }
      });

    } catch (error) {
      console.error('Error procesando archivo de sesiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando archivo',
        error: error.message
      });
    }
  }

  // Procesar archivo CSV
  static async processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // DEBUG: Buscar la columna de usuario de forma más robusta
          let usuarioColumn = null;
          
          // Buscar todas las posibles variaciones de "Usuario asociado"
          Object.keys(data).forEach(key => {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey.includes('usuario') && cleanKey.includes('asociado')) {
              usuarioColumn = key;
            }
          });
          
          // Buscar columna de máquina
          let maquinaColumn = null;
          Object.keys(data).forEach(key => {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey.includes('nombre') && cleanKey.includes('máquina')) {
              maquinaColumn = key;
            }
          });
          
          // Buscar columna de estado
          let estadoColumn = null;
          Object.keys(data).forEach(key => {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey.includes('estado') && cleanKey.includes('sesión')) {
              estadoColumn = key;
            }
          });
          
          const row = {
            usuario_asociado: usuarioColumn ? data[usuarioColumn] : null,
            estado_sesion: estadoColumn ? data[estadoColumn] : null,
            hora_inicio_sesion: data['Hora de inicio de la sesión'] || data['hora_inicio_sesion'] || null,
            anonimo: data['Anónimo'] || data['anonimo'] || null,
            nombre_punto_final: data['Nombre de punto final'] || data['nombre_punto_final'] || null,
            ip_punto_final: data['IP de punto final'] || data['ip_punto_final'] || data['Dirección IP del punto final'] || null,
            version_receiver: data['Versión de Receiver'] || data['version_receiver'] || null,
            nombre_maquina: maquinaColumn ? data[maquinaColumn] : null,
            direccion_ip: data['Dirección IP'] || data['direccion_ip'] || null,
            tiempo_inactividad: data['Tiempo de inactividad (hh:mm)'] || data['tiempo_inactividad'] || null,
            campo_adicional: parseFloat(data[''] || data['campo_adicional'] || '0') || null
          };
          
          // Solo agregar filas que tengan datos relevantes
          if (row.usuario_asociado || row.nombre_maquina || row.ip_punto_final) {
            results.push(row);
          }
        })
        .on('end', () => {
          console.log(`CSV procesado: ${results.length} registros encontrados`);
          // DEBUG: Mostrar algunos usuarios encontrados
          const usuariosEncontrados = results.filter(r => r.usuario_asociado).slice(0, 3);
          console.log('Usuarios de ejemplo:', usuariosEncontrados.map(r => r.usuario_asociado));
          resolve(results);
        })
        .on('error', (error) => {
          console.error('Error procesando CSV:', error);
          reject(error);
        });
    });
  }

  // Procesar archivo Excel
  static async processExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1);
    const results = [];
    
    // Obtener headers de la primera fila
    const headers = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value;
    });
    
    // Procesar datos desde la fila 2
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        // Mapear a nuestro formato
        const mappedRow = {
          usuario_asociado: rowData['Usuario asociado'],
          estado_sesion: rowData['Estado de la sesión'],
          hora_inicio_sesion: rowData['Hora de inicio de la sesión'],
          anonimo: rowData['Anónimo'],
          nombre_punto_final: rowData['Nombre de punto final'],
          ip_punto_final: rowData['IP de punto final'],
          version_receiver: rowData['Versión de Receiver'],
          nombre_maquina: rowData['Nombre de máquina'],
          direccion_ip: rowData['Dirección IP'],
          tiempo_inactividad: rowData['Tiempo de inactividad (hh:mm)'],
          campo_adicional: parseFloat(rowData['']) || null
        };
        
        results.push(mappedRow);
      }
    });
    
    return results;
  }

  // Enriquecer datos con análisis adicional
  static async enrichSessionData(rawData, fileName) {
    // Obtener segmentos CIDR de call centers
    const [ipSegments] = await db.query(`
      SELECT nombre_call_center, segmento_ip, segmento_numero, localidad, domicilio, tipo_contrato 
      FROM ip_ranges_call_centers 
      WHERE activo = 1 AND segmento_ip IS NOT NULL
    `);
    
    const enrichedData = rawData.map(row => {
      // Validar si es VM PIC
      const esVmPic = SessionAnalysisController.isVmPicMachine(row.nombre_maquina);
      
      // Determinar ubicación basada en IP usando segmentos CIDR
      const ubicacionInfo = CIDRUtils.classifyIP(row.ip_punto_final, ipSegments);
      
      // Parsear fecha de sesión
      const fechaSesion = SessionAnalysisController.parseSessionDate(row.hora_inicio_sesion);
      
      return {
        ...row,
        es_vm_pic: esVmPic ? 1 : 0,
        ubicacion_tipo: ubicacionInfo.ubicacion_tipo,
        call_center_asignado: ubicacionInfo.call_center,
        segmento_ip: ubicacionInfo.segmento_ip,
        localidad_call_center: ubicacionInfo.localidad,
        domicilio_call_center: ubicacionInfo.domicilio,
        tipo_contrato: ubicacionInfo.tipo_contrato,
        fecha_procesamiento: new Date().toISOString().split('T')[0],
        archivo_origen: fileName,
        hora_inicio_sesion: fechaSesion
      };
    });
    
    return enrichedData;
  }

  // Validar si la máquina sigue el patrón VMxxxPICxxxx
  static isVmPicMachine(nombreMaquina) {
    if (!nombreMaquina) return false;
    
    // Patrón actualizado: acepta prefijo opcional como TELECOM\ seguido de VMxxxPICxxxx
    const pattern = /(?:.*\\)?VM\d+PIC\d+$/i;
    return pattern.test(nombreMaquina);
  }

  // NOTA: Funciones legacy mantenidas para compatibilidad
  // La clasificación ahora se hace con CIDRUtils.classifyIP()
  
  // Determinar ubicación basada en IP (LEGACY - usar CIDRUtils.classifyIP)
  static determineLocation(ipPuntoFinal, ipRanges) {
    console.warn('⚠️  Función legacy determineLocation() - usar CIDRUtils.classifyIP() en su lugar');
    if (!ipPuntoFinal) {
      return { tipo: 'desconocido', callCenter: null };
    }
    
    // Convertir IP a número para comparación
    const ipNum = SessionAnalysisController.ipToNumber(ipPuntoFinal);
    
    for (const range of ipRanges) {
      const startNum = SessionAnalysisController.ipToNumber(range.ip_inicio);
      const endNum = SessionAnalysisController.ipToNumber(range.ip_fin);
      
      if (ipNum >= startNum && ipNum <= endNum) {
        return {
          tipo: 'call_center',
          callCenter: range.nombre_call_center
        };
      }
    }
    
    return { tipo: 'home', callCenter: null };
  }

  // Convertir IP a número para comparación (LEGACY)
  static ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  // Parsear fecha de sesión
  static parseSessionDate(fechaStr) {
    if (!fechaStr) return null;
    
    try {
      // Intentar diferentes formatos de fecha
      const date = new Date(fechaStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  // Guardar datos en base de datos (procesamiento en lotes)
  static async saveSessionData(enrichedData) {
    if (!enrichedData || enrichedData.length === 0) {
      return 0;
    }

    const insertQuery = `
      INSERT IGNORE INTO sesiones_data (
        usuario_asociado, estado_sesion, hora_inicio_sesion, anonimo,
        nombre_punto_final, ip_punto_final, version_receiver, nombre_maquina,
        direccion_ip, tiempo_inactividad, campo_adicional, es_vm_pic,
        ubicacion_tipo, call_center_asignado, segmento_ip, localidad_call_center,
        domicilio_call_center, tipo_contrato, fecha_procesamiento, archivo_origen
      ) VALUES ?
    `;

    const BATCH_SIZE = 500; // Procesar en lotes de 500 registros
    let totalInserted = 0;
    
    console.log(`Procesando ${enrichedData.length} registros en lotes de ${BATCH_SIZE}...`);
    
    for (let i = 0; i < enrichedData.length; i += BATCH_SIZE) {
      const batch = enrichedData.slice(i, i + BATCH_SIZE);
      
      const values = batch.map(row => [
        row.usuario_asociado,
        row.estado_sesion,
        row.hora_inicio_sesion,
        row.anonimo,
        row.nombre_punto_final,
        row.ip_punto_final,
        row.version_receiver,
        row.nombre_maquina,
        row.direccion_ip,
        row.tiempo_inactividad,
        row.campo_adicional,
        row.es_vm_pic,
        row.ubicacion_tipo,
        row.call_center_asignado,
        row.segmento_ip,
        row.localidad_call_center,
        row.domicilio_call_center,
        row.tipo_contrato,
        row.fecha_procesamiento,
        row.archivo_origen
      ]);

      try {
        const [result] = await db.query(insertQuery, [values]);
        totalInserted += result.affectedRows;
        console.log(`Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${result.affectedRows} registros insertados`);
      } catch (error) {
        console.error(`Error en lote ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
        throw error;
      }
    }
    
    console.log(`✅ Total insertado: ${totalInserted} registros`);
    return totalInserted;
  }

  // Generar métricas históricas
  static async generateHistoricalMetrics(date, fileName) {
    const fechaCorte = date.toISOString().split('T')[0];
    
    // Obtener estadísticas del día
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_sesiones,
        COUNT(CASE WHEN estado_sesion = 'Activo' THEN 1 END) as total_sesiones_activas,
        COUNT(CASE WHEN es_vm_pic = 1 THEN 1 END) as total_vm_pic,
        COUNT(CASE WHEN es_vm_pic = 1 AND estado_sesion = 'Activo' THEN 1 END) as total_vm_pic_activas,
        COUNT(CASE WHEN ubicacion_tipo = 'home' THEN 1 END) as total_home,
        COUNT(CASE WHEN ubicacion_tipo = 'call_center' THEN 1 END) as total_call_center,
        COUNT(CASE WHEN ubicacion_tipo = 'home' AND estado_sesion = 'Activo' THEN 1 END) as total_home_activas,
        COUNT(CASE WHEN ubicacion_tipo = 'call_center' AND estado_sesion = 'Activo' THEN 1 END) as total_call_center_activas,
        COUNT(DISTINCT usuario_asociado) as usuarios_unicos
      FROM sesiones_data 
      WHERE fecha_procesamiento = ?
    `, [fechaCorte]);
    
    const statsRow = stats[0];
    
    // Calcular porcentajes
    const porcentajeHome = statsRow.total_sesiones > 0 ? 
      (statsRow.total_home * 100 / statsRow.total_sesiones) : 0;
    const porcentajeCallCenter = statsRow.total_sesiones > 0 ? 
      (statsRow.total_call_center * 100 / statsRow.total_sesiones) : 0;
    
    // Obtener distribución de versiones de Receiver
    const [versiones] = await db.query(`
      SELECT version_receiver, COUNT(*) as cantidad
      FROM sesiones_data 
      WHERE fecha_procesamiento = ? AND version_receiver IS NOT NULL
      GROUP BY version_receiver
      ORDER BY cantidad DESC
    `, [fechaCorte]);
    
    // Obtener detalle por call centers
    const [callCenters] = await db.query(`
      SELECT call_center_asignado, COUNT(*) as total,
             COUNT(CASE WHEN estado_sesion = 'Activo' THEN 1 END) as activas
      FROM sesiones_data 
      WHERE fecha_procesamiento = ? AND ubicacion_tipo = 'call_center'
      GROUP BY call_center_asignado
    `, [fechaCorte]);
    
    // Insertar o actualizar métricas históricas
    const insertMetricsQuery = `
      INSERT INTO metricas_sesiones_historicas (
        fecha_corte, total_sesiones, total_sesiones_activas, total_vm_pic,
        total_vm_pic_activas, total_home, total_call_center, total_home_activas,
        total_call_center_activas, porcentaje_home, porcentaje_call_center,
        usuarios_unicos, versiones_receiver, detalle_call_centers, archivo_origen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_sesiones = VALUES(total_sesiones),
        total_sesiones_activas = VALUES(total_sesiones_activas),
        total_vm_pic = VALUES(total_vm_pic),
        total_vm_pic_activas = VALUES(total_vm_pic_activas),
        total_home = VALUES(total_home),
        total_call_center = VALUES(total_call_center),
        total_home_activas = VALUES(total_home_activas),
        total_call_center_activas = VALUES(total_call_center_activas),
        porcentaje_home = VALUES(porcentaje_home),
        porcentaje_call_center = VALUES(porcentaje_call_center),
        usuarios_unicos = VALUES(usuarios_unicos),
        versiones_receiver = VALUES(versiones_receiver),
        detalle_call_centers = VALUES(detalle_call_centers),
        archivo_origen = VALUES(archivo_origen)
    `;
    
    await db.query(insertMetricsQuery, [
      fechaCorte,
      statsRow.total_sesiones,
      statsRow.total_sesiones_activas,
      statsRow.total_vm_pic,
      statsRow.total_vm_pic_activas,
      statsRow.total_home,
      statsRow.total_call_center,
      statsRow.total_home_activas,
      statsRow.total_call_center_activas,
      porcentajeHome,
      porcentajeCallCenter,
      statsRow.usuarios_unicos,
      JSON.stringify(versiones),
      JSON.stringify(callCenters),
      fileName
    ]);
  }

  // Obtener estadísticas actuales
  static async getCurrentStats(req, res) {
    try {
      const [currentStats] = await db.query(`
        SELECT * FROM v_sesiones_stats_actual
      `);
      
      // Obtener versiones de Receiver de todos los VM PIC
      const [topVersions] = await db.query(`
        SELECT 
          version_receiver, 
          COUNT(*) as cantidad,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sesiones_data WHERE es_vm_pic = 1), 2) as porcentaje
        FROM sesiones_data 
        WHERE es_vm_pic = 1 AND version_receiver IS NOT NULL
        GROUP BY version_receiver
        ORDER BY cantidad DESC
        LIMIT 10
      `);
      
      // Obtener distribución por ubicación de todos los VM PIC
      const [distribucionUbicacion] = await db.query(`
        SELECT 
          CASE 
            WHEN ubicacion_tipo = 'home' THEN 'Home Office'
            WHEN ubicacion_tipo = 'call_center' THEN 'Call Centers'
            ELSE 'Desconocido'
          END as ubicacion,
          COUNT(*) as total,
          COUNT(CASE WHEN estado_sesion = 'Active' THEN 1 END) as activas,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sesiones_data WHERE es_vm_pic = 1), 2) as porcentaje
        FROM sesiones_data 
        WHERE es_vm_pic = 1
        GROUP BY ubicacion_tipo
        ORDER BY total DESC
      `);

      res.json({
        success: true,
        data: {
          resumen: currentStats[0] || {},
          versionesReceiver: topVersions,
          distribucionUbicacion: distribucionUbicacion
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas actuales:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas',
        error: error.message
      });
    }
  }

  // Obtener datos históricos para gráficos
  static async getHistoricalData(req, res) {
    try {
      const { dias = 30 } = req.query;
      
      const [historicalData] = await db.query(`
        SELECT 
          fecha_corte,
          total_sesiones,
          total_sesiones_activas,
          total_vm_pic,
          total_home,
          total_call_center,
          porcentaje_home,
          porcentaje_call_center,
          usuarios_unicos
        FROM metricas_sesiones_historicas 
        WHERE fecha_corte >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY fecha_corte ASC
      `, [parseInt(dias)]);

      res.json({
        success: true,
        data: historicalData
      });

    } catch (error) {
      console.error('Error obteniendo datos históricos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo datos históricos',
        error: error.message
      });
    }
  }

  // Configurar rangos de IP de call centers
  static async manageIpRanges(req, res) {
    try {
      const { method } = req;
      
      if (method === 'GET') {
        const [ranges] = await db.query(`
          SELECT * FROM ip_ranges_call_centers ORDER BY nombre_call_center
        `);
        
        return res.json({
          success: true,
          data: ranges
        });
      }
      
      if (method === 'POST') {
        const { nombre_call_center, ip_inicio, ip_fin, descripcion } = req.body;
        
        const [result] = await db.query(`
          INSERT INTO ip_ranges_call_centers (nombre_call_center, ip_inicio, ip_fin, descripcion)
          VALUES (?, ?, ?, ?)
        `, [nombre_call_center, ip_inicio, ip_fin, descripcion]);
        
        return res.json({
          success: true,
          message: 'Rango de IP agregado exitosamente',
          data: { id: result.insertId }
        });
      }

    } catch (error) {
      console.error('Error gestionando rangos de IP:', error);
      res.status(500).json({
        success: false,
        message: 'Error gestionando rangos de IP',
        error: error.message
      });
    }
  }

  // Actualizar rango IP
  static async updateIpRange(req, res) {
    try {
      const { id } = req.params;
      const { nombre_call_center, ip_inicio, ip_fin, descripcion, activo } = req.body;
      
      const updateQuery = `
        UPDATE ip_ranges_call_centers 
        SET nombre_call_center = ?, ip_inicio = ?, ip_fin = ?, descripcion = ?, activo = ?
        WHERE id = ?
      `;
      
      const [result] = await db.query(updateQuery, [
        nombre_call_center, ip_inicio, ip_fin, descripcion, activo, id
      ]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rango IP no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Rango IP actualizado exitosamente'
      });
      
    } catch (error) {
      console.error('Error actualizando rango IP:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando rango IP',
        error: error.message
      });
    }
  }

  // Eliminar rango IP
  static async deleteIpRange(req, res) {
    try {
      const { id } = req.params;
      
      const deleteQuery = `DELETE FROM ip_ranges_call_centers WHERE id = ?`;
      const [result] = await db.query(deleteQuery, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Rango IP no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Rango IP eliminado exitosamente'
      });
      
    } catch (error) {
      console.error('Error eliminando rango IP:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando rango IP',
        error: error.message
      });
    }
  }
}

module.exports = SessionAnalysisController;