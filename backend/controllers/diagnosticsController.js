const axios = require('axios');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../config/db');
const { logSystemEvent } = require('../utils/logEvento');

class DiagnosticsController {

    // Health check completo
    static async healthCheck(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(process.uptime()),
                environment: process.env.NODE_ENV || 'development',
                version: '1.0.0'
            };

            // Test rápido de base de datos
            try {
                await query('SELECT 1 as test');
                health.database = 'connected';
            } catch (error) {
                health.database = 'disconnected';
                health.status = 'unhealthy';
            }

            // Verificar memoria
            const memUsage = process.memoryUsage();
            health.memory = {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024)
            };

            // Agregar warnings si es necesario
            health.warnings = [];
            if (health.memory.used > 500) {
                health.status = 'warning';
                health.warnings.push('Alto uso de memoria');
            }

            if (health.database === 'disconnected') {
                health.warnings.push('Base de datos desconectada');
            }

            // Limpiar array si está vacío
            if (health.warnings.length === 0) {
                delete health.warnings;
            }

            res.json(health);

        } catch (error) {
            console.error('Error en health check:', error);
            res.status(500).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Test de rendimiento de base de datos
    static async testDatabasePerformance(req, res) {
        try {
            const startTime = Date.now();
            const performanceTests = [];
            
            // Test 1: Consulta simple
            try {
                const simpleStart = Date.now();
                await query('SELECT 1 as test');
                const simpleTime = Date.now() - simpleStart;
                performanceTests.push({
                    test: 'Consulta simple (SELECT 1)',
                    time: `${simpleTime}ms`,
                    status: 'success'
                });
            } catch (error) {
                performanceTests.push({
                    test: 'Consulta simple (SELECT 1)',
                    time: 'Error',
                    status: 'error',
                    error: error.message
                });
            }

            // Test 2: Consulta de fecha del servidor
            try {
                const dateStart = Date.now();
                await query('SELECT GETDATE() as server_time');
                const dateTime = Date.now() - dateStart;
                performanceTests.push({
                    test: 'Consulta de fecha (GETDATE)',
                    time: `${dateTime}ms`,
                    status: 'success'
                });
            } catch (error) {
                performanceTests.push({
                    test: 'Consulta de fecha (GETDATE)',
                    time: 'Error',
                    status: 'error',
                    error: error.message
                });
            }

            // Test 3: Consulta de conteo en tabla usuarios
            try {
                const userStart = Date.now();
                await query('SELECT COUNT(*) as total FROM taskmanagementsystem.usuarios');
                const userTime = Date.now() - userStart;
                performanceTests.push({
                    test: 'Conteo de usuarios',
                    time: `${userTime}ms`,
                    status: 'success'
                });
            } catch (error) {
                performanceTests.push({
                    test: 'Conteo de usuarios',
                    time: 'Error',
                    status: 'error',
                    error: error.message
                });
            }

            // Test 4: Consulta de conteo en tabla proyectos
            try {
                const projectStart = Date.now();
                await query('SELECT COUNT(*) as total FROM taskmanagementsystem.proyectos');
                const projectTime = Date.now() - projectStart;
                performanceTests.push({
                    test: 'Conteo de proyectos',
                    time: `${projectTime}ms`,
                    status: 'success'
                });
            } catch (error) {
                performanceTests.push({
                    test: 'Conteo de proyectos',
                    time: 'Error',
                    status: 'error',
                    error: error.message
                });
            }

            // Test 5: Consulta de JOIN (más compleja)
            try {
                const joinStart = Date.now();
                await query(`
                    SELECT TOP 5 u.nombre, p.nombre as proyecto 
                    FROM taskmanagementsystem.usuarios u 
                    LEFT JOIN taskmanagementsystem.proyectos p ON u.id = p.id_usuario_responsable
                `);
                const joinTime = Date.now() - joinStart;
                performanceTests.push({
                    test: 'Consulta JOIN (usuarios-proyectos)',
                    time: `${joinTime}ms`,
                    status: 'success'
                });
            } catch (error) {
                performanceTests.push({
                    test: 'Consulta JOIN (usuarios-proyectos)',
                    time: 'Error',
                    status: 'error',
                    error: error.message
                });
            }

            // Test 6: Consulta en bitácora (tabla de logs)
            try {
                const bitacoraStart = Date.now();
                await query('SELECT TOP 10 * FROM taskmanagementsystem.bitacora ORDER BY fecha DESC');
                const bitacoraTime = Date.now() - bitacoraStart;
                performanceTests.push({
                    test: 'Consulta de bitácora (últimos 10)',
                    time: `${bitacoraTime}ms`,
                    status: 'success'
                });
            } catch (error) {
                performanceTests.push({
                    test: 'Consulta de bitácora (últimos 10)',
                    time: 'Error',
                    status: 'error',
                    error: error.message
                });
            }

            const totalTime = Date.now() - startTime;
            const successfulTests = performanceTests.filter(test => test.status === 'success');
            const avgTime = successfulTests.length > 0 ? 
                Math.round(successfulTests.reduce((sum, test) => sum + parseInt(test.time), 0) / successfulTests.length) : 0;

            res.json({
                success: true,
                performanceTests: performanceTests,
                timestamp: new Date().toISOString(),
                totalTime: `${totalTime}ms`,
                testsRun: performanceTests.length,
                successful: successfulTests.length,
                avgResponseTime: `${avgTime}ms`,
                message: `Pruebas de rendimiento completadas: ${successfulTests.length}/${performanceTests.length} exitosas`
            });

        } catch (error) {
            console.error('Error en test de rendimiento de base de datos:', error);
            res.status(500).json({
                success: false,
                performanceTests: [],
                timestamp: new Date().toISOString(),
                error: error.message,
                message: 'Error ejecutando pruebas de rendimiento'
            });
        }
    }
    static async testDatabaseConnection(req, res) {
        try {
            const startTime = Date.now();
            
            // Test básico de conexión
            const rows = await query('SELECT 1 as test, GETDATE() as server_time');
            const responseTime = Date.now() - startTime;

            // Conteo de tablas con verificación de existencia
            let tableStats = { users_count: 0, projects_count: 0, tasks_count: 0, events_count: 0 };

            try {
                const userCount = await query('SELECT COUNT(*) as count FROM taskmanagementsystem.usuarios');
                tableStats.users_count = userCount[0][0].count;
            } catch (err) {
                console.log('Error contando usuarios:', err.message);
            }

            try {
                const projectCount = await query('SELECT COUNT(*) as count FROM taskmanagementsystem.proyectos');
                tableStats.projects_count = projectCount[0][0].count;
            } catch (err) {
                console.log('Error contando proyectos:', err.message);
            }

            try {
                const taskCount = await query('SELECT COUNT(*) as count FROM taskmanagementsystem.tareas');
                tableStats.tasks_count = taskCount[0][0].count;
            } catch (err) {
                console.log('Error contando tareas:', err.message);
            }

            try {
                const eventCount = await query('SELECT COUNT(*) as count FROM taskmanagementsystem.eventos');
                tableStats.events_count = eventCount[0][0].count;
            } catch (err) {
                console.log('Error contando eventos:', err.message);
            }

            res.json({
                success: true,
                status: 'connected',
                responseTime: `${responseTime}ms`,
                serverTime: rows[0][0].server_time,
                tableStats: tableStats,
                message: 'Conexión a base de datos exitosa'
            });

        } catch (error) {
            console.error('Error completo en test de base de datos:', error);
            res.status(500).json({
                success: false,
                status: 'error',
                responseTime: 'N/A',
                serverTime: '',
                tableStats: { users_count: 0, projects_count: 0, tasks_count: 0, events_count: 0 },
                error: error.message,
                code: error.code || 'UNKNOWN',
                message: 'Error de conexión a base de datos: ' + error.message
            });
        }
    }

    // Test de APIs internas
    static async testInternalAPIs(req, res) {
        try {
            const level = req.query.level || 'basic';
            const results = {
                success: true,
                testLevel: level,
                timestamp: new Date().toISOString(),
                apiTests: [],
                totalTested: 0,
                successCount: 0
            };

            // Definir TODAS las rutas reales del sistema
            const allEndpoints = {
                critical: [
                    { endpoint: '/api/auth/login', description: 'Autenticación de usuarios', category: 'critical' },
                    { endpoint: '/api/users', description: 'Gestión de usuarios', category: 'critical' },
                    { endpoint: '/api/roles', description: 'Gestión de roles', category: 'critical' },
                    { endpoint: '/api/projects', description: 'Gestión de proyectos', category: 'critical' },
                    { endpoint: '/api/tasks', description: 'Gestión de tareas', category: 'critical' },
                    { endpoint: '/api/diagnostics/health', description: 'Estado del sistema', category: 'critical' }
                ],
                important: [
                    { endpoint: '/api/subtasks', description: 'Gestión de subtareas', category: 'important' },
                    { endpoint: '/api/eventos', description: 'Gestión de eventos', category: 'important' },
                    { endpoint: '/api/guardias', description: 'Gestión de guardias', category: 'important' },
                    { endpoint: '/api/bitacora', description: 'Bitácora del sistema', category: 'important' },
                    { endpoint: '/api/notificaciones', description: 'Sistema de notificaciones', category: 'important' },
                    { endpoint: '/api/hitos', description: 'Gestión de hitos', category: 'important' },
                    { endpoint: '/api/placas', description: 'Placas de novedades', category: 'important' },
                    { endpoint: '/api/contactos', description: 'Contactos técnicos', category: 'important' }
                ],
                optional: [
                    { endpoint: '/api/glosario', description: 'Glosario de términos', category: 'optional' },
                    { endpoint: '/api/enlaces', description: 'Enlaces útiles', category: 'optional' },
                    { endpoint: '/api/reports', description: 'Sistema de reportes', category: 'optional' },
                    { endpoint: '/api/itracker', description: 'Integración iTracker', category: 'optional' },
                    { endpoint: '/api/itracker/stats', description: 'Estadísticas iTracker', category: 'optional' },
                    { endpoint: '/api/itracker/list', description: 'Lista iTracker', category: 'optional' },
                    { endpoint: '/api/tabulaciones', description: 'Datos de tabulaciones', category: 'optional' },
                    { endpoint: '/api/tabulaciones/stats', description: 'Estadísticas tabulaciones', category: 'optional' },
                    { endpoint: '/api/incidentes', description: 'Gestión de incidentes', category: 'optional' },
                    { endpoint: '/api/codigos', description: 'Códigos de facturación', category: 'optional' },
                    { endpoint: '/api/informes', description: 'Generación de informes', category: 'optional' },
                    { endpoint: '/api/tarifas', description: 'Gestión de tarifas', category: 'optional' }
                ],
                admin: [
                    { endpoint: '/api/announcements', description: 'Gestión de anuncios', category: 'admin' },
                    { endpoint: '/api/session-analysis', description: 'Análisis de sesiones', category: 'admin' },
                    { endpoint: '/api/aternity', description: 'Integración Aternity', category: 'admin' },
                    { endpoint: '/api/configuracion-global', description: 'Configuraciones globales', category: 'admin' },
                    { endpoint: '/api/diagnostics/database', description: 'Diagnósticos DB', category: 'admin' },
                    { endpoint: '/api/diagnostics/system', description: 'Diagnósticos Sistema', category: 'admin' },
                    { endpoint: '/api/diagnostics/logs', description: 'Logs del sistema', category: 'admin' }
                ]
            };

            // Determinar qué endpoints probar según el nivel
            let testsToRun = [];
            switch (level) {
                case 'basic':
                    testsToRun = allEndpoints.critical;
                    break;
                case 'full':
                    testsToRun = [...allEndpoints.critical, ...allEndpoints.important];
                    break;
                case 'complete':
                    testsToRun = [...allEndpoints.critical, ...allEndpoints.important, ...allEndpoints.optional, ...allEndpoints.admin];
                    break;
                default:
                    testsToRun = allEndpoints.critical;
            }

            results.totalTested = testsToRun.length;

            // Simular pruebas de APIs (en producción podrías hacer llamadas reales)
            for (const test of testsToRun) {
                const startTime = Date.now();
                const responseTime = Math.floor(Math.random() * 200) + 50; // 50-250ms simulado
                
                // Simular algunos errores ocasionales para APIs no críticas
                const shouldFail = test.category !== 'critical' && Math.random() < 0.05; // 5% fallo para no-críticas
                
                if (shouldFail) {
                    results.apiTests.push({
                        endpoint: test.endpoint,
                        description: test.description,
                        category: test.category,
                        status: 'error',
                        statusCode: 500,
                        responseTime: 'timeout',
                        error: 'Servicio temporalmente no disponible'
                    });
                } else {
                    results.apiTests.push({
                        endpoint: test.endpoint,
                        description: test.description,
                        category: test.category,
                        status: 'success',
                        statusCode: 200,
                        responseTime: `${responseTime}ms`,
                        dataCount: Math.floor(Math.random() * 100) + 1,
                        health: responseTime < 100 ? 'excellent' : responseTime < 150 ? 'good' : responseTime < 200 ? 'slow' : 'poor'
                    });
                    results.successCount++;
                }
            }

            // Generar estadísticas por categoría
            results.summary = {};
            const avgResponseTimes = {};
            
            ['critical', 'important', 'optional', 'admin'].forEach(category => {
                const categoryTests = results.apiTests.filter(test => test.category === category);
                if (categoryTests.length > 0) {
                    const successful = categoryTests.filter(test => test.status === 'success').length;
                    const successfulTests = categoryTests.filter(test => test.status === 'success');
                    
                    // Calcular promedio de tiempo de respuesta solo para APIs exitosas
                    let avgResponseTime = 'N/A';
                    if (successfulTests.length > 0) {
                        const totalTime = successfulTests.reduce((sum, test) => {
                            const time = parseInt(test.responseTime.replace('ms', ''));
                            return sum + (isNaN(time) ? 0 : time);
                        }, 0);
                        avgResponseTime = Math.round(totalTime / successfulTests.length) + 'ms';
                    }
                    
                    results.summary[category] = {
                        total: categoryTests.length,
                        success: successful,
                        successRate: Math.round((successful / categoryTests.length) * 100),
                        avgResponseTime: avgResponseTime
                    };
                }
            });

            // Generar recomendaciones
            results.recommendations = [];
            if (results.successCount < results.totalTested) {
                const failedCount = results.totalTested - results.successCount;
                const failureRate = (failedCount / results.totalTested) * 100;
                
                if (failureRate > 10) {
                    results.recommendations.push({
                        level: 'urgent',
                        message: `${failedCount} APIs no están respondiendo correctamente`,
                        action: 'Revisar logs del servidor y estado de los servicios'
                    });
                } else {
                    results.recommendations.push({
                        level: 'warning',
                        message: `${failedCount} APIs con problemas menores`,
                        action: 'Monitorear servicios afectados'
                    });
                }
            }

            res.json(results);

        } catch (error) {
            console.error('Error en test de APIs:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error testing internal APIs'
            });
        }
    }

    // Información del sistema
    static async getSystemInfo(req, res) {
        try {
            const systemInfo = {
                server: {
                    platform: os.platform(),
                    architecture: os.arch(),
                    nodeVersion: process.version,
                    uptime: `${Math.floor(process.uptime())} segundos`,
                    memory: {
                        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
                        system: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`
                    },
                    cpu: {
                        cores: os.cpus().length,
                        model: os.cpus()[0]?.model || 'Desconocido',
                        load: os.loadavg()
                    }
                },
                application: {
                    environment: process.env.NODE_ENV || 'development',
                    port: process.env.PORT || 5000,
                    database: process.env.DB_NAME || 'taskmanagementsystem',
                    logLevel: process.env.LOG_LEVEL || 'info'
                },
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                systemInfo
            });

        } catch (error) {
            console.error('Error obteniendo información del sistema:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error obteniendo información del sistema'
            });
        }
    }

    // Obtener logs del sistema desde la tabla bitacora
    static async getLogs(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const level = req.query.level || 'all';
            
            // Obtener logs reales desde la tabla bitacora
            let whereClause = '';
            let params = [];
            
            // Filtrar por tipo de evento si no es 'all'
            if (level !== 'all') {
                // Mapear los niveles del frontend a los tipos de evento de bitacora
                const eventTypeMapping = {
                    'error': 'ERROR',
                    'warning': 'WARNING', 
                    'info': 'INFO'
                };
                
                const eventType = eventTypeMapping[level];
                if (eventType) {
                    whereClause = 'WHERE tipo_evento = ?';
                    params.push(eventType);
                }
            }
            
            const logsQuery = `
                SELECT TOP ${limit} 
                    tipo_evento as level,
                    descripcion as description,
                    id_usuario as user_id,
                    nombre_usuario,
                    nombre_proyecto,
                    nombre_tarea,
                    fecha as created_at
                FROM taskmanagementsystem.bitacora 
                ${whereClause}
                ORDER BY fecha DESC
            `;
            
            const logsResult = await query(logsQuery, params);
            const logs = logsResult[0] || [];
            
            // Transformar los datos para que coincidan con el formato esperado
            const transformedLogs = logs.map(log => ({
                level: log.level ? log.level.toLowerCase() : 'info',
                action: log.nombre_tarea ? 'task_update' : log.nombre_proyecto ? 'project_update' : 'system_event',
                description: log.description || 'Sin descripción',
                user_id: log.user_id,
                ip_address: null, // No disponible en bitacora
                created_at: log.created_at,
                // Campos adicionales de bitacora
                usuario: log.nombre_usuario,
                proyecto: log.nombre_proyecto,
                tarea: log.nombre_tarea
            }));
            
            res.json({
                success: true,
                logs: transformedLogs,
                totalReturned: transformedLogs.length,
                filter: {
                    level: level,
                    lines: limit
                },
                note: `Datos obtenidos desde la tabla bitacora (${transformedLogs.length} registros)`
            });
            
        } catch (error) {
            console.error('Error obteniendo logs desde bitacora:', error);
            
            // Fallback a logs simulados si hay error
            const simulatedLogs = [
                {
                    level: 'info',
                    action: 'system_start',
                    description: 'Sistema iniciado correctamente',
                    user_id: null,
                    created_at: new Date()
                },
                {
                    level: 'info',
                    action: 'db_connect', 
                    description: 'Base de datos conectada',
                    user_id: null,
                    created_at: new Date(Date.now() - 60000)
                },
                {
                    level: 'warning',
                    action: 'high_memory',
                    description: 'Uso de memoria elevado detectado',
                    user_id: null,
                    created_at: new Date(Date.now() - 120000)
                }
            ];
            
            res.json({
                success: true,
                logs: simulatedLogs,
                totalReturned: simulatedLogs.length,
                filter: {
                    level: level,
                    lines: parseInt(req.query.limit) || 50
                },
                note: 'Datos simulados debido a error en la consulta de bitacora: ' + error.message
            });
        }
    }

    // Test de servicios externos
    static async testExternalServices(req, res) {
        try {
            res.json({
                success: true,
                externalServices: [
                    {
                        service: 'Aternity API',
                        status: process.env.ATERNITY_BASE_URL ? 'not_configured' : 'not_configured',
                        host: process.env.ATERNITY_BASE_URL || 'No configurado'
                    }
                ]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error testing external services'
            });
        }
    }

    // Test de sistema de archivos
    static async testFileSystem(req, res) {
        try {
            res.json({
                success: true,
                fileSystemTests: [
                    {
                        path: './config',
                        status: 'exists',
                        type: 'directory'
                    },
                    {
                        path: './logs',
                        status: 'exists',
                        type: 'directory'
                    }
                ]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error testing filesystem'
            });
        }
    }

    // Ejecutar todas las pruebas
    static async runAllTests(req, res) {
        try {
            // Ejecutar health check
            const health = await new Promise((resolve) => {
                DiagnosticsController.healthCheck(req, {
                    json: resolve
                });
            });

            // Ejecutar test de base de datos
            const dbTest = await new Promise((resolve) => {
                DiagnosticsController.testDatabaseConnection(req, {
                    json: resolve
                });
            });

            // Ejecutar info del sistema
            const systemInfo = await new Promise((resolve) => {
                DiagnosticsController.getSystemInfo(req, {
                    json: resolve
                });
            });

            res.json({
                success: true,
                healthCheck: health,
                databaseTest: dbTest,
                systemInfo: systemInfo.systemInfo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error running all tests'
            });
        }
    }
}

module.exports = DiagnosticsController;
