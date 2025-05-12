// Updated models/EventModel.js
const db = require('../config/db');
const { validationResult } = require('express-validator');
const logEvento = require('../utils/logEvento');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const csv = require('csv-parser'); // Asegúrate de instalar este paquete: npm install csv-parser

// Constante para los tipos de eventos válidos
const TIPOS_VALIDOS = ['task', 'event', 'holiday', 'guardia', 'birthday', 'dayoff', 'gconect', 'vacation'];

// Obtener todos los eventos con filtros
exports.getEvents = async (req, res) => {
  try {
    const { type, start, end, q } = req.query;
    
    // Log para depuración
    console.log('Parámetros de filtro:', { type, start, end, q });
    
    let query = `
      SELECT e.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM eventos e
      LEFT JOIN usuarios u ON e.createdBy = u.id
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      // Verificar que el tipo sea válido
      if (!TIPOS_VALIDOS.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `El tipo '${type}' no es válido. Tipos válidos: ${TIPOS_VALIDOS.join(', ')}`
        });
      }
      
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

// Crear un nuevo evento - VERSIÓN CORREGIDA
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación:', errors.array());
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Log para depuración
    console.log('Datos recibidos para crear evento:', req.body);
    
    const { title, start, end, allDay, type, color, description, location } = req.body;
    const createdBy = req.user?.id;
    
    // Verificar que el tipo sea válido
    if (!TIPOS_VALIDOS.includes(type)) {
      console.log(`Tipo inválido: ${type}`);
      return res.status(400).json({
        success: false,
        message: `El tipo '${type}' no es válido. Tipos válidos: ${TIPOS_VALIDOS.join(', ')}`
      });
    }
    
    // Verificar posibles conflictos - solo para tipos específicos
    if (type === 'task' || type === 'event' || type === 'dayoff') {
      const [conflictingEvents] = await db.query(`
        SELECT * FROM eventos
        WHERE (
          (start < ? AND end > ?)
          OR (start = ?)
          OR (end = ?)
        )
        AND type IN ('task', 'event', 'dayoff')
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
        descripcion: `${getEventTypeText(type)} creado: ${title}`,
        id_usuario: createdBy
      });
    }

    const [newEvent] = await db.query('SELECT * FROM eventos WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: `${getEventTypeText(type)} creado correctamente`,
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

// Actualizar un evento - VERSIÓN CORREGIDA
exports.updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación al actualizar:', errors.array());
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Log para depuración
    console.log('Datos recibidos para actualizar evento:', req.body);
    
    const eventId = req.params.id;
    const { title, start, end, allDay, type, color, description, location, completed } = req.body;
    const userId = req.user?.id;

    const [existingEvents] = await db.query('SELECT * FROM eventos WHERE id = ?', [eventId]);
    if (existingEvents.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    // Verificar que el tipo sea válido si se está actualizando
    if (type && !TIPOS_VALIDOS.includes(type)) {
      console.log(`Tipo inválido en actualización: ${type}`);
      return res.status(400).json({
        success: false,
        message: `El tipo '${type}' no es válido. Tipos válidos: ${TIPOS_VALIDOS.join(', ')}`
      });
    }

    // Verificar posibles conflictos - solo para tipos que requieren verificación
    if ((type === 'task' || type === 'event' || type === 'dayoff' || 
         existingEvents[0].type === 'task' || existingEvents[0].type === 'event' || existingEvents[0].type === 'dayoff') && 
        (start || end)) {
      const startDate = start ? new Date(start) : existingEvents[0].start;
      const endDate = end ? new Date(end) : existingEvents[0].end;
      
      const [conflictingEvents] = await db.query(`
        SELECT * FROM eventos
        WHERE (
          (start < ? AND end > ?)
          OR (start = ?)
          OR (end = ?)
        )
        AND type IN ('task', 'event', 'dayoff')
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
      const tipoEvento = type || existingEvents[0].type;
      await logEvento({
        tipo_evento: 'ACTUALIZACIÓN',
        descripcion: `${getEventTypeText(tipoEvento)} actualizado: ${title || 'ID ' + eventId}`,
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
      message: `${getEventTypeText(updatedEvent[0].type)} actualizado correctamente`,
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

// Eliminar un evento - VERSIÓN CORREGIDA
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    console.log(`Intentando eliminar evento ID: ${eventId}`);

    const [existingEvents] = await db.query('SELECT * FROM eventos WHERE id = ?', [eventId]);
    if (existingEvents.length === 0) {
      console.log(`Evento ID: ${eventId} no encontrado`);
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    const eventTitle = existingEvents[0].title;
    const eventType = existingEvents[0].type;
    console.log(`Eliminando ${getEventTypeText(eventType)}: "${eventTitle}" (ID: ${eventId})`);

    // Ejecutar la consulta de eliminación con manejo de excepciones
    try {
      const [deleteResult] = await db.query('DELETE FROM eventos WHERE id = ?', [eventId]);
      
      // Verificar si se eliminó alguna fila
      if (deleteResult.affectedRows === 0) {
        console.log(`No se eliminó ninguna fila para el evento ID: ${eventId}`);
        return res.status(500).json({
          success: false,
          message: 'No se pudo eliminar el evento'
        });
      }
      
      console.log(`Evento ID: ${eventId} eliminado correctamente. Filas afectadas: ${deleteResult.affectedRows}`);
    } catch (dbError) {
      console.error('Error al ejecutar la consulta DELETE:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error en la base de datos al eliminar el evento',
        error: dbError.message
      });
    }

    if (userId) {
      await logEvento({
        tipo_evento: 'ELIMINACIÓN',
        descripcion: `${getEventTypeText(eventType)} eliminado: ${eventTitle}`,
        id_usuario: userId
      });
    }

    res.status(200).json({
      success: true,
      message: `${getEventTypeText(eventType)} eliminado correctamente`
    });
  } catch (error) {
    console.error('Error general al eliminar evento:', error);
    
    // Responder con el error
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
      AND type IN ('task', 'event', 'dayoff')
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

// Marcar una tarea como completada - VERSIÓN CORREGIDA
exports.completeTask = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { completed } = req.body;
    const userId = req.user?.id;

    console.log(`Intentando marcar evento ID ${eventId} como ${completed ? 'completado' : 'pendiente'}`);

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

// Obtener estadísticas de eventos - VERSIÓN CORREGIDA
exports.getEventStats = async (req, res) => {
  try {
    const [countsByType] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'event' THEN 1 ELSE 0 END) as eventos,
        SUM(CASE WHEN type = 'task' THEN 1 ELSE 0 END) as tareas,
        SUM(CASE WHEN type = 'holiday' THEN 1 ELSE 0 END) as feriados,
        SUM(CASE WHEN type = 'birthday' THEN 1 ELSE 0 END) as cumpleanos,
        SUM(CASE WHEN type = 'dayoff' THEN 1 ELSE 0 END) as diasAFavor,
        SUM(CASE WHEN type = 'gconect' THEN 1 ELSE 0 END) as gconect,
        SUM(CASE WHEN type = 'vacation' THEN 1 ELSE 0 END) as vacaciones,
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
        cumpleanos: countsByType[0].cumpleanos,
        diasAFavor: countsByType[0].diasAFavor,
        gconect: countsByType[0].gconect,
        vacaciones: countsByType[0].vacaciones,
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

// Exportar eventos en diferentes formatos (CSV, JSON, Excel) - VERSIÓN CORREGIDA
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
      // Verificar que el tipo sea válido
      if (!TIPOS_VALIDOS.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `El tipo '${type}' no es válido. Tipos válidos: ${TIPOS_VALIDOS.join(', ')}`
        });
      }
      
      query += ' AND e.type = ?';
      params.push(type);
    }
    
    if (start && end) {
      query += ' AND e.start BETWEEN ? AND ?';
      params.push(new Date(start), new Date(end));
    } else if (start) {
      query += ' AND e.start >= ?';
      params.push(new Date(start));
    } else if (end) {
      query += ' AND e.end <= ?';
      params.push(new Date(end));
    }
    
    query += ' ORDER BY e.start ASC';
    
    const [events] = await db.query(query, params);
    
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    let filePath;
    let fileName;
    
    switch (format) {
      case 'csv':
        filePath = path.join(tempDir, 'eventos.csv');
        fileName = 'eventos.csv';
        
        // Configurar escritor CSV
        const csvWriter = createCsvWriter({
          path: filePath,
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
            { id: 'completed', title: 'Completado' },
            { id: 'createdBy', title: 'Creado Por' },
            { id: 'usuario_nombre', title: 'Nombre Usuario' },
            { id: 'usuario_email', title: 'Email Usuario' }
          ]
        });
        
        // Escribir datos a CSV
        await csvWriter.writeRecords(events.map(event => ({
          ...event,
          start: new Date(event.start).toISOString(),
          end: new Date(event.end).toISOString(),
          allDay: event.allDay ? 'Sí' : 'No',
          completed: event.completed ? 'Sí' : 'No',
          type: event.type // Incluir el tipo tal cual
        })));
        break;
        
      case 'json':
        filePath = path.join(tempDir, 'eventos.json');
        fileName = 'eventos.json';
        
        // Guardar como JSON
        fs.writeFileSync(filePath, JSON.stringify(events.map(event => ({
          ...event,
          start: new Date(event.start).toISOString(),
          end: new Date(event.end).toISOString()
        })), null, 2));
        break;
        
      case 'excel':
        filePath = path.join(tempDir, 'eventos.xlsx');
        fileName = 'eventos.xlsx';
        
        // Crear workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Eventos');
        
        // Definir columnas
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Título', key: 'title', width: 30 },
          { header: 'Fecha Inicio', key: 'start', width: 20 },
          { header: 'Fecha Fin', key: 'end', width: 20 },
          { header: 'Todo el Día', key: 'allDay', width: 12 },
          { header: 'Tipo', key: 'type', width: 15 },
          { header: 'Tipo (es)', key: 'tipo_es', width: 20 },
          { header: 'Color', key: 'color', width: 12 },
          { header: 'Descripción', key: 'description', width: 40 },
          { header: 'Ubicación', key: 'location', width: 25 },
          { header: 'Completado', key: 'completed', width: 12 },
          { header: 'Nombre Usuario', key: 'usuario_nombre', width: 25 },
          { header: 'Email Usuario', key: 'usuario_email', width: 25 }
        ];
        
        // Añadir datos
        events.forEach(event => {
          worksheet.addRow({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
            allDay: event.allDay ? 'Sí' : 'No',
            completed: event.completed ? 'Sí' : 'No',
            type: event.type, // Código del tipo
            tipo_es: getEventTypeText(event.type) // Nombre del tipo en español
          });
        });
        
        // Aplicar estilos
        worksheet.getRow(1).font = { bold: true };
        
        // Guardar
        await workbook.xlsx.writeFile(filePath);
        break;
    }
    
    // Enviar archivo
    res.download(filePath, fileName, err => {
      if (err) {
        console.error('Error al descargar archivo:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al descargar el archivo',
          error: err.message
        });
      }
      
      // Eliminar archivo temporal después de enviarlo
      setTimeout(() => {
        fs.unlink(filePath, err => {
          if (err) console.error('Error al eliminar archivo temporal:', err);
        });
      }, 5000);
    });
  } catch (error) {
    console.error('Error al exportar eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar los eventos',
      error: error.message
    });
  }
};

// Importar eventos desde un archivo - VERSIÓN CORREGIDA
exports.importEvents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let events = [];
    
    // Procesar archivo según su formato
    if (fileExtension === '.csv') {
      // Importar desde CSV
      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', reject);
      });
      
      // Mapear datos CSV a formato de eventos
      events = results.map(row => {
        let start = new Date(row.start || row.fecha_inicio || row['Fecha Inicio'] || new Date());
        let end = new Date(row.end || row.fecha_fin || row['Fecha Fin'] || start);
        
        // Si hay problema con la zona horaria, ajustar
        if (isNaN(start.getTime())) start = new Date();
        if (isNaN(end.getTime())) end = new Date(start.getTime() + 3600000); // 1 hora después
        
        // Determinar el tipo de evento
        let type = (row.type || row.tipo || row['Tipo'] || 'event').toLowerCase();
        
        // Mapear a tipos válidos
        if (!TIPOS_VALIDOS.includes(type)) {
          // Intenta mapear equivalentes en español a códigos
          if (['tarea', 'tareas'].includes(type)) type = 'task';
          else if (['evento', 'eventos'].includes(type)) type = 'event';
          else if (['feriado', 'feriados', 'festivo', 'festivos'].includes(type)) type = 'holiday';
          else if (['guardia', 'guardias'].includes(type)) type = 'guardia';
          else if (['cumpleaños', 'cumple', 'cumples'].includes(type)) type = 'birthday';
          else if (['día a favor', 'dias a favor', 'día libre', 'dia libre'].includes(type)) type = 'dayoff';
          else if (['guardia de conectividad', 'g. conectividad', 'gconect'].includes(type)) type = 'gconect';
          else if (['vacaciones', 'vacacion', 'vacas'].includes(type)) type = 'vacation';
          else type = 'event'; // Fallback a evento por defecto
        }
        
        return {
          title: row.title || row.titulo || row['Título'] || 'Sin título',
          start,
          end,
          allDay: row.allDay === 'true' || row.allDay === 'Sí' || row['Todo el Día'] === 'true' || false,
          type,
          color: row.color || row.Color || null,
          description: row.description || row.descripcion || row['Descripción'] || null,
          location: row.location || row.ubicacion || row['Ubicación'] || null
        };
      });
      
    } else if (fileExtension === '.json') {
      // Importar desde JSON
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      if (Array.isArray(jsonData)) {
        events = jsonData.map(item => {
          // Determinar el tipo de evento
          let type = (item.type || 'event').toLowerCase();
          
          // Verificar y mapear el tipo
          if (!TIPOS_VALIDOS.includes(type)) {
            // Intenta mapear equivalentes en español a códigos
            if (['tarea', 'tareas'].includes(type)) type = 'task';
            else if (['evento', 'eventos'].includes(type)) type = 'event';
            else if (['feriado', 'feriados', 'festivo', 'festivos'].includes(type)) type = 'holiday';
            else if (['guardia', 'guardias'].includes(type)) type = 'guardia';
            else if (['cumpleaños', 'cumple', 'cumples'].includes(type)) type = 'birthday';
            else if (['día a favor', 'dias a favor', 'día libre', 'dia libre'].includes(type)) type = 'dayoff';
            else if (['guardia de conectividad', 'g. conectividad', 'gconect'].includes(type)) type = 'gconect';
            else if (['vacaciones', 'vacacion', 'vacas'].includes(type)) type = 'vacation';
            else type = 'event'; // Fallback a evento por defecto
          }
          
          return {
            title: item.title || 'Sin título',
            start: new Date(item.start || new Date()),
            end: new Date(item.end || new Date()),
            allDay: Boolean(item.allDay),
            type,
            color: item.color || null,
            description: item.description || null,
            location: item.location || null
          };
        });
      }
      
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Importar desde Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('El archivo Excel no contiene hojas');
      }
      
      // Obtener los encabezados (primera fila)
      const headers = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? cell.value.toString().toLowerCase() : '';
      });
      
      // Mapear columnas
      const findColumn = (possibleNames) => {
        for (const name of possibleNames) {
          const index = headers.findIndex(h => h.includes(name.toLowerCase()));
          if (index !== -1) return index + 1;
        }
        return -1;
      };
      
      const titleCol = findColumn(['title', 'titulo', 'título']);
      const startCol = findColumn(['start', 'inicio', 'fecha inicio']);
      const endCol = findColumn(['end', 'fin', 'fecha fin']);
      const allDayCol = findColumn(['allday', 'todo el día', 'todo el dia']);
      const typeCol = findColumn(['type', 'tipo']);
      const colorCol = findColumn(['color']);
      const descriptionCol = findColumn(['description', 'descripción', 'descripcion']);
      const locationCol = findColumn(['location', 'ubicación', 'ubicacion']);
      
      // Recorrer filas (saltando la primera que son encabezados)
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (row.values.filter(Boolean).length === 0) continue; // Saltar filas vacías
        
        let title = titleCol > 0 ? (row.getCell(titleCol).value || 'Sin título') : 'Sin título';
        
        // Extraer y validar fechas
        let start, end;
        if (startCol > 0) {
          const startValue = row.getCell(startCol).value;
          start = startValue instanceof Date ? startValue : new Date();
        } else {
          start = new Date();
        }
        
        if (endCol > 0) {
          const endValue = row.getCell(endCol).value;
          end = endValue instanceof Date ? endValue : new Date(start.getTime() + 3600000);
        } else {
          end = new Date(start.getTime() + 3600000); // 1 hora después por defecto
        }
        
        // Validar fechas
        if (isNaN(start.getTime())) start = new Date();
        if (isNaN(end.getTime())) end = new Date(start.getTime() + 3600000);
        
        // Determinar allDay
        let allDay = false;
        if (allDayCol > 0) {
          const allDayValue = row.getCell(allDayCol).value;
          allDay = allDayValue === true || 
                  allDayValue === 'true' || 
                  allDayValue === 'Sí' || 
                  allDayValue === 'si' || 
                  allDayValue === 'yes';
        }
        
        // Determinar tipo
        let type = 'event';
        if (typeCol > 0) {
          const typeValue = row.getCell(typeCol).value;
          if (typeValue) {
            const lowerType = typeValue.toString().toLowerCase();
            
            // Verificar si el tipo ya es válido
            if (TIPOS_VALIDOS.includes(lowerType)) {
              type = lowerType;
            } else {
              // Mapear a tipos válidos
              if (['tarea', 'tareas'].includes(lowerType)) type = 'task';
              else if (['evento', 'eventos'].includes(lowerType)) type = 'event';
              else if (['feriado', 'feriados', 'festivo', 'festivos'].includes(lowerType)) type = 'holiday';
              else if (['guardia', 'guardias'].includes(lowerType)) type = 'guardia';
              else if (['cumpleaños', 'cumple', 'cumples'].includes(lowerType)) type = 'birthday';
              else if (['día a favor', 'dias a favor', 'día libre', 'dia libre'].includes(lowerType)) type = 'dayoff';
              else if (['guardia de conectividad', 'g. conectividad', 'gconect'].includes(lowerType)) type = 'gconect';
              else if (['vacaciones', 'vacacion', 'vacas'].includes(lowerType)) type = 'vacation';
              else type = 'event'; // Fallback a evento por defecto
            }
          }
        }
        
        // Armar el objeto evento
        events.push({
          title,
          start,
          end,
          allDay,
          type,
          color: colorCol > 0 ? row.getCell(colorCol).value || null : null,
          description: descriptionCol > 0 ? row.getCell(descriptionCol).value || null : null,
          location: locationCol > 0 ? row.getCell(locationCol).value || null : null
        });
      }
    }
    
    // Validar y filtrar eventos inválidos
    events = events.filter(event => 
      event.title && 
      !isNaN(new Date(event.start).getTime()) && 
      !isNaN(new Date(event.end).getTime())
    );
    
    if (events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudieron importar eventos válidos del archivo'
      });
    }
    
    // Insertar eventos en la base de datos
    let insertedCount = 0;
    for (const event of events) {
      try {
        const query = `
          INSERT INTO eventos 
          (title, start, end, allDay, type, color, description, location, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const [result] = await db.query(query, [
          event.title,
          event.start,
          event.end,
          event.allDay || false,
          event.type || 'event',
          event.color || null,
          event.description || null,
          event.location || null
        ]);
        
        if (result.insertId) insertedCount++;
      } catch (err) {
        console.error('Error al insertar evento:', err, event);
        // Continuar con el siguiente evento
      }
    }
    
    // Eliminar el archivo temporal
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      success: true,
      message: `Se importaron ${insertedCount} eventos correctamente`,
      count: insertedCount,
      total: events.length
    });
    
  } catch (error) {
    console.error('Error al importar eventos:', error);
    
    // Limpiar el archivo si existe
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error al eliminar archivo temporal:', e);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al importar eventos',
      error: error.message
    });
  }
};

// Función auxiliar para obtener el texto del tipo de evento
function getEventTypeText(type) {
  switch (type) {
    case 'task':
      return 'Tarea';
    case 'event':
      return 'Evento';
    case 'holiday':
      return 'Feriado';
    case 'guardia':
      return 'Guardia';
    case 'birthday':
      return 'Cumpleaños';
    case 'dayoff':
      return 'Día a Favor';
    case 'gconect':
      return 'Guardia de Conectividad';
    case 'vacation':
      return 'Vacaciones';
    default:
      return type;
  }
}