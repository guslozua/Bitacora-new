// Backend - Controlador de eventos actualizado
const express = require('express');
const router = express.Router();
const Event = require('../models/event.model'); // Asegúrate de crear este modelo con Sequelize
const multer = require('multer');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Permitir CSV, JSON y Excel
    if (
      file.mimetype === 'text/csv' || 
      file.originalname.endsWith('.csv') ||
      file.mimetype === 'application/json' || 
      file.originalname.endsWith('.json') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.originalname.endsWith('.xlsx') ||
      file.mimetype === 'application/vnd.ms-excel' || 
      file.originalname.endsWith('.xls')
    ) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos CSV, JSON y Excel'));
  }
});

// GET - Obtener todos los eventos
router.get('/', async (req, res) => {
  try {
    const { type, start, end, q } = req.query;
    let query = {};
    let whereClause = {};
    
    // Filtrar por tipo
    if (type) {
      whereClause.type = type;
    }
    
    // Filtrar por rango de fechas
    if (start && end) {
      whereClause.start = { [Event.sequelize.Op.gte]: new Date(start) };
      whereClause.end = { [Event.sequelize.Op.lte]: new Date(end) };
    }
    
    // Búsqueda por término
    if (q) {
      whereClause = {
        ...whereClause,
        [Event.sequelize.Op.or]: [
          { title: { [Event.sequelize.Op.like]: `%${q}%` } },
          { description: { [Event.sequelize.Op.like]: `%${q}%` } },
          { location: { [Event.sequelize.Op.like]: `%${q}%` } }
        ]
      };
    }
    
    const events = await Event.findAll({
      where: whereClause,
      order: [['start', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener eventos', 
      error: error.message 
    });
  }
});

// GET - Obtener un evento por ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Evento no encontrado' 
      });
    }
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener evento', 
      error: error.message 
    });
  }
});

// POST - Crear un nuevo evento
router.post('/', async (req, res) => {
  try {
    // Verificar si hay conflictos (opcional)
    if (req.body.type === 'task' || req.body.type === 'event' || req.body.type === 'dayoff') {
      const { start, end } = req.body;
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const conflictingEvents = await Event.findAll({
        where: {
          [Event.sequelize.Op.or]: [
            {
              start: { [Event.sequelize.Op.lt]: endDate },
              end: { [Event.sequelize.Op.gt]: startDate }
            },
            { start: startDate },
            { end: endDate }
          ],
          type: { [Event.sequelize.Op.in]: ['task', 'event', 'dayoff'] }
        }
      });
      
      if (conflictingEvents.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: 'Hay conflictos con otros eventos en este horario',
          conflicts: conflictingEvents
        });
      }
    }
    
    const newEvent = await Event.create({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: newEvent
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear evento', 
      error: error.message 
    });
  }
});

// PUT - Actualizar un evento existente
router.put('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Verificar si el evento existe
    const existingEvent = await Event.findByPk(eventId);
    if (!existingEvent) {
      return res.status(404).json({ 
        success: false,
        message: 'Evento no encontrado' 
      });
    }
    
    // Verificar conflictos (opcional)
    if (req.body.type === 'task' || req.body.type === 'event' || req.body.type === 'dayoff') {
      const { start, end } = req.body;
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const conflictingEvents = await Event.findAll({
        where: {
          id: { [Event.sequelize.Op.ne]: eventId },
          [Event.sequelize.Op.or]: [
            {
              start: { [Event.sequelize.Op.lt]: endDate },
              end: { [Event.sequelize.Op.gt]: startDate }
            },
            { start: startDate },
            { end: endDate }
          ],
          type: { [Event.sequelize.Op.in]: ['task', 'event', 'dayoff'] }
        }
      });
      
      if (conflictingEvents.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: 'Hay conflictos con otros eventos en este horario',
          conflicts: conflictingEvents
        });
      }
    }
    
    // Actualizar el evento
    await existingEvent.update({
      ...req.body,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: existingEvent
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar evento', 
      error: error.message 
    });
  }
});

// DELETE - Eliminar un evento
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findByPk(eventId);
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Evento no encontrado' 
      });
    }
    
    await event.destroy();
    res.status(200).json({ 
      success: true,
      message: 'Evento eliminado correctamente', 
      id: eventId 
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar evento', 
      error: error.message 
    });
  }
});

// GET - Verificar conflictos de eventos
router.get('/conflicts', async (req, res) => {
  try {
    const { start, end, excludeId } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        success: false,
        message: 'Se requieren las fechas de inicio y fin' 
      });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    let whereClause = {
      [Event.sequelize.Op.or]: [
        {
          start: { [Event.sequelize.Op.lt]: endDate },
          end: { [Event.sequelize.Op.gt]: startDate }
        },
        { start: startDate },
        { end: endDate }
      ],
      type: { [Event.sequelize.Op.in]: ['task', 'event', 'dayoff'] }
    };
    
    // Excluir el evento actual si se proporciona un ID
    if (excludeId) {
      whereClause.id = { [Event.sequelize.Op.ne]: excludeId };
    }
    
    const conflictingEvents = await Event.findAll({ where: whereClause });
    
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
});

// POST - Importar eventos desde diferentes formatos (CSV, JSON, Excel)
router.post('/import', upload.single('file'), async (req, res) => {
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
    
    // Procesar según el formato del archivo
    if (fileExtension === '.csv') {
      // Procesar CSV
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
        allDay: row.allDay === 'true' || row['Todo el Día'] === 'true' || false,
        type: row.type || row.Tipo || 'event',
        color: row.color || row.Color || '',
        description: row.description || row.Descripción || '',
        location: row.location || row.Ubicación || '',
        createdAt: new Date(),
        updatedAt: new Date()
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
        createdAt: new Date(),
        updatedAt: new Date()
      })) : [];
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Procesar Excel
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
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Extraer valores para cada campo
          for (const [field, index] of Object.entries(columnIndices)) {
            if (index !== -1) {
              const cell = row.getCell(index + 1);
              if (cell && cell.value !== null && cell.value !== undefined) {
                if (field === 'start' || field === 'end') {
                  // Manejar fechas
                  if (cell.value instanceof Date) {
                    event[field] = cell.value;
                  } else if (typeof cell.value === 'string') {
                    event[field] = new Date(cell.value);
                  } else if (typeof cell.value === 'number') {
                    // Excel guarda las fechas como números seriales
                    event[field] = new Date(Math.round((cell.value - 25569) * 86400 * 1000));
                  }
                } else if (field === 'allDay') {
                  // Manejar valores booleanos
                  if (typeof cell.value === 'boolean') {
                    event[field] = cell.value;
                  } else if (typeof cell.value === 'string') {
                    event[field] = ['true', 'sí', 'si', 'yes', '1'].includes(cell.value.toLowerCase());
                  } else if (typeof cell.value === 'number') {
                    event[field] = cell.value === 1;
                  }
                } else {
                  // Otros campos como texto
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
      await Event.bulkCreate(events);
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
});

// GET - Exportar eventos a diferentes formatos (CSV, JSON, Excel)
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const events = await Event.findAll();
    
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
        const csvWriter = createObjectCsvWriter({
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
            { id: 'location', title: 'Ubicación' }
          ]
        });
        
        // Formatear datos para CSV
        const csvRecords = events.map(event => ({
          id: event.id,
          title: event.title,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          allDay: event.allDay ? 'Sí' : 'No',
          type: event.type || 'event',
          color: event.color || '',
          description: event.description || '',
          location: event.location || ''
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
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          allDay: event.allDay,
          type: event.type || 'event',
          color: event.color || '',
          description: event.description || '',
          location: event.location || ''
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
          { header: 'ID', key: 'id', width: 15 },
          { header: 'Título', key: 'title', width: 30 },
          { header: 'Fecha Inicio', key: 'start', width: 25 },
          { header: 'Fecha Fin', key: 'end', width: 25 },
          { header: 'Todo el Día', key: 'allDay', width: 12 },
          { header: 'Tipo', key: 'type', width: 15 },
          { header: 'Color', key: 'color', width: 15 },
          { header: 'Descripción', key: 'description', width: 50 },
          { header: 'Ubicación', key: 'location', width: 30 }
        ];
        
        // Estilo para encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Añadir datos
        events.forEach(event => {
          worksheet.addRow({
            id: event.id,
            title: event.title,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            allDay: event.allDay ? 'Sí' : 'No',
            type: event.type || 'event',
            color: event.color || '',
            description: event.description || '',
            location: event.location || ''
          });
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
        
      default:
        // Formato no soportado
        return res.status(400).json({ 
          success: false,
          message: 'Formato no soportado. Use "csv", "json" o "excel".' 
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
});

// PATCH - Marcar una tarea como completada
router.patch('/:id/complete', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Verificar si el evento existe y es una tarea
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Evento no encontrado' 
      });
    }
    
    if (event.type !== 'task') {
      return res.status(400).json({ 
        success: false,
        message: 'Solo las tareas pueden marcarse como completadas' 
      });
    }
    
    // Actualizar el estado de completado
    const completed = req.body.completed !== undefined ? req.body.completed : true;
    
    await event.update({
      completed,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error al marcar tarea como completada:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al marcar tarea como completada', 
      error: error.message 
    });
  }
});

// GET - Buscar eventos
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false,
        message: 'Se requiere un término de búsqueda' 
      });
    }
    
    const events = await Event.findAll({
      where: {
        [Event.sequelize.Op.or]: [
          { title: { [Event.sequelize.Op.like]: `%${q}%` } },
          { description: { [Event.sequelize.Op.like]: `%${q}%` } },
          { location: { [Event.sequelize.Op.like]: `%${q}%` } }
        ]
      },
      order: [['start', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error al buscar eventos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar eventos', 
      error: error.message 
    });
  }
});

module.exports = router;