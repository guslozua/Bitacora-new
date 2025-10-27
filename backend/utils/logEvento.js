const db = require('../config/db');

/**
 * Tipos de eventos estándar para el sistema
 */
const EVENT_TYPES = {
  // Autenticación
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'ERROR_AUTH',
  
  // CRUD Operations
  CREATE_PROJECT: 'CREATE',
  UPDATE_PROJECT: 'UPDATE',
  DELETE_PROJECT: 'DELETE',
  CREATE_TASK: 'CREATE',
  UPDATE_TASK: 'UPDATE',
  DELETE_TASK: 'DELETE',
  CREATE_USER: 'CREATE',
  UPDATE_USER: 'UPDATE',
  DELETE_USER: 'DELETE',
  
  // Sistema
  SYSTEM_START: 'SYSTEM_START',
  SYSTEM_ERROR: 'ERROR_SYSTEM',
  DATABASE_ERROR: 'ERROR_DB',
  API_ERROR: 'ERROR_API',
  
  // Advertencias
  HIGH_MEMORY: 'WARNING',
  SLOW_QUERY: 'WARNING',
  UNAUTHORIZED_ACCESS: 'WARNING',
  
  // Mantenimiento
  BACKUP: 'BACKUP',
  CLEANUP: 'CLEANUP',
  DIAGNOSTICS_RUN: 'SYSTEM_START'
};

/**
 * Registra un evento en la bitácora con manejo mejorado para diagnósticos
 * @param {Object} params - Parámetros del evento
 * @param {Object} req - Request object para extraer IP y User-Agent (opcional)
 */
const logEvento = async (params, req = null) => {
    try {
        const {
            tipo_evento,
            descripcion,
            id_usuario,
            nombre_usuario = null,
            id_proyecto = null,
            nombre_proyecto = null,
            id_tarea = null,
            nombre_tarea = null,
            id_subtarea = null,
            nombre_subtarea = null
        } = params;

        // Validación básica
        if (!tipo_evento || !descripcion) {
            console.error('Error en logEvento: Faltan parámetros obligatorios', params);
            throw new Error('Tipo de evento y descripción son obligatorios');
        }

        // Extraer información adicional del request si está disponible
        let additionalInfo = '';
        if (req) {
            const ip = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers?.['user-agent'] || 'unknown';
            additionalInfo = ` [IP: ${ip}]`;
        }

        // Construir descripción enriquecida
        const enrichedDescription = descripcion + additionalInfo;

        // Log para depuración (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
            console.log('Registrando evento en bitácora:', {
                tipo_evento,
                descripcion: enrichedDescription,
                id_usuario,
                nombre_usuario,
                context: { id_proyecto, nombre_proyecto, id_tarea, nombre_tarea }
            });
        }

        // Inserción en la tabla bitácora
        // Usar sintaxis de 3 partes cuando no hay DB_NAME configurado (servidor remoto)
        const sql = `
        INSERT INTO [taskmanagementsystem].[taskmanagementsystem].[bitacora]
        (tipo_evento, descripcion, id_usuario, nombre_usuario, id_proyecto, nombre_proyecto,
         id_tarea, nombre_tarea, id_subtarea, nombre_subtarea, fecha)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
        `;
        
        const [result] = await db.query(sql, [
            tipo_evento,
            enrichedDescription,
            id_usuario || null,
            nombre_usuario,
            id_proyecto,
            nombre_proyecto,
            id_tarea,
            nombre_tarea,
            id_subtarea,
            nombre_subtarea
        ]);

        return result;
    } catch (error) {
        console.error('Error al registrar evento en bitácora:', error);
        // No lanzar el error para evitar que falle la operación principal
        return null;
    }
};

/**
 * Métodos de conveniencia para eventos comunes del sistema
 */
const logSystemEvent = {
    // Eventos de autenticación
    login: (userId, userName, req = null) => logEvento({
        tipo_evento: EVENT_TYPES.LOGIN,
        descripcion: `Usuario ${userName} inició sesión`,
        id_usuario: userId,
        nombre_usuario: userName
    }, req),

    logout: (userId, userName, req = null) => logEvento({
        tipo_evento: EVENT_TYPES.LOGOUT,
        descripcion: `Usuario ${userName} cerró sesión`,
        id_usuario: userId,
        nombre_usuario: userName
    }, req),

    loginFailed: (email, req = null) => logEvento({
        tipo_evento: EVENT_TYPES.LOGIN_FAILED,
        descripcion: `Intento de login fallido para: ${email}`,
        id_usuario: null,
        nombre_usuario: email
    }, req),

    // Eventos del sistema
    systemStart: () => logEvento({
        tipo_evento: EVENT_TYPES.SYSTEM_START,
        descripcion: 'Sistema iniciado correctamente',
        id_usuario: null,
        nombre_usuario: 'SYSTEM'
    }),

    databaseError: (error, req = null) => logEvento({
        tipo_evento: EVENT_TYPES.DATABASE_ERROR,
        descripcion: `Error de base de datos: ${error.message}`,
        id_usuario: null,
        nombre_usuario: 'SYSTEM'
    }, req),

    apiError: (endpoint, error, userId = null, req = null) => logEvento({
        tipo_evento: EVENT_TYPES.API_ERROR,
        descripcion: `Error en API ${endpoint}: ${error.message}`,
        id_usuario: userId,
        nombre_usuario: userId ? 'USER' : 'SYSTEM'
    }, req),

    // Eventos de advertencia
    highMemory: (usage) => logEvento({
        tipo_evento: EVENT_TYPES.HIGH_MEMORY,
        descripcion: `Uso elevado de memoria detectado: ${usage}MB`,
        id_usuario: null,
        nombre_usuario: 'SYSTEM'
    }),

    unauthorizedAccess: (userId, endpoint, req = null) => logEvento({
        tipo_evento: EVENT_TYPES.UNAUTHORIZED_ACCESS,
        descripcion: `Acceso no autorizado a ${endpoint}`,
        id_usuario: userId,
        nombre_usuario: 'USER'
    }, req),

    // Diagnósticos
    diagnosticsRun: (userId, userName, req = null) => logEvento({
        tipo_evento: EVENT_TYPES.DIAGNOSTICS_RUN,
        descripcion: 'Panel de diagnósticos ejecutado',
        id_usuario: userId,
        nombre_usuario: userName
    }, req)
};

module.exports = {
    logEvento,
    logSystemEvent,
    EVENT_TYPES
};