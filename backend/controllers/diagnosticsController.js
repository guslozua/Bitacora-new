const mysql = require('mysql2/promise');
const axios = require('axios');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { logSystemEvent } = require('../utils/logEvento'); // 🆕 AGREGADO

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
                const db = require('../config/db');
                await db.query('SELECT 1');
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

                // 🆕 Log de warning por alta memoria
                await logSystemEvent.highMemory(health.memory.used);
            }

            if (health.database === 'disconnected') {
                health.warnings.push('Base de datos desconectada');
            }

            // Limpiar array si está vacío
            if (health.warnings.length === 0) {
                delete health.warnings;
            }

            // 🆕 Log de ejecución de health check
            await logSystemEvent.diagnosticsRun(
                req.user?.id,
                req.user?.nombre || 'Admin',
                req
            );

            res.json(health);

        } catch (error) {
            console.error('Error en health check:', error);

            // 🆕 Log de error en health check
            await logSystemEvent.apiError('/diagnostics/health', error, req.user?.id, req);

            res.status(500).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Test de conectividad a base de datos
    static async testDatabaseConnection(req, res) {
        try {
            const startTime = Date.now();
            const db = require('../config/db');

            // Test básico de conexión (CORREGIDO: escapar palabra reservada)
            const [rows] = await db.query('SELECT 1 as test, NOW() as `current_time`');
            const responseTime = Date.now() - startTime;

            // 🆕 Log de warning si la conexión es lenta
            if (responseTime > 1000) {
                await logSystemEvent.logEvento({
                    tipo_evento: 'WARNING',
                    descripcion: `Conexión de base de datos lenta: ${responseTime}ms`,
                    id_usuario: req.user?.id,
                    nombre_usuario: req.user?.nombre || 'Admin'
                }, req);
            }

            // Verificar qué tablas existen primero
            const [existingTables] = await db.query('SHOW TABLES');
            console.log('Tablas disponibles:', existingTables.map(row => Object.values(row)[0]));

            // Conteo de tablas con verificación de existencia
            let tableStats = { users_count: 0, projects_count: 0, tasks_count: 0, events_count: 0 };

            try {
                // Verificar tabla usuarios
                const [userCount] = await db.query('SELECT COUNT(*) as count FROM usuarios');
                tableStats.users_count = userCount[0].count;
            } catch (err) {
                console.log('Error contando usuarios:', err.message);
            }

            try {
                // Verificar tabla proyectos
                const [projectCount] = await db.query('SELECT COUNT(*) as count FROM proyectos');
                tableStats.projects_count = projectCount[0].count;
            } catch (err) {
                console.log('Error contando proyectos:', err.message);
            }

            try {
                // Verificar tabla tareas
                const [taskCount] = await db.query('SELECT COUNT(*) as count FROM tareas');
                tableStats.tasks_count = taskCount[0].count;
            } catch (err) {
                console.log('Error contando tareas:', err.message);
            }

            try {
                // Verificar tabla eventos
                const [eventCount] = await db.query('SELECT COUNT(*) as count FROM eventos');
                tableStats.events_count = eventCount[0].count;
            } catch (err) {
                console.log('Error contando eventos:', err.message);
            }

            res.json({
                success: true,
                status: 'connected',
                responseTime: `${responseTime}ms`,
                serverTime: rows[0].current_time,
                tableStats: tableStats,
                message: 'Conexión a base de datos exitosa'
            });

        } catch (error) {
            console.error('Error completo en test de base de datos:', error);

            // 🆕 Log de error de base de datos
            await logSystemEvent.databaseError(error, req);

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

    // Test de rendimiento de base de datos
    static async testDatabasePerformance(req, res) {
        try {
            const db = require('../config/db');
            const tests = [];

            // Test 1: Query simple (CORREGIDO: usar tabla usuarios)
            let startTime = Date.now();
            await db.query('SELECT COUNT(*) FROM usuarios');
            const test1Time = Date.now() - startTime;
            tests.push({
                test: 'Simple COUNT query',
                time: `${test1Time}ms`
            });

            // Test 2: Query con JOIN (CORREGIDO: usar tablas correctas)
            startTime = Date.now();
            try {
                await db.query(`
          SELECT u.nombre, COUNT(p.id) as project_count 
          FROM usuarios u 
          LEFT JOIN proyectos p ON u.id = p.id_usuario_responsable 
          GROUP BY u.id 
          LIMIT 10
        `);
                const test2Time = Date.now() - startTime;
                tests.push({
                    test: 'JOIN query with GROUP BY',
                    time: `${test2Time}ms`
                });

                // 🆕 Log de warning si el JOIN es muy lento
                if (test2Time > 2000) {
                    await logSystemEvent.logEvento({
                        tipo_evento: 'WARNING',
                        descripcion: `Query JOIN muy lenta: ${test2Time}ms`,
                        id_usuario: req.user?.id,
                        nombre_usuario: req.user?.nombre || 'Admin'
                    }, req);
                }

            } catch (joinError) {
                tests.push({
                    test: 'JOIN query with GROUP BY',
                    time: 'Error',
                    error: 'Error en JOIN: ' + joinError.message
                });
            }

            // Test 3: Insert y Delete temporal en bitácora (usar bitácora en lugar de logs)
            startTime = Date.now();
            try {
                const [result] = await db.query(
                    'INSERT INTO bitacora (tipo_evento, descripcion, id_usuario, nombre_usuario, fecha) VALUES (?, ?, ?, ?, NOW())',
                    ['SYSTEM_TEST', 'Test de rendimiento - entrada temporal', req.user?.id, req.user?.nombre || 'Admin']
                );
                await db.query('DELETE FROM bitacora WHERE id = ?', [result.insertId]);
                tests.push({
                    test: 'INSERT and DELETE operation',
                    time: `${Date.now() - startTime}ms`
                });
            } catch (insertError) {
                tests.push({
                    test: 'INSERT and DELETE operation',
                    time: 'Error',
                    error: insertError.message
                });
            }

            res.json({
                success: true,
                performanceTests: tests,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error en pruebas de rendimiento:', error);

            // 🆕 Log de error en performance test
            await logSystemEvent.apiError('/diagnostics/database/performance', error, req.user?.id, req);

            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error en pruebas de rendimiento'
            });
        }
    }

    // 🚀 MÉTODO TESTINTERNALAPIS - VERSIÓN ÚNICA Y CORREGIDA CON ANUNCIOS
    static async testInternalAPIs(req, res) {
        try {
            const baseURL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`;
            const token = req.headers.authorization;
            const testLevel = req.query.level || 'basic';

            console.log(`🔍 Iniciando pruebas de APIs - Nivel: ${testLevel}`);

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de autorización requerido',
                    apiTests: [],
                    totalTested: 0,
                    successCount: 0,
                    timestamp: new Date().toISOString()
                });
            }

            // 🔴 APIs CRÍTICAS (siempre monitorear)
            const criticalEndpoints = [
                { endpoint: '/users', description: '👥 Gestión de usuarios', category: 'critical' },
                { endpoint: '/projects', description: '📋 Gestión de proyectos', category: 'critical' },
                { endpoint: '/tasks', description: '✅ Gestión de tareas', category: 'critical' },
                { endpoint: '/roles', description: '🔐 Gestión de roles', category: 'critical' }
            ];

            // 🟡 APIs IMPORTANTES (monitorear en producción)
            const importantEndpoints = [
                { endpoint: '/eventos', description: '📅 Gestión de eventos', category: 'important' },
                { endpoint: '/guardias', description: '👮 Gestión de guardias', category: 'important' },
                { endpoint: '/bitacora', description: '📝 Registro de bitácora', category: 'important' },
                { endpoint: '/hitos', description: '🎯 Gestión de hitos', category: 'important' },
                { endpoint: '/notificaciones/usuario/1', description: '🔔 Notificaciones (usuario 1)', category: 'important' },
                // 🆕 AGREGADO: APIs de anuncios
                { endpoint: '/announcements/active', description: '📢 Anuncios activos', category: 'important' },
                { endpoint: '/announcements/health', description: '📢 Estado del módulo de anuncios', category: 'important' }
            ];

            // 🟢 APIs OPCIONALES (monitorear si es necesario)
            const optionalEndpoints = [
                { endpoint: '/glosario', description: '📖 Glosario del sistema', category: 'optional' },
                { endpoint: '/enlaces', description: '🔗 Enlaces útiles', category: 'optional' },
                { endpoint: '/tarifas', description: '💰 Gestión de tarifas', category: 'optional' },
                { endpoint: '/tarifas/vigente?fecha=2025-05-15', description: '💰 Tarifa vigente (ej: 2024)', category: 'optional' },
                { endpoint: '/contactos/equipos', description: '👥 Contactos - Equipos', category: 'optional' },
                { endpoint: '/contactos/integrantes', description: '👥 Contactos - Integrantes', category: 'optional' },
                { endpoint: '/contactos/sistemas', description: '👥 Contactos - Sistemas', category: 'optional' },
                { endpoint: '/placas/list', description: '🏷️ Lista de placas', category: 'optional' },
                { endpoint: '/placas/stats', description: '🏷️ Estadísticas de placas', category: 'optional' },
                // 🆕 AGREGADO: APIs adicionales de anuncios
                { endpoint: '/announcements/stats', description: '📢 Estadísticas de anuncios', category: 'optional' },
                { endpoint: '/announcements/expiring', description: '📢 Anuncios próximos a expirar', category: 'optional' }
            ];

            // 🔧 APIs ADMINISTRATIVAS (solo admin)
            const adminEndpoints = [
                { endpoint: '/incidentes', description: '🚨 Gestión de incidentes', category: 'admin' },
                { endpoint: '/informes/incidentes', description: '📈 Informes de incidentes', category: 'admin' },
                { endpoint: '/informes/guardias', description: '📈 Informes de guardias', category: 'admin' },
                { endpoint: '/informes/liquidaciones', description: '📈 Informes de liquidaciones', category: 'admin' },
                { endpoint: '/itracker/stats', description: '📊 iTracker - Estadísticas', category: 'admin' },
                { endpoint: '/itracker/list', description: '📊 iTracker - Lista de registros', category: 'admin' },
                // 🆕 AGREGADO: APIs administrativas de anuncios
                { endpoint: '/announcements', description: '📢 Gestión completa de anuncios', category: 'admin' },
                { endpoint: '/announcements?page=1&limit=5', description: '📢 Lista paginada de anuncios', category: 'admin' }
            ];

            // Seleccionar endpoints según nivel
            let endpointsToTest = [...criticalEndpoints];
            if (testLevel === 'full') {
                endpointsToTest = [...criticalEndpoints, ...importantEndpoints];
            } else if (testLevel === 'complete') {
                endpointsToTest = [...criticalEndpoints, ...importantEndpoints, ...optionalEndpoints, ...adminEndpoints];
            }

            console.log(`📊 Total de endpoints a probar: ${endpointsToTest.length}`);
            endpointsToTest.forEach((ep, index) => {
                console.log(`${index + 1}. ${ep.endpoint} - ${ep.description}`);
            });

            const apiTests = [];
            let successCount = 0;

            // Probar cada endpoint individualmente con try-catch
            for (let i = 0; i < endpointsToTest.length; i++) {
                const { endpoint, description, category } = endpointsToTest[i];

                console.log(`\n🔍 Probando ${i + 1}/${endpointsToTest.length}: ${endpoint}`);

                try {
                    const startTime = Date.now();

                    const response = await axios({
                        method: 'GET',
                        url: `${baseURL}${endpoint}`,
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });

                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    const dataCount = DiagnosticsController.getDataCount(response.data);
                    const health = DiagnosticsController.getHealthStatus(responseTime, category);

                    if (response.status >= 200 && response.status < 300) {
                        successCount++;
                        console.log(`✅ ${endpoint}: ${response.status} - ${responseTime}ms - ${dataCount} registros`);

                        apiTests.push({
                            endpoint,
                            description,
                            category,
                            health,
                            status: 'success',
                            statusCode: response.status,
                            responseTime: `${responseTime}ms`,
                            dataCount,
                            error: null
                        });
                    } else {
                        console.log(`❌ ${endpoint}: ${response.status} - ${response.statusText}`);

                        apiTests.push({
                            endpoint,
                            description,
                            category,
                            health: 'error',
                            status: 'error',
                            statusCode: response.status,
                            responseTime: `${responseTime}ms`,
                            dataCount: 0,
                            error: response.statusText || 'Unknown error'
                        });
                    }

                } catch (error) {
                    console.log(`🚨 EXCEPCIÓN en ${endpoint}:`, error.message);

                    // Determinar el tipo de error
                    let errorMessage = error.message;
                    let statusCode = 'NETWORK_ERROR';

                    if (error.code === 'ECONNREFUSED') {
                        errorMessage = 'Conexión rechazada - Endpoint no disponible';
                        statusCode = 'CONNECTION_REFUSED';
                    } else if (error.code === 'ECONNABORTED') {
                        errorMessage = 'Timeout - El endpoint tardó más de 10 segundos';
                        statusCode = 'TIMEOUT';
                    } else if (error.response) {
                        errorMessage = error.response.data?.message || error.response.statusText;
                        statusCode = error.response.status;
                    }

                    apiTests.push({
                        endpoint,
                        description,
                        category,
                        health: 'error',
                        status: 'error',
                        statusCode,
                        responseTime: '0ms',
                        dataCount: 0,
                        error: errorMessage
                    });
                }
            }

            // Calcular estadísticas
            const stats = DiagnosticsController.calculateAPIStats(apiTests);
            const recommendations = DiagnosticsController.getRecommendations(stats, testLevel);

            const result = {
                success: true,
                apiTests,
                totalTested: endpointsToTest.length,
                successCount,
                timestamp: new Date().toISOString(),
                testLevel,
                stats,
                summary: {
                    critical: apiTests.filter(t => t.category === 'critical'),
                    important: apiTests.filter(t => t.category === 'important'),
                    optional: apiTests.filter(t => t.category === 'optional'),
                    admin: apiTests.filter(t => t.category === 'admin')
                },
                recommendations
            };

            console.log(`\n📊 RESULTADO FINAL:`);
            console.log(`✅ Exitosas: ${successCount}/${endpointsToTest.length}`);
            console.log(`❌ Fallidas: ${endpointsToTest.length - successCount}`);
            console.log(`📈 Tasa de éxito: ${((successCount / endpointsToTest.length) * 100).toFixed(1)}%`);

            // Log del evento
            try {
                await logSystemEvent.diagnosticsRun(
                    req.user?.id,
                    req.user?.nombre || 'Admin',
                    req
                );
            } catch (logError) {
                console.log('Warning: Could not log event:', logError.message);
            }

            return res.json(result);

        } catch (error) {
            console.error('🚨 ERROR GENERAL en testInternalAPIs:', error);

            try {
                await logSystemEvent.apiError(
                    '/diagnostics/apis/internal',
                    error,
                    req.user?.id,
                    req
                );
            } catch (logError) {
                console.log('Warning: Could not log error:', logError.message);
            }

            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor durante las pruebas de API',
                error: error.message,
                apiTests: [],
                totalTested: 0,
                successCount: 0,
                timestamp: new Date().toISOString()
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
                        model: os.cpus()[0]?.model || 'Unknown',
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

            // 🆕 Log de error obteniendo system info
            await logSystemEvent.apiError('/diagnostics/system/info', error, req.user?.id, req);

            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error obteniendo información del sistema'
            });
        }
    }

    // Verificar servicios externos
    static async testExternalServices(req, res) {
        try {
            const services = [];

            // Test de servicio de email (si está configurado)
            if (process.env.SMTP_HOST) {
                try {
                    const nodemailer = require('nodemailer');
                    const transporter = nodemailer.createTransporter({
                        host: process.env.SMTP_HOST,
                        port: process.env.SMTP_PORT || 587,
                        secure: false,
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASSWORD
                        }
                    });

                    await transporter.verify();
                    services.push({
                        service: 'Email Service',
                        status: 'available',
                        host: process.env.SMTP_HOST
                    });
                } catch (error) {
                    services.push({
                        service: 'Email Service',
                        status: 'unavailable',
                        error: error.message
                    });

                    // 🆕 Log de error en servicio de email
                    await logSystemEvent.logEvento({
                        tipo_evento: 'WARNING',
                        descripcion: `Servicio de email no disponible: ${error.message}`,
                        id_usuario: req.user?.id,
                        nombre_usuario: req.user?.nombre || 'Admin'
                    }, req);
                }
            } else {
                services.push({
                    service: 'Email Service',
                    status: 'not_configured',
                    error: 'SMTP no configurado'
                });
            }

            // Test de conexión a internet
            try {
                await axios.get('https://www.google.com', { timeout: 3000 });
                services.push({
                    service: 'Internet Connection',
                    status: 'available'
                });
            } catch (error) {
                services.push({
                    service: 'Internet Connection',
                    status: 'unavailable',
                    error: 'Sin conexión a internet'
                });

                // 🆕 Log de error en conexión a internet
                await logSystemEvent.logEvento({
                    tipo_evento: 'ERROR',
                    descripcion: 'Sin conexión a internet detectada',
                    id_usuario: req.user?.id,
                    nombre_usuario: req.user?.nombre || 'Admin'
                }, req);
            }

            // Test de DNS
            try {
                const dns = require('dns').promises;
                await dns.lookup('google.com');
                services.push({
                    service: 'DNS Resolution',
                    status: 'available'
                });
            } catch (error) {
                services.push({
                    service: 'DNS Resolution',
                    status: 'unavailable',
                    error: error.message
                });

                // 🆕 Log de error en DNS
                await logSystemEvent.logEvento({
                    tipo_evento: 'ERROR',
                    descripcion: `Error en resolución DNS: ${error.message}`,
                    id_usuario: req.user?.id,
                    nombre_usuario: req.user?.nombre || 'Admin'
                }, req);
            }

            res.json({
                success: true,
                externalServices: services,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error verificando servicios externos:', error);

            // 🆕 Log de error general en external services
            await logSystemEvent.apiError('/diagnostics/services/external', error, req.user?.id, req);

            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error verificando servicios externos',
                externalServices: []
            });
        }
    }

    // Verificar archivos y directorios importantes
    static async testFileSystem(req, res) {
        try {
            const fileSystemTests = [];

            // Verificar directorio uploads
            try {
                await fs.access('./uploads', fs.constants.F_OK);
                try {
                    await fs.access('./uploads', fs.constants.W_OK);
                    const uploadStats = await fs.stat('./uploads');
                    fileSystemTests.push({
                        path: './uploads',
                        status: 'accessible',
                        type: 'directory',
                        created: uploadStats.birthtime,
                        writable: true
                    });
                } catch (writeError) {
                    fileSystemTests.push({
                        path: './uploads',
                        status: 'exists',
                        type: 'directory',
                        error: 'No escribible'
                    });

                    // 🆕 Log de warning por directorio no escribible
                    await logSystemEvent.logEvento({
                        tipo_evento: 'WARNING',
                        descripcion: 'Directorio uploads existe pero no es escribible',
                        id_usuario: req.user?.id,
                        nombre_usuario: req.user?.nombre || 'Admin'
                    }, req);
                }
            } catch (error) {
                fileSystemTests.push({
                    path: './uploads',
                    status: 'missing',
                    error: 'Directorio no encontrado'
                });

                // 🆕 Log de error por directorio faltante
                await logSystemEvent.logEvento({
                    tipo_evento: 'ERROR',
                    descripcion: 'Directorio uploads no encontrado',
                    id_usuario: req.user?.id,
                    nombre_usuario: req.user?.nombre || 'Admin'
                }, req);
            }

            // Verificar archivos críticos
            const criticalFiles = [
                './package.json',
                './server.js',
                './config/db.js'
            ];

            for (const file of criticalFiles) {
                try {
                    await fs.access(file, fs.constants.F_OK);
                    const stats = await fs.stat(file);
                    fileSystemTests.push({
                        path: file,
                        status: 'exists',
                        size: `${stats.size} bytes`,
                        modified: stats.mtime
                    });
                } catch (error) {
                    fileSystemTests.push({
                        path: file,
                        status: 'missing',
                        error: 'Archivo no encontrado'
                    });

                    // 🆕 Log de error por archivo crítico faltante
                    await logSystemEvent.logEvento({
                        tipo_evento: 'ERROR',
                        descripcion: `Archivo crítico no encontrado: ${file}`,
                        id_usuario: req.user?.id,
                        nombre_usuario: req.user?.nombre || 'Admin'
                    }, req);
                }
            }

            res.json({
                success: true,
                fileSystemTests,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error verificando sistema de archivos:', error);

            // 🆕 Log de error en filesystem test
            await logSystemEvent.apiError('/diagnostics/filesystem', error, req.user?.id, req);

            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error verificando sistema de archivos',
                fileSystemTests: []
            });
        }
    }

    // 🆕 MÉTODO GETLOGS ACTUALIZADO PARA USAR BITÁCORA
    static async getLogs(req, res) {
        try {
            const { lines = 50, level = 'all' } = req.query;
            const db = require('../config/db');

            console.log('Obteniendo logs - lines:', lines, 'level:', level);

            let logs = [];

            try {
                // Query simple para probar
                let query = `
          SELECT 
            id,
            tipo_evento,
            descripcion,
            id_usuario,
            nombre_usuario,
            fecha
          FROM bitacora 
          ORDER BY fecha DESC 
          LIMIT ?
        `;

                const [rows] = await db.query(query, [parseInt(lines)]);

                console.log(`Encontrados ${rows.length} registros en bitácora`);

                // Mapeo simple
                logs = rows.map(row => ({
                    id: row.id,
                    level: row.tipo_evento.toLowerCase().includes('error') ? 'error' :
                        row.tipo_evento.toLowerCase().includes('warning') ? 'warning' : 'info',
                    action: row.tipo_evento,
                    description: row.descripcion + (row.nombre_usuario ? ` [Usuario: ${row.nombre_usuario}]` : ''),
                    user_id: row.id_usuario,
                    created_at: row.fecha
                }));

                console.log(`Logs procesados: ${logs.length}`);

            } catch (queryError) {
                console.error('Error en query de bitácora:', queryError);

                // Fallback a mock data
                logs = [
                    {
                        id: 1,
                        level: 'info',
                        action: 'SYSTEM_START',
                        description: 'Sistema iniciado correctamente [Fallback]',
                        user_id: null,
                        created_at: new Date()
                    }
                ];
                console.log('Usando datos fallback');
            }

            res.json({
                success: true,
                logs,
                totalReturned: logs.length,
                filter: { lines, level },
                timestamp: new Date().toISOString(),
                source: 'bitacora'
            });

        } catch (error) {
            console.error('Error general obteniendo logs:', error);

            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error obteniendo logs',
                logs: [],
                totalReturned: 0
            });
        }
    }

    // 🆕 MÉTODOS HELPERS - AL FINAL DE LA CLASE

    // Método helper para contar datos
    static getDataCount(data) {
        if (Array.isArray(data)) return data.length;
        if (Array.isArray(data?.data)) return data.data.length;
        if (data && typeof data === 'object') return Object.keys(data).length;
        return 'N/A';
    }

    // Método helper para determinar estado de salud
    static getHealthStatus(responseTime, category) {
        const thresholds = {
            critical: { good: 1000, warning: 2000 },
            important: { good: 2000, warning: 3000 },
            optional: { good: 3000, warning: 5000 },
            admin: { good: 5000, warning: 8000 }
        };

        const threshold = thresholds[category] || thresholds.optional;

        if (responseTime <= threshold.good) return 'excellent';
        if (responseTime <= threshold.warning) return 'good';
        return 'slow';
    }

    // Método helper para calcular estadísticas por categoría
    static calculateAPIStats(apiTests) {
        const categories = ['critical', 'important', 'optional', 'admin'];
        const stats = {};

        categories.forEach(category => {
            const categoryTests = apiTests.filter(t => t.category === category);
            const successCount = categoryTests.filter(t => t.status === 'success').length;

            stats[category] = {
                total: categoryTests.length,
                success: successCount,
                failed: categoryTests.length - successCount,
                successRate: categoryTests.length > 0 ? Math.round((successCount / categoryTests.length) * 100) : 0,
                avgResponseTime: DiagnosticsController.calculateAvgResponseTime(categoryTests)
            };
        });

        return stats;
    }

    // Método helper para calcular tiempo promedio de respuesta
    static calculateAvgResponseTime(tests) {
        const successfulTests = tests.filter(t => t.status === 'success' && t.responseTime !== 'N/A');
        if (successfulTests.length === 0) return 'N/A';

        const totalTime = successfulTests.reduce((sum, test) => {
            return sum + parseInt(test.responseTime.replace('ms', ''));
        }, 0);

        return `${Math.round(totalTime / successfulTests.length)}ms`;
    }

    // Método helper para generar recomendaciones
    static getRecommendations(stats, testLevel) {
        const recommendations = [];

        // 🔧 CORREGIR: Solo evaluar categorías que fueron realmente probadas
        if (stats.critical && stats.critical.total > 0) {
            if (stats.critical.successRate < 100) {
                recommendations.push({
                    level: 'urgent',
                    message: `APIs críticas con problemas: ${100 - stats.critical.successRate}% de fallos`,
                    action: 'Revisar inmediatamente las APIs de usuarios, proyectos y tareas'
                });
            }
        }

        // 🔧 CORREGIR: Solo evaluar APIs importantes si el testLevel las incluye
        if ((testLevel === 'full' || testLevel === 'complete') && stats.important && stats.important.total > 0) {
            if (stats.important.successRate < 90) {
                recommendations.push({
                    level: 'warning',
                    message: `APIs importantes con problemas: ${100 - stats.important.successRate}% de fallos`,
                    action: 'Revisar APIs de eventos, guardias, notificaciones y anuncios'
                });
            }
        }

        // 🔧 CORREGIR: Solo evaluar APIs opcionales si el testLevel las incluye
        if (testLevel === 'complete' && stats.optional && stats.optional.total > 0) {
            if (stats.optional.successRate < 80) {
                recommendations.push({
                    level: 'info',
                    message: `APIs opcionales con problemas: ${100 - stats.optional.successRate}% de fallos`,
                    action: 'Revisar APIs de contactos, placas, glosario y estadísticas de anuncios'
                });
            }
        }

        // 🔧 CORREGIR: Solo evaluar APIs admin si el testLevel las incluye
        if (testLevel === 'complete' && stats.admin && stats.admin.total > 0) {
            if (stats.admin.successRate < 80) {
                recommendations.push({
                    level: 'info',
                    message: `APIs administrativas con problemas: ${100 - stats.admin.successRate}% de fallos`,
                    action: 'Revisar APIs de incidentes, informes, iTracker y gestión de anuncios'
                });
            }
        }

        // Verificar tiempos de respuesta solo para APIs que fueron probadas
        if (stats.critical && stats.critical.total > 0) {
            const avgCriticalTime = parseInt(stats.critical.avgResponseTime?.replace('ms', '')) || 0;
            if (avgCriticalTime > 2000) {
                recommendations.push({
                    level: 'performance',
                    message: `APIs críticas lentas: promedio ${stats.critical.avgResponseTime}`,
                    action: 'Optimizar consultas de base de datos y revisar índices'
                });
            }
        }

        // 🆕 AGREGAR: Verificar específicamente las APIs de anuncios
        const announcementTests = testLevel !== 'basic' ? 
            ['announcements/active', 'announcements/health', 'announcements/stats', 'announcements/search', 'announcements'] 
            : [];
        
        if (testLevel !== 'basic' && announcementTests.length > 0) {
            // Esta lógica se puede expandir para dar recomendaciones específicas sobre anuncios
            console.log('🔍 Verificando APIs de anuncios en las recomendaciones...');
        }

        // 🆕 AGREGAR: Recomendaciones específicas por nivel
        if (recommendations.length === 0) {
            if (testLevel === 'basic') {
                recommendations.push({
                    level: 'success',
                    message: 'APIs críticas funcionan correctamente',
                    action: 'Sistema base en óptimas condiciones. Considerar probar nivel completo.'
                });
            } else if (testLevel === 'full') {
                recommendations.push({
                    level: 'success',
                    message: 'APIs críticas e importantes funcionan correctamente',
                    action: 'Sistema de producción en óptimas condiciones. Anuncios operativos.'
                });
            } else {
                recommendations.push({
                    level: 'success',
                    message: 'Todas las APIs funcionan correctamente',
                    action: 'Sistema completo en óptimas condiciones, incluyendo módulo de anuncios'
                });
            }
        }

        return recommendations;
    }

    // Generar logs mock para demostración (mantener como fallback)
    static getMockLogs(lines) {
        const mockLogs = [];
        const levels = ['info', 'warning', 'error'];
        const actions = ['LOGIN', 'LOGOUT', 'CREATE_PROJECT', 'UPDATE_TASK', 'DELETE_USER', 'BACKUP'];

        for (let i = 0; i < lines; i++) {
            const randomLevel = levels[Math.floor(Math.random() * levels.length)];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];

            mockLogs.push({
                id: i + 1,
                level: randomLevel,
                action: randomAction,
                description: `Mock log entry ${i + 1} - ${randomAction}`,
                user_id: Math.floor(Math.random() * 10) + 1,
                created_at: new Date(Date.now() - (i * 60000))
            });
        }

        return mockLogs;
    }
}

module.exports = DiagnosticsController;