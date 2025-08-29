// controllers/guardias.controller.js - VERSIÓN COMPLETA PARA SQL SERVER
const sql = require('mssql');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Configuración de base de datos - debe coincidir con tu config
const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'taskmanagementsystem',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Función auxiliar para formatear fechas
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const GuardiasController = {
  // Obtener todas las guardias
  async getGuardias(req, res) {
    let pool;
    try {
      pool = await sql.connect(dbConfig);
      
      const { year, month, usuario, desde, hasta } = req.query;
      let query = `
        SELECT 
          id, 
          fecha, 
          usuario, 
          notas, 
          createdAt, 
          updatedAt
        FROM taskmanagementsystem.guardias
      `;
      
      const conditions = [];
      const request = pool.request();
      
      // Filtros por año y mes
      if (year) {
        conditions.push('YEAR(fecha) = @year');
        request.input('year', sql.Int, parseInt(year));
      }
      
      if (month) {
        conditions.push('MONTH(fecha) = @month');
        request.input('month', sql.Int, parseInt(month));
      }
      
      // Filtro por usuario
      if (usuario && usuario !== 'Todos') {
        conditions.push('usuario LIKE @usuario');
        request.input('usuario', sql.NVarChar, `%${usuario}%`);
      }
      
      // Filtros por rango de fechas
      if (desde) {
        conditions.push('fecha >= @desde');
        request.input('desde', sql.Date, new Date(desde));
      }
      
      if (hasta) {
        conditions.push('fecha <= @hasta');
        request.input('hasta', sql.Date, new Date(hasta));
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY fecha DESC, usuario ASC';
      
      console.log('🔍 Ejecutando query guardias:', query);
      const result = await request.query(query);
      
      console.log(`📊 Guardias encontradas: ${result.recordset.length}`);
      
      res.json({
        success: true,
        message: `${result.recordset.length} guardias encontradas`,
        data: result.recordset
      });
      
    } catch (error) {
      console.error('❌ Error en getGuardias:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las guardias',
        error: error.message
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error cerrando conexión:', closeError);
        }
      }
    }
  },

  // Obtener una guardia por ID
  async getGuardiaById(req, res) {
    let pool;
    try {
      const guardiaId = parseInt(req.params.id);
      
      if (!guardiaId || guardiaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID de guardia inválido'
        });
      }

      pool = await sql.connect(dbConfig);
      const request = pool.request();
      
      request.input('id', sql.Int, guardiaId);
      const result = await request.query(`
        SELECT 
          id, fecha, usuario, notas, createdAt, updatedAt
        FROM taskmanagementsystem.guardias 
        WHERE id = @id
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Guardia no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: result.recordset[0]
      });
      
    } catch (error) {
      console.error('❌ Error en getGuardiaById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la guardia',
        error: error.message
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error cerrando conexión:', closeError);
        }
      }
    }
  },

  // Crear nueva guardia (IDENTITY se maneja automáticamente)
  async createGuardia(req, res) {
    let pool;
    try {
      const { fecha, usuario, notas } = req.body;
      
      // Validaciones básicas
      if (!fecha || !usuario) {
        return res.status(400).json({
          success: false,
          message: 'Fecha y usuario son requeridos'
        });
      }

      // Validar formato de fecha
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido'
        });
      }

      pool = await sql.connect(dbConfig);
      
      // Verificar duplicados
      const checkRequest = pool.request();
      checkRequest.input('checkFecha', sql.Date, fechaObj);
      checkRequest.input('checkUsuario', sql.NVarChar(255), usuario.trim());
      
      const duplicateCheck = await checkRequest.query(`
        SELECT id FROM taskmanagementsystem.guardias 
        WHERE fecha = @checkFecha AND usuario = @checkUsuario
      `);
      
      if (duplicateCheck.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una guardia asignada para ${usuario.trim()} en la fecha ${fechaObj.toISOString().split('T')[0]}`
        });
      }
      
      // Insertar nueva guardia (sin incluir 'id' - IDENTITY lo maneja automáticamente)
      const insertRequest = pool.request();
      const insertQuery = `
        INSERT INTO taskmanagementsystem.guardias (fecha, usuario, notas)
        OUTPUT INSERTED.id, INSERTED.fecha, INSERTED.usuario, INSERTED.notas, 
               INSERTED.createdAt, INSERTED.updatedAt
        VALUES (@fecha, @usuario, @notas)
      `;
      
      insertRequest.input('fecha', sql.Date, fechaObj);
      insertRequest.input('usuario', sql.NVarChar(255), usuario.trim());
      insertRequest.input('notas', sql.NVarChar, notas || null);
      
      console.log('💾 Creando nueva guardia:', { fecha, usuario, notas });
      
      const result = await insertRequest.query(insertQuery);
      const nuevaGuardia = result.recordset[0];
      
      console.log('✅ Guardia creada con ID:', nuevaGuardia.id);
      
      res.status(201).json({
        success: true,
        message: 'Guardia creada exitosamente',
        data: nuevaGuardia
      });
      
    } catch (error) {
      console.error('❌ Error en createGuardia:', error);
      
      // Manejo específico de errores de SQL Server
      if (error.number === 2627 || error.number === 2601) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una guardia para esa fecha y usuario'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear la guardia',
        error: error.message
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error cerrando conexión:', closeError);
        }
      }
    }
  },

  // Actualizar guardia existente
  async updateGuardia(req, res) {
    let pool;
    try {
      const guardiaId = parseInt(req.params.id);
      const { fecha, usuario, notas } = req.body;
      
      if (!guardiaId || guardiaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID de guardia inválido'
        });
      }

      pool = await sql.connect(dbConfig);
      
      // Verificar que la guardia existe
      const checkRequest = pool.request();
      checkRequest.input('checkId', sql.Int, guardiaId);
      const checkResult = await checkRequest.query(
        'SELECT id, fecha, usuario FROM taskmanagementsystem.guardias WHERE id = @checkId'
      );
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Guardia no encontrada'
        });
      }

      const guardiaActual = checkResult.recordset[0];

      // Verificar duplicados si se está cambiando fecha o usuario
      if (fecha || usuario) {
        const nuevaFecha = fecha ? new Date(fecha) : new Date(guardiaActual.fecha);
        const nuevoUsuario = usuario ? usuario.trim() : guardiaActual.usuario.trim();
        
        if (fecha && isNaN(nuevaFecha.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Formato de fecha inválido'
          });
        }

        const duplicateRequest = pool.request();
        duplicateRequest.input('dupFecha', sql.Date, nuevaFecha);
        duplicateRequest.input('dupUsuario', sql.NVarChar(255), nuevoUsuario);
        duplicateRequest.input('dupId', sql.Int, guardiaId);
        
        const duplicateResult = await duplicateRequest.query(`
          SELECT id FROM taskmanagementsystem.guardias 
          WHERE fecha = @dupFecha AND usuario = @dupUsuario AND id != @dupId
        `);
        
        if (duplicateResult.recordset.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Ya existe una guardia asignada para ${nuevoUsuario} en esa fecha`
          });
        }
      }

      // Construir query de actualización dinámicamente
      const updateFields = [];
      const updateRequest = pool.request();
      updateRequest.input('id', sql.Int, guardiaId);
      
      if (fecha !== undefined) {
        const fechaObj = new Date(fecha);
        if (isNaN(fechaObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Formato de fecha inválido'
          });
        }
        updateFields.push('fecha = @fecha');
        updateRequest.input('fecha', sql.Date, fechaObj);
      }
      
      if (usuario !== undefined) {
        updateFields.push('usuario = @usuario');
        updateRequest.input('usuario', sql.NVarChar(255), usuario.trim());
      }
      
      if (notas !== undefined) {
        updateFields.push('notas = @notas');
        updateRequest.input('notas', sql.NVarChar, notas);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron campos para actualizar'
        });
      }
      
      updateFields.push('updatedAt = GETDATE()');
      
      const updateQuery = `
        UPDATE taskmanagementsystem.guardias 
        SET ${updateFields.join(', ')}
        OUTPUT INSERTED.id, INSERTED.fecha, INSERTED.usuario, INSERTED.notas,
               INSERTED.createdAt, INSERTED.updatedAt
        WHERE id = @id
      `;
      
      console.log('🔄 Actualizando guardia ID:', guardiaId);
      
      const result = await updateRequest.query(updateQuery);
      const guardiaActualizada = result.recordset[0];
      
      res.json({
        success: true,
        message: 'Guardia actualizada exitosamente',
        data: guardiaActualizada
      });
      
    } catch (error) {
      console.error('❌ Error en updateGuardia:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la guardia',
        error: error.message
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error cerrando conexión:', closeError);
        }
      }
    }
  },

  // Eliminar guardia
  async deleteGuardia(req, res) {
    let pool;
    try {
      const guardiaId = parseInt(req.params.id);
      
      if (!guardiaId || guardiaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID de guardia inválido'
        });
      }

      pool = await sql.connect(dbConfig);
      
      // Verificar que la guardia existe y obtener info antes de eliminar
      const checkRequest = pool.request();
      checkRequest.input('checkId', sql.Int, guardiaId);
      const checkResult = await checkRequest.query(`
        SELECT id, fecha, usuario 
        FROM taskmanagementsystem.guardias 
        WHERE id = @checkId
      `);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Guardia no encontrada'
        });
      }

      const guardiaInfo = checkResult.recordset[0];
      
      // Verificar si tiene incidentes asociados (si la tabla existe)
      try {
        const incidentesRequest = pool.request();
        incidentesRequest.input('guardiaId', sql.Int, guardiaId);
        const incidentesResult = await incidentesRequest.query(`
          SELECT COUNT(*) as count 
          FROM taskmanagementsystem.incidentes_guardia 
          WHERE id_guardia = @guardiaId
        `);
        
        if (incidentesResult.recordset[0].count > 0) {
          return res.status(409).json({
            success: false,
            message: 'No se puede eliminar la guardia porque tiene incidentes asociados'
          });
        }
      } catch (incidentesError) {
        // Si la tabla incidentes_guardia no existe, continuar con la eliminación
        console.log('Tabla incidentes_guardia no existe o no tiene relación, continuando...');
      }
      
      // Eliminar la guardia
      const deleteRequest = pool.request();
      deleteRequest.input('deleteId', sql.Int, guardiaId);
      await deleteRequest.query(
        'DELETE FROM taskmanagementsystem.guardias WHERE id = @deleteId'
      );
      
      console.log('🗑️ Guardia eliminada:', guardiaInfo);
      
      res.json({
        success: true,
        message: `Guardia del ${formatearFecha(guardiaInfo.fecha)} (${guardiaInfo.usuario}) eliminada exitosamente`
      });
      
    } catch (error) {
      console.error('❌ Error en deleteGuardia:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la guardia',
        error: error.message
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error cerrando conexión:', closeError);
        }
      }
    }
  },

  // Importar guardias desde archivo Excel - VERSIÓN SQL SERVER
  async importGuardias(req, res) {
    let pool;
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
      
      pool = await sql.connect(dbConfig);
      
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
                  
                  // Procesamiento de fechas
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
                  
                  // Procesamiento de nombres
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
                  
                  // Validaciones y creación de guardia
                  if (fechaJS && fechaJS instanceof Date && !isNaN(fechaJS.getTime())) {
                    
                    if (!nombre || nombre.trim() === '') {
                      errores.push(`Fila ${i + 2}, Columna ${j + 1}: Se encontró una fecha (${formatearFecha(fechaJS)}) pero no hay nombre de usuario asignado`);
                      continue;
                    }
                    
                    const usuarioLimpio = nombre.trim();
                    
                    if (usuarioLimpio.length < 2) {
                      errores.push(`Fila ${i + 2}: El nombre "${usuarioLimpio}" es demasiado corto para la fecha ${formatearFecha(fechaJS)}`);
                      continue;
                    }
                    
                    try {
                      // Verificar duplicados usando SQL Server
                      const checkRequest = pool.request();
                      checkRequest.input('checkFecha', sql.Date, fechaJS);
                      checkRequest.input('checkUsuario', sql.NVarChar(255), usuarioLimpio);
                      
                      const existeGuardia = await checkRequest.query(`
                        SELECT id FROM taskmanagementsystem.guardias 
                        WHERE fecha = @checkFecha AND usuario = @checkUsuario
                      `);
                      
                      if (existeGuardia.recordset.length > 0) {
                        guardiasOmitidas++;
                        errores.push(`✓ Guardia omitida: ${usuarioLimpio} ya tiene asignada la guardia del ${formatearFecha(fechaJS)}`);
                      } else {
                        // Crear nueva guardia
                        const insertRequest = pool.request();
                        insertRequest.input('fecha', sql.Date, fechaJS);
                        insertRequest.input('usuario', sql.NVarChar(255), usuarioLimpio);
                        insertRequest.input('notas', sql.NVarChar, `Importado desde Excel - ${mes} 2025`);
                        
                        const insertQuery = `
                          INSERT INTO taskmanagementsystem.guardias (fecha, usuario, notas)
                          OUTPUT INSERTED.id, INSERTED.fecha, INSERTED.usuario, INSERTED.notas
                          VALUES (@fecha, @usuario, @notas)
                        `;
                        
                        const result = await insertRequest.query(insertQuery);
                        const nuevaGuardia = result.recordset[0];
                        
                        guardiasImportadas.push(nuevaGuardia);
                        console.log(`✅ Guardia creada: ${usuarioLimpio} - ${fechaJS.toISOString().split('T')[0]}`);
                      }
                    } catch (error) {
                      let mensajeError = '';
                      
                      if (error.number === 2627 || error.number === 2601) {
                        mensajeError = `Guardia duplicada: ${usuarioLimpio} ya está asignado para el ${formatearFecha(fechaJS)}`;
                        guardiasOmitidas++;
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
        
        // Respuesta mejorada
        let mensaje = '';
        let estadoExito = true;
        
        if (guardiasImportadas.length > 0 && guardiasOmitidas === 0 && errores.length === 0) {
          mensaje = `Se importaron ${guardiasImportadas.length} guardias correctamente sin ningún problema.`;
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
          estadoExito = true;
        } else {
          mensaje = `No se pudieron importar guardias. Se encontraron ${errores.length} errores`;
          estadoExito = false;
        }
        
        res.status(estadoExito ? 200 : 400).json({
          success: estadoExito,
          message: mensaje,
          errors: errores.length > 0 ? errores : null,
          totalImportadas: guardiasImportadas.length,
          totalErrores: errores.length - guardiasOmitidas,
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
    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error cerrando conexión:', closeError);
        }
      }
    }
  }
};

module.exports = GuardiasController;