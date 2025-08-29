import api from './api';

export interface HealthCheck {
    status: 'healthy' | 'warning' | 'unhealthy';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    database: 'connected' | 'disconnected';
    memory: {
        used: number;
        total: number;
    };
    warnings?: string[];
}

export interface DatabaseTest {
    success: boolean;
    status: 'connected' | 'error';
    responseTime: string;
    serverTime: string;
    tableStats: {
        users_count: number;
        projects_count: number;
        tasks_count: number;
        events_count: number;
    };
    message: string;
    error?: string;
    code?: string;
}

export interface APITest {
    endpoint: string;
    description: string;
    status: 'success' | 'error';
    statusCode: number | string;
    responseTime: string;
    dataCount?: string | number;
    error?: string;
    category?: string;
    health?: string;
}

export interface APITestResult {
    success: boolean;
    apiTests: APITest[];
    totalTested: number;
    successCount: number;
    timestamp: string;
    testLevel?: string;
    stats?: any;
    summary?: {
        critical?: any;
        important?: any;
        optional?: any;
        admin?: any;
    };
    recommendations?: Array<{
        level: string;
        message: string;
        action: string;
    }>;
}

export interface SystemInfo {
    server: {
        platform: string;
        architecture: string;
        nodeVersion: string;
        uptime: string;
        memory: {
            used: string;
            total: string;
            system: string;
        };
        cpu: {
            cores: number;
            model: string;
            load: number[];
        };
    };
    application: {
        environment: string;
        port: number;
        database: string;
        logLevel: string;
    };
    timestamp: string;
}

export interface ExternalService {
    service: string;
    status: 'available' | 'unavailable' | 'not_configured';
    host?: string;
    error?: string;
}

export interface ExternalServicesResult {
    success: boolean;
    externalServices: ExternalService[];
    timestamp: string;
}

export interface FileSystemTest {
    path: string;
    status: 'exists' | 'accessible' | 'missing' | 'error';
    type?: 'file' | 'directory';
    size?: string;
    modified?: string;
    created?: string;
    writable?: boolean;
    error?: string;
}

export interface FileSystemResult {
    success: boolean;
    fileSystemTests: FileSystemTest[];
    timestamp: string;
}

export interface LogEntry {
    id: number;
    level: 'info' | 'warning' | 'error' | 'debug';
    action: string;
    description: string;
    user_id?: number;
    created_at: string;
}

export interface LogsResult {
    success: boolean;
    logs: LogEntry[];
    totalReturned: number;
    filter: {
        lines: string | number;
        level: string;
    };
    timestamp: string;
}

export interface PerformanceTest {
    test: string;
    time: string;
    error?: string;
}

export interface DatabasePerformanceResult {
    success: boolean;
    performanceTests: PerformanceTest[];
    timestamp: string;
}

// 🔧 FUNCIÓN HELPER PARA OBTENER HEADERS CON AUTH
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No se encontró token de autenticación');
        return {};
    }
    
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// 🔧 FUNCIÓN HELPER PARA VERIFICAR AUTH
const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        console.error('❌ Usuario no autenticado');
        throw new Error('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
    }
    
    try {
        const userData = JSON.parse(user);
        console.log('✅ Usuario autenticado:', userData.nombre, '- Roles:', userData.roles);
        return userData;
    } catch (e) {
        console.error('❌ Error parseando datos de usuario');
        throw new Error('Error en datos de autenticación');
    }
};

class DiagnosticsService {
    async getHealthCheck(): Promise<HealthCheck> {
        try {
            // 🔧 VERIFICAR AUTH ANTES DE LA PETICIÓN
            checkAuthStatus();
            
            console.log('🔍 Iniciando health check...');
            const response = await api.get('/diagnostics/health', {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Health check exitoso:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en health check:', error);
            
            // Si es un error 401, el usuario debe volver a loguearse
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
                throw new Error('Sesión expirada. Redirigiendo al login...');
            }
            
            // Devolver un estado de error si falla el health check
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: 0,
                environment: 'unknown',
                version: 'unknown',
                database: 'disconnected',
                memory: { used: 0, total: 0 },
                warnings: ['No se pudo conectar al servidor: ' + (error.message || 'Error desconocido')]
            };
        }
    }

    async testDatabaseConnection(): Promise<DatabaseTest> {
        try {
            checkAuthStatus();
            
            console.log('🔍 Iniciando test de base de datos...');
            const response = await api.get('/diagnostics/database', {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Test de base de datos exitoso:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en test de base de datos:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
                throw new Error('Sesión expirada');
            }
            
            return {
                success: false,
                status: 'error',
                responseTime: 'N/A',
                serverTime: '',
                tableStats: { users_count: 0, projects_count: 0, tasks_count: 0, events_count: 0 },
                message: 'Error de conexión al servidor',
                error: error.response?.data?.message || error.message
            };
        }
    }

    async testDatabasePerformance(): Promise<DatabasePerformanceResult> {
        try {
            checkAuthStatus();
            
            console.log('🔍 Iniciando test de rendimiento...');
            // Usar la nueva ruta de rendimiento específica
            const response = await api.get('/diagnostics/database/performance', {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Test de rendimiento exitoso:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en test de rendimiento:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
            
            return {
                success: false,
                performanceTests: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    async testInternalAPIs(level: string = 'basic'): Promise<APITestResult> {
        try {
            checkAuthStatus();
            
            console.log(`🔍 Iniciando test de APIs internas - Nivel: ${level}...`);
            const response = await api.get(`/diagnostics/apis?level=${level}`, {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Test de APIs exitoso:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en test de APIs:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
            
            return {
                success: false,
                apiTests: [],
                totalTested: 0,
                successCount: 0,
                timestamp: new Date().toISOString(),
                testLevel: level,
                stats: {},
                summary: {},
                recommendations: []
            };
        }
    }

    async getSystemInfo(): Promise<{ systemInfo: SystemInfo }> {
        try {
            checkAuthStatus();
            
            console.log('🔍 Obteniendo información del sistema...');
            const response = await api.get('/diagnostics/system', {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Información del sistema obtenida:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo información del sistema:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
            
            throw new Error(`Error obteniendo información del sistema: ${error.message}`);
        }
    }

    async testExternalServices(): Promise<ExternalServicesResult> {
        try {
            checkAuthStatus();
            
            console.log('🔍 Probando servicios externos...');
            const response = await api.get('/diagnostics/external-services', {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Test de servicios externos exitoso:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en servicios externos:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
            
            return {
                success: false,
                externalServices: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    async testFileSystem(): Promise<FileSystemResult> {
        try {
            checkAuthStatus();
            
            console.log('🔍 Probando sistema de archivos...');
            const response = await api.get('/diagnostics/filesystem', {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Test de sistema de archivos exitoso:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error en sistema de archivos:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
            
            return {
                success: false,
                fileSystemTests: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    async getLogs(lines = 50, level = 'all'): Promise<LogsResult> {
        try {
            checkAuthStatus();
            
            console.log(`🔍 Obteniendo logs - Lines: ${lines}, Level: ${level}...`);
            const response = await api.get(`/diagnostics/logs?lines=${lines}&level=${level}`, {
                headers: getAuthHeaders()
            });
            
            console.log('✅ Logs obtenidos exitosamente:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error obteniendo logs:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }
            
            return {
                success: false,
                logs: [],
                totalReturned: 0,
                filter: { lines, level },
                timestamp: new Date().toISOString()
            };
        }
    }

    // Método helper para ejecutar todas las pruebas
    async runAllTests(): Promise<{
        healthCheck: HealthCheck;
        databaseTest: DatabaseTest;
        apiTests: APITestResult;
        systemInfo: SystemInfo;
    }> {
        try {
            console.log('🚀 Ejecutando todas las pruebas de diagnóstico...');
            
            const [healthCheck, databaseTest, apiTests, systemInfoResponse] = await Promise.allSettled([
                this.getHealthCheck(),
                this.testDatabaseConnection(),
                this.testInternalAPIs(),
                this.getSystemInfo()
            ]);

            console.log('📊 Resultados de todas las pruebas:', {
                healthCheck: healthCheck.status,
                databaseTest: databaseTest.status,
                apiTests: apiTests.status,
                systemInfo: systemInfoResponse.status
            });

            return {
                healthCheck: healthCheck.status === 'fulfilled' ? healthCheck.value : {
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    uptime: 0,
                    environment: 'unknown',
                    version: 'unknown',
                    database: 'disconnected',
                    memory: { used: 0, total: 0 },
                    warnings: ['Error ejecutando health check']
                },
                databaseTest: databaseTest.status === 'fulfilled' ? databaseTest.value : {
                    success: false,
                    status: 'error',
                    responseTime: 'N/A',
                    serverTime: '',
                    tableStats: { users_count: 0, projects_count: 0, tasks_count: 0, events_count: 0 },
                    message: 'Error ejecutando test de base de datos'
                },
                apiTests: apiTests.status === 'fulfilled' ? apiTests.value : {
                    success: false,
                    apiTests: [],
                    totalTested: 0,
                    successCount: 0,
                    timestamp: new Date().toISOString()
                },
                systemInfo: systemInfoResponse.status === 'fulfilled' ? systemInfoResponse.value.systemInfo : {
                    server: {
                        platform: 'unknown',
                        architecture: 'unknown',
                        nodeVersion: 'unknown',
                        uptime: '0',
                        memory: { used: '0', total: '0', system: '0' },
                        cpu: { cores: 0, model: 'unknown', load: [0, 0, 0] }
                    },
                    application: {
                        environment: 'unknown',
                        port: 0,
                        database: 'unknown',
                        logLevel: 'unknown'
                    },
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error: any) {
            console.error('💥 Error ejecutando todas las pruebas:', error);
            throw new Error(`Error ejecutando todas las pruebas: ${error.message}`);
        }
    }
}

export default new DiagnosticsService();