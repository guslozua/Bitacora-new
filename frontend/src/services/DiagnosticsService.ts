import apiClient from './api';

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
    category?: string; // 
    health?: string;   // 
}

export interface APITestResult {
    success: boolean;
    apiTests: APITest[];
    totalTested: number;
    successCount: number;
    timestamp: string;
    testLevel?: string;     // 🆕 AGREGADO
    stats?: any;            // 🆕 AGREGADO
    summary?: {             // 🆕 AGREGADO
        critical?: any;
        important?: any;
        optional?: any;
        admin?: any;
    };
    recommendations?: Array<{ // 🆕 AGREGADO
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

class DiagnosticsService {
    async getHealthCheck(): Promise<HealthCheck> {
        try {
            const response = await apiClient.get('/diagnostics/health');
            return response.data;
        } catch (error: any) {
            // Devolver un estado de error si falla el health check
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: 0,
                environment: 'unknown',
                version: 'unknown',
                database: 'disconnected',
                memory: { used: 0, total: 0 },
                warnings: ['No se pudo conectar al servidor']
            };
        }
    }

    async testDatabaseConnection(): Promise<DatabaseTest> {
        try {
            const response = await apiClient.get('/diagnostics/database/connection');
            return response.data;
        } catch (error: any) {
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
            const response = await apiClient.get('/diagnostics/database/performance');
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                performanceTests: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    async testInternalAPIs(level: string = 'basic'): Promise<APITestResult> {
        try {
            const response = await apiClient.get(`/diagnostics/apis/internal?level=${level}`);
            return response.data;
        } catch (error: any) {
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
            const response = await apiClient.get('/diagnostics/system/info');
            return response.data;
        } catch (error: any) {
            throw new Error(`Error obteniendo información del sistema: ${error.message}`);
        }
    }

    async testExternalServices(): Promise<ExternalServicesResult> {
        try {
            const response = await apiClient.get('/diagnostics/services/external');
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                externalServices: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    async testFileSystem(): Promise<FileSystemResult> {
        try {
            const response = await apiClient.get('/diagnostics/filesystem');
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                fileSystemTests: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    async getLogs(lines = 50, level = 'all'): Promise<LogsResult> {
        try {
            const response = await apiClient.get(`/diagnostics/logs?lines=${lines}&level=${level}`);
            return response.data;
        } catch (error: any) {
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
            const [healthCheck, databaseTest, apiTests, systemInfoResponse] = await Promise.allSettled([
                this.getHealthCheck(),
                this.testDatabaseConnection(),
                this.testInternalAPIs(),
                this.getSystemInfo()
            ]);

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
            throw new Error(`Error ejecutando todas las pruebas: ${error.message}`);
        }
    }
}

export default new DiagnosticsService();