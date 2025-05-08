// models/EventModel.js
const db = require('../config/db');
const { validationResult } = require('express-validator');
const logEvento = require('../utils/logEvento');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');

// Obtener todos los eventos con filtros
exports.getEvents = async (req, res) => {
  try {
    const { type, start, end, q } = req.query;
    
    let query = `
      SELECT e.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.createdBy = u.id
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }

    if (start && end) {
      query += ' AND ((e.start >= ? AND e.start <= ?) OR (e.end >= ? AND e.end <= ?) OR (e.start <= ? AND e.end >= ?))';
      params.push(start, end, start, end, start, end);
    } else if (start) {
      query += ' AND e.start >= ?';
      params.push(start);
    } else if (end) {
      query += ' AND e.end <= ?';
      params.push(end);
    }

    if (q) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY e.start ASC';

    const [events] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los eventos',
      error: error.message
    });
  }
};

// Obtener un evento por ID
exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;

    const query = `
      SELECT e.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.createdBy = u.id
      WHERE e.id = ?
    `;

    const [events] = await db.query(query, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: events[0]
    });
  } catch (error) {
    console.error('Error al obtener el evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el evento',
      error: error.message
    });
  }
};

// Crear un nuevo evento
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, start, end, allDay, type, color, description, location } = req.body;
    const createdBy = req.user?.id;

    // Verificar posibles conflictos
    if (type === 'task' || type === 'event') {
      const [conflictingEvents] = await db.query(`
        SELECT * FROM eventos
        WHERE (
          (start < ? AND end > ?)
          OR (start = ?)
          OR (end = ?)
        )
        AND type IN ('task', 'event')
      `, [end, start, start, end]);

      if (conflictingEvents.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Hay conflictos con otros eventos en este horario',
          conflicts: conflictingEvents
        });
      }
    }

    const query = `
      INSERT INTO eventos 
      (title, start, end, allDay, type, color, description, location, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await db.query(query, [
      title,
      new Date(start),
      new Date(end),
      allDay || false,
      type || 'event',
      color || null,
      description || null,
      location || null,
      createdBy || null
    ]);

    if (createdBy) {
      await logEvento({
        tipo_evento: 'CREACIÓN',
        descripcion: `Evento creado: ${title}`,
        id_usuario: createdBy
      });
    }

    const [newEvent] = await db.query('SELECT * FROM eventos WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Evento creado correctamente',
      data: newEvent[0]
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el evento',
      error: error.message
    });
  }
};

// Actualizar un evento
exports.updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const eventId = req.params.id;
    const { title, start, end, allDay, type, color, description, location, completed } = req.body;
    const userId = req.user?.id;

    const [existingEvents] = await db.query('SELECT * FROM eventos WHERE id = ?', [eventId]);
    if (existingEvents.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    // Verificar posibles conflictos
    if ((type === 'task' || type === 'event') && (start || end)) {
      const startDate = start ? new Date(start) : existingEvents[0].start;
      const endDate = end ? new Date(end) : existingEvents[0].end;
      
      const [conflictingEvents] = await db.query(`
        SELECT * FROM eventos
        WHERE (
          (start < ? AND end > ?)
          OR (start = ?)
          OR (end = ?)
        )
        AND type IN ('task', 'event')
        AND id != ?
      `, [endDate, startDate, startDate, endDate, eventId]);

      if (conflictingEvents.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Hay conflictos con otros eventos en este horario',
          conflicts: conflictingEvents
        });
      }
    }

    let query = 'UPDATE eventos SET updatedAt = NOW()';
    const updateFields = [];
    const params = [];

    if (title !== undefined) { updateFields.push('title = ?'); params.push(title); }
    if (start !== undefined) { updateFields.push('start = ?'); params.push(new Date(start)); }
    if (end !== undefined) { updateFields.push('end = ?'); params.push(new Date(end)); }
    if (allDay !== undefined) { updateFields.push('allDay = ?'); params.push(allDay); }
    if (type !== undefined) { updateFields.push('type = ?'); params.push(type); }
    if (color !== undefined) { updateFields.push('color = ?'); params.push(color); }
    if (description !== undefined) { updateFields.push('description = ?'); params.push(description); }
    if (location !== undefined) { updateFields.push('location = ?'); params.push(location); }
    if (completed !== undefined) { updateFields.push('completed = ?'); params.push(completed); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron campos para actualizar' });
    }

    query += ', ' + updateFields.join(', ') + ' WHERE id = ?';
    params.push(eventId);

    await db.query(query, params);

    if (userId) {
      await logEvento({
        tipo_evento: 'ACTUALIZACIÓN',
        descripcion: `Evento actualizado: ${title || 'ID ' + eventId}`,
        id_usuario: userId
      });
    }

    const [updatedEvent] = await db.query(`
      SELECT e.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [eventId]);

    res.status(200).json({
      success: true,
      message: 'Evento actualizado correctamente',
      data: updatedEvent[0]
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el evento',
      error: error.message
    });
  }
};

// Eliminar un evento
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    const [existingEvents] = await db.query('SELECT * FROM eventos WHERE id = ?', [eventId]);
    if (existingEvents.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    const eventTitle = existingEvents[0].title;
    await db.query('DELETE FROM eventos WHERE id = ?', [eventId]);

    if (userId) {
      await logEvento({
        tipo_evento: 'ELIMINACIÓN',
        descripcion: `Evento eliminado: ${eventTitle}`,
        id_usuario: userId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evento eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el evento',
      error: error.message
    });
  }
};

// Verificar conflictos de eventos
exports.checkConflicts = async (req, res) => {
  try {
    const { start, end, excludeId } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        success: false,
        message: 'Se requieren las fechas de inicio y fin' 
      });
    }
    
    let query = `
      SELECT * FROM eventos
      WHERE (
        (start < ? AND end > ?)
        OR (start = ?)
        OR (end = ?)
      )
      AND type IN ('task', 'event')
    `;
    
    const params = [new Date(end), new Date(start), new Date(start), new Date(end)];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [conflictingEvents] = await db.query(query, params);
    
    res.status(200).json({
      success: true,
      hasConflicts: conflictingEvents.length > 0,
      conflicts: conflictingEvents
    });
  } catch (error) {
    console.error('Error al verificar conflictos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar conflictos',
      error: error.message
    });
  }
};

// Marcar una tarea como completada
exports.completeTask = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { completed } = req.body;
    const userId = req.user?.id;

    const [event] = await db.query('SELECT * FROM eventos WHERE id = ?', [eventId]);
    
    if (event.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    
    if (event[0].type !== 'task') {
      return res.status(400).json({ success: false, message: 'Solo las tareas pueden marcarse como completadas' });
    }
    
    const completedValue = completed !== undefined ? completed : true;
    
    await db.query('UPDATE eventos SET completed = ?, updatedAt = NOW() WHERE id = ?', [completedValue, eventId]);

    if (userId) {
      await logEvento({
        tipo_evento: 'ACTUALIZACIÓN',
        descripcion: `Tarea marcada como ${completedValue ? 'completada' : 'pendiente'}: ${event[0].title}`,
        id_usuario: userId
      });
    }

    const [updatedEvent] = await db.query(`
      SELECT e.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.createdBy = u.id
      WHERE e.id = ?
    `, [eventId]);

    res.status(200).json({
      success: true,
      message: `Tarea marcada como ${completedValue ? 'completada' : 'pendiente'}`,
      data: updatedEvent[0]
    });
  } catch (error) {
    console.error('Error al marcar tarea como completada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar tarea como completada',
      error: error.message
    });
  }
};

// Obtener estadísticas de eventos
exports.getEventStats = async (req, res) => {
  try {
    const [countsByType] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'event' THEN 1 ELSE 0 END) as eventos,
        SUM(CASE WHEN type = 'task' THEN 1 ELSE 0 END) as tareas,
        SUM(CASE WHEN type = 'holiday' THEN 1 ELSE 0 END) as feriados,
        SUM(CASE WHEN type = 'task' AND completed = true THEN 1 ELSE 0 END) as tareasCompletadas
      FROM eventos
    `);

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [upcomingEvents] = await db.query(`
      SELECT COUNT(*) as proximosEventos
      FROM eventos
      WHERE start BETWEEN ? AND ?
    `, [today, nextWeek]);

    res.status(200).json({
      success: true,
      data: {
        total: countsByType[0].total,
        eventos: countsByType[0].eventos,
        tareas: countsByType[0].tareas,
        feriados: countsByType[0].feriados,
        tareasCompletadas: countsByType[0].tareasCompletadas,
        proximosEventos: upcomingEvents[0].proximosEventos
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de eventos',
      error: error.message
    });
  }
};

// Exportar eventos en diferentes formatos (CSV, JSON, Excel)
exports.exportEvents = async (req, res) => {
  try {
    const format = req.params.format;
    const { type, start, end } = req.query;
    
    // Validar el formato
    if (!['csv', 'json', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Formato no soportado. Use "csv", "json" o "excel".'
      });
    }
    
    // Consulta para obtener los eventos filtrados
    let query = `
      SELECT e.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.createdBy = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }
    
    if (start && end) {
      query += ' AND ((e.start >= ? AND e.start <= ?) OR (e.end >= ? AND e.end <= ?) OR (e.start <= ? AND e.end >= ?))';
      params.push(start, end, start, end, start, end);
    } else if (start) {
      query += ' AND e.start >= ?';
      params.push(start);
    } else if (end) {
      query += ' AND e.end <= ?';
      params.push(end);
    }
    
    query += ' ORDER BY e.start ASC';
    
    // Obtener eventos
    const [events] = await db.query(query, params);
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    switch (format) {
      case 'csv':
        // Exportar a CSV
        const csvPath = path.join(tempDir, 'eventos.csv');
        
        // Configurar escritor CSV
        const csvWriter = createCsvWriter({
          path: csvPath,
          header: [
            { id: 'id', title: 'ID' },
            { id: 'title', title: 'Título' },
            { id: 'start', title: 'Fecha Inicio' },
            { id: 'end', title: 'Fecha Fin' },
            { id: 'allDay', title: 'Todo el Día' },
            { id: 'type', title: 'Tipo' },
            { id: 'color', title: 'Color' },
            { id: 'description', title: 'Descripción' },
            { id: 'location', title: 'Ubicación' },
            { id: 'usuario_nombre', title: 'Creado Por' }
          ]
        });
        
        // Formatear datos para CSV
        const csvRecords = events.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start).toISOString(),
          end: new Date(event.end).toISOString(),
          allDay: event.allDay ? 'Sí' : 'No',
          type: event.type || 'event',
          color: event.color || '',
          description: event.description || '',
          location: event.location || '',
          usuario_nombre: event.usuario_nombre || ''
        }));
        
        // Escribir CSV
        await csvWriter.writeRecords(csvRecords);
        
        // Enviar archivo al cliente
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=eventos.csv');
        
        // Leer el archivo y enviarlo
        const fileStream = fs.createReadStream(csvPath);
        fileStream.pipe(res);
        
        // Configurar limpieza del archivo temporal
        fileStream.on('end', () => {
          fs.unlinkSync(csvPath);
        });
        break;
        
      case 'json':
        // Exportar a JSON
        // Formatear datos
        const jsonData = events.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start).toISOString(),
          end: new Date(event.end).toISOString(),
          allDay: Boolean(event.allDay),
          type: event.type || 'event',
          color: event.color || '',
          description: event.description || '',
          location: event.location || '',
          createdBy: event.createdBy,
          usuario_nombre: event.usuario_nombre || ''
        }));
        
        // Enviar directamente como JSON
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=eventos.json');
        res.json(jsonData);
        break;
        
      case 'excel':
        // Exportar a Excel
        const excelPath = path.join(tempDir, 'eventos.xlsx');
        
        // Crear nuevo workbook y hoja
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Eventos');
        
        // Definir columnas
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Título', key: 'title', width: 30 },
          { header: 'Fecha Inicio', key: 'start', width: 25 },
          { header: 'Fecha Fin', key: 'end', width: 25 },
          { header: 'Todo el Día', key: 'allDay', width: 12 },
          { header: 'Tipo', key: 'type', width: 15 },
          { header: 'Color', key: 'color', width: 15 },
          { header: 'Descripción', key: 'description', width: 40 },
          { header: 'Ubicación', key: 'location', width: 30 },
          { header: 'Creado Por', key: 'usuario_nombre', width: 20 }
        ];
        
        // Estilo para encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Añadir datos
        events.forEach(event => {
          worksheet.addRow({
            id: event.id,
            title: event.title,
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),
            allDay: event.allDay ? 'Sí' : 'No',
            type: event.type || 'event',
            color: event.color || '',
            description: event.description || '',
            location: event.location || '',
            usuario_nombre: event.usuario_nombre || ''
          });
        });
        
        // Formatear celdas de fecha
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            // Formatear columnas de fecha (índices 3 y 4 son fechas)
            row.getCell(3).numFmt = 'dd/mm/yyyy hh:mm:ss';
            row.getCell(4).numFmt = 'dd/mm/yyyy hh:mm:ss';
          }
        });
        
        // Guardar el archivo
        await workbook.xlsx.writeFile(excelPath);
        
        // Enviar archivo al cliente
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=eventos.xlsx');
        
        // Leer el archivo y enviarlo
        const excelStream = fs.createReadStream(excelPath);
        excelStream.pipe(res);
        
        // Configurar limpieza del archivo temporal
        excelStream.on('end', () => {
          fs.unlinkSync(excelPath);
        });
        break;
    }
    
    // Registrar en bitácora si el usuario está autenticado
    if (req.user) {
      await logEvento({
        tipo_evento: 'EXPORTACIÓN',
        descripcion: `Eventos exportados en formato ${format.toUpperCase()}`,
        id_usuario: req.user.id
      });
    }
  } catch (error) {
    console.error(`Error al exportar eventos en formato ${req.params.format}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar eventos',
      error: error.message
    });
  }
};

// Exportar eventos a CSV (versión original para compatibilidad)
exports.exportEventsToCSV = async (req, res) => {
  try {
    const { type, start, end } = req.query;
    
    let query = `
      SELECT e.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.createdBy = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }
    
    if (start && end) {
      query += ' AND ((e.start >= ? AND e.start <= ?) OR (e.end >= ? AND e.end <= ?) OR (e.start <= ? AND e.end >= ?))';
      params.push(start, end, start, end, start, end);
    } else if (start) {
      query += ' AND e.start >= ?';
      params.push(start);
    } else if (end) {
      query += ' AND e.end <= ?';
      params.push(end);
    }
    
    query += ' ORDER BY e.start ASC';
    
    const [events] = await db.query(query, params);
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Para mantener compatibilidad con la versión anterior,
    // redirigir a la nueva implementación con formato CSV
    return exports.exportEvents({
      ...req,
      params: { format: 'csv' }
    }, res);
  } catch (error) {
    console.error('Error al exportar eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar eventos',
      error: error.message
    });
  }
};

// Importar eventos desde un archivo
exports.importEvents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha proporcionado ningún archivo' });
    }
    
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const userId = req.user?.id;
    
    let events = [];
    
    // Procesar según el formato del archivo
    if (fileExtension === '.csv') {
      // Procesar CSV
      const csv = require('csv-parser');
      const results = [];
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });
      
      events = results.map(row => ({
        title: row.title || row.Título || '',
        start: new Date(row.start || row['Fecha Inicio'] || new Date()),
        end: new Date(row.end || row['Fecha Fin'] || new Date()),
        allDay: row.allDay === 'true' || row.allDay === 'Sí' || row['Todo el Día'] === 'true' || row['Todo el Día'] === 'Sí' || false,
        type: row.type || row.Tipo || 'event',
        color: row.color || row.Color || '',
        description: row.description || row.Descripción || '',
        location: row.location || row.Ubicación || '',
        createdBy: userId || null
      }));
    } else if (fileExtension === '.json') {
      // Procesar JSON
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      events = Array.isArray(jsonData) ? jsonData.map(item => ({
        title: item.title || '',
        start: new Date(item.start || new Date()),
        end: new Date(item.end || new Date()),
        allDay: Boolean(item.allDay),
        type: item.type || 'event',
        color: item.color || '',
        description: item.description || '',
        location: item.location || '',
        createdBy: userId || null
      })) : [];
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Procesar Excel
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.getWorksheet(1);
      
      // Obtener encabezados
      const headers = [];
      worksheet.getRow(1).eachCell(cell => {
        headers.push(cell.value);
      });
      
      // Mapear columnas estándar a sus posibles equivalentes en español
      const columnMappings = {
        title: ['title', 'Título', 'Titulo', 'Nombre'],
        start: ['start', 'Fecha Inicio', 'Inicio', 'FechaInicio'],
        end: ['end', 'Fecha Fin', 'Fin', 'FechaFin'],
        allDay: ['allDay', 'Todo el Día', 'TodoElDia', 'Día Completo'],
        type: ['type', 'Tipo', 'Categoría', 'Categoria'],
        color: ['color', 'Color'],
        description: ['description', 'Descripción', 'Descripcion', 'Detalles'],
        location: ['location', 'Ubicación', 'Ubicacion', 'Lugar']
      };
      
      // Función para encontrar el índice de la columna
      const findColumnIndex = (fieldName) => {
        const possibleNames = columnMappings[fieldName];
        for (const name of possibleNames) {
          const index = headers.findIndex(h => 
            h && typeof h === 'string' && h.toLowerCase() === name.toLowerCase()
          );
          if (index !== -1) return index;
        }
        return -1;
      };
      
      // Mapear índices de columnas
      const columnIndices = {
        title: findColumnIndex('title'),
        start: findColumnIndex('start'),
        end: findColumnIndex('end'),
        allDay: findColumnIndex('allDay'),
        type: findColumnIndex('type'),
        color: findColumnIndex('color'),
        description: findColumnIndex('description'),
        location: findColumnIndex('location')
      };
      
      // Procesar filas
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Saltar encabezados
          const event = {
            title: '',
            start: new Date(),
            end: new Date(),
            allDay: false,
            type: 'event',
            color: '',
            description: '',
            location: '',
            createdBy: userId || null
          };
          
          // Extraer valores para cada campo
          for (const [field, index] of Object.entries(columnIndices)) {
            if (index !== -1) {
              const cell = row.getCell(index + 1);
              if (cell && cell.value !== null && cell.value !== undefined) {
                if (field === 'start' || field === 'end') {
                  if (cell.value instanceof Date) {
                    event[field] = cell.value;
                  } else if (typeof cell.value === 'string') {
                    event[field] = new Date(cell.value);
                  } else if (typeof cell.value === 'number') {
                    event[field] = new Date(Math.round((cell.value - 25569) * 86400 * 1000));
                  }
                } else if (field === 'allDay') {
                  if (typeof cell.value === 'boolean') {
                    event[field] = cell.value;
                  } else if (typeof cell.value === 'string') {
                    event[field] = ['true', 'sí', 'si', 'yes', '1'].includes(cell.value.toLowerCase());
                  } else if (typeof cell.value === 'number') {
                    event[field] = cell.value === 1;
                  }
                } else {
                  event[field] = cell.value.toString();
                }
              }
            }
          }
          
          // Solo agregar eventos que tengan al menos título y fechas válidas
          if (event.title && !isNaN(event.start) && !isNaN(event.end)) {
            events.push(event);
          }
        }
      });
    }
    
    // Insertar eventos en la base de datos
    if (events.length > 0) {
      const insertQuery = `
        INSERT INTO eventos 
        (title, start, end, allDay, type, color, description, location, createdBy, createdAt, updatedAt)
        VALUES ?
      `;
      
      const values = events.map(event => [
        event.title,
        event.start,
        event.end,
        event.allDay || false,
        event.type || 'event',
        event.color || null,
        event.description || null,
        event.location || null,
        event.createdBy || null,
        new Date(),
        new Date()
      ]);
      
      await db.query(insertQuery, [values]);
      
      if (userId) {
        await logEvento({
          tipo_evento: 'IMPORTACIÓN',
          descripcion: `Importados ${events.length} eventos desde archivo ${fileExtension}`,
          id_usuario: userId
        });
      }
    }
    
    // Eliminar archivo temporal
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      success: true,
      message: 'Eventos importados correctamente',
      count: events.length
    });
  } catch (error) {
    console.error('Error al importar eventos:', error);
    
    // Limpiar archivo temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al importar eventos',
      error: error.message
    });
  }
};

// Importar eventos desde CSV (versión original para compatibilidad)
exports.importEventsFromCSV = async (req, res) => {
  // Redirigir a la nueva implementación para compatibilidad
  return exports.importEvents(req, res);
};