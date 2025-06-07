import React, { useState, useEffect } from 'react';
import {
    Card,
    Container,
    Button,
    Badge,
    Alert,
    Spinner,
    Row,
    Col,
    Table,
    Tabs,
    Tab,
    ProgressBar,
    Form
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import LightFooter from '../LightFooter';
import DiagnosticsService, {
    HealthCheck,
    DatabaseTest,
    SystemInfo,
    APITestResult,
    ExternalServicesResult,
    FileSystemResult,
    LogsResult,
    DatabasePerformanceResult
} from '../../services/DiagnosticsService';

const DiagnosticsPanel: React.FC = () => {
    const navigate = useNavigate();

    // Estados principales
    const [loading, setLoading] = useState(false);
    const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
    const [databaseTest, setDatabaseTest] = useState<DatabaseTest | null>(null);
    const [databasePerformance, setDatabasePerformance] = useState<DatabasePerformanceResult | null>(null);
    const [currentAPILevel, setCurrentAPILevel] = useState<string>('basic');
    const [apiTests, setApiTests] = useState<APITestResult | null>(null);
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [externalServices, setExternalServices] = useState<ExternalServicesResult | null>(null);
    const [fileSystemTests, setFileSystemTests] = useState<FileSystemResult | null>(null);
    const [logs, setLogs] = useState<LogsResult | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros
    const [logLevel, setLogLevel] = useState('all');
    const [logLines, setLogLines] = useState(50);

    // Función helper para obtener ícono de estado
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'healthy':
            case 'connected':
            case 'success':
            case 'available':
            case 'exists':
            case 'accessible':
                return <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '20px' }}></i>;
            case 'warning':
            case 'not_configured':
                return <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '20px' }}></i>;
            case 'unhealthy':
            case 'error':
            case 'unavailable':
            case 'missing':
            case 'disconnected':
                return <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '20px' }}></i>;
            default:
                return <i className="bi bi-question-circle-fill text-secondary" style={{ fontSize: '20px' }}></i>;
        }
    };

    // Función helper para obtener badge de estado
    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase();
        let variant = 'secondary';

        if (['healthy', 'connected', 'success', 'available', 'exists', 'accessible'].includes(statusLower)) {
            variant = 'success';
        } else if (['warning', 'not_configured'].includes(statusLower)) {
            variant = 'warning';
        } else if (['unhealthy', 'error', 'unavailable', 'missing', 'disconnected'].includes(statusLower)) {
            variant = 'danger';
        }

        return <Badge bg={variant}>{status}</Badge>;
    };

    // Estadísticas de diagnóstico (similar a adminStats)
    const diagnosticStats = [
        {
            title: 'Estado del Sistema',
            value: healthCheck?.status || 'Verificando...',
            icon: 'bi-activity',
            color: healthCheck?.status === 'healthy' ? '#28a745' : healthCheck?.status === 'warning' ? '#ffc107' : '#dc3545'
        },
        {
            title: 'Memoria en Uso',
            value: healthCheck ? `${healthCheck.memory.used}MB` : '0MB',
            icon: 'bi-memory',
            color: '#3498db'
        },
        {
            title: 'APIs Funcionando',
            value: apiTests ? `${apiTests.successCount}/${apiTests.totalTested}` : '0/0',
            icon: 'bi-globe',
            color: '#2ecc71'
        },
        {
            title: 'Uptime',
            value: healthCheck ? `${Math.floor(healthCheck.uptime / 60)}min` : '0min',
            icon: 'bi-clock',
            color: '#f1c40f'
        },
    ];

    // Funciones de pruebas individuales
    const runHealthCheck = async () => {
        setLoading(true);
        setError(null);
        try {
            const health = await DiagnosticsService.getHealthCheck();
            setHealthCheck(health);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error ejecutando health check: ' + error.message);
        }
        setLoading(false);
    };

    const runDatabaseTests = async () => {
        setLoading(true);
        setError(null);
        try {
            const dbTest = await DiagnosticsService.testDatabaseConnection();
            setDatabaseTest(dbTest);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error en test de base de datos: ' + error.message);
        }
        setLoading(false);
    };

    const runDatabasePerformanceTests = async () => {
        setLoading(true);
        setError(null);
        try {
            const perfTest = await DiagnosticsService.testDatabasePerformance();
            setDatabasePerformance(perfTest);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error en test de rendimiento: ' + error.message);
        }
        setLoading(false);
    };

    const runAPITests = async (level: string = 'basic') => {
        setLoading(true);
        setError(null);
        setCurrentAPILevel(level);

        try {
            const apiResults = await DiagnosticsService.testInternalAPIs(level);
            setApiTests(apiResults);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error en test de APIs: ' + error.message);
        }
        setLoading(false);
    };
    const handleBasicTest = () => runAPITests('basic');
    const handleFullTest = () => runAPITests('full');
    const handleCompleteTest = () => runAPITests('complete');

    const loadSystemInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const sysInfo = await DiagnosticsService.getSystemInfo();
            setSystemInfo(sysInfo.systemInfo);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error obteniendo info del sistema: ' + error.message);
        }
        setLoading(false);
    };

    const runExternalServicesTest = async () => {
        setLoading(true);
        setError(null);
        try {
            const services = await DiagnosticsService.testExternalServices();
            setExternalServices(services);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error verificando servicios externos: ' + error.message);
        }
        setLoading(false);
    };

    const runFileSystemTest = async () => {
        setLoading(true);
        setError(null);
        try {
            const fsTests = await DiagnosticsService.testFileSystem();
            setFileSystemTests(fsTests);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error verificando sistema de archivos: ' + error.message);
        }
        setLoading(false);
    };

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const logsData = await DiagnosticsService.getLogs(logLines, logLevel);
            setLogs(logsData);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error obteniendo logs: ' + error.message);
        }
        setLoading(false);
    };

    // Función para ejecutar todas las pruebas
    const runAllTests = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await DiagnosticsService.runAllTests();
            setHealthCheck(results.healthCheck);
            setDatabaseTest(results.databaseTest);
            setApiTests(results.apiTests);
            setSystemInfo(results.systemInfo);
            setLastUpdate(new Date());
        } catch (error: any) {
            setError('Error ejecutando todas las pruebas: ' + error.message);
        }
        setLoading(false);
    };

    // Ejecutar health check inicial
    useEffect(() => {
        runHealthCheck();
    }, []);

    return (
        <Container fluid className="py-4 px-4">
            {/* Header igual al AdminPanel */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="d-flex align-items-center mb-1">
                        <img
                            src="../logoxside22.png"
                            alt="icono"
                            style={{ width: '32px', height: '32px', marginRight: '10px' }}
                        />
                        <h2 className="mb-0 fw-bold">Panel de Diagnósticos</h2>
                    </div>
                    <p className="text-muted mb-0">
                        Monitorea el estado y rendimiento del sistema en tiempo real
                    </p>
                    {lastUpdate && (
                        <small className="text-muted">
                            Última actualización: {lastUpdate.toLocaleString()}
                        </small>
                    )}
                </div>

                <div className="d-flex">
                    <Button
                        variant="outline-primary"
                        className="me-2 shadow-sm"
                        onClick={() => navigate('/admin')}
                    >
                        <i className="bi bi-arrow-left me-1"></i> Volver al Panel Admin
                    </Button>
                    <Button
                        variant="success"
                        onClick={runAllTests}
                        disabled={loading}
                        className="shadow-sm"
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Ejecutando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Ejecutar Todas las Pruebas
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Mostrar errores globales */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </Alert>
            )}

            {/* Estadísticas rápidas igual al AdminPanel */}
            <Row className="g-4 mb-4">
                {diagnosticStats.map((stat, index) => (
                    <Col md={3} key={index}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-1">{stat.title}</h6>
                                        <h2 className="fw-bold mb-0">{stat.value}</h2>
                                    </div>
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                        style={{
                                            backgroundColor: `${stat.color}20`,
                                            width: '3.5rem',
                                            height: '3.5rem',
                                            padding: 0
                                        }}
                                    >
                                        <i className={`bi ${stat.icon} fs-3`} style={{ color: stat.color }} />
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Health Check Overview */}
            {healthCheck && (
                <Alert
                    variant={
                        healthCheck.status === 'healthy' ? 'success' :
                            healthCheck.status === 'warning' ? 'warning' : 'danger'
                    }
                    className="mb-4 border-0 shadow-sm"
                >
                    <div className="d-flex align-items-center">
                        {getStatusIcon(healthCheck.status)}
                        <div className="ms-3 flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                                <strong>Estado del Sistema: {getStatusBadge(healthCheck.status)}</strong>
                                <div className="small text-end">
                                    <div>Memoria: {healthCheck.memory.used}MB / {healthCheck.memory.total}MB</div>
                                    <div>Entorno: <Badge bg={healthCheck.environment === 'production' ? 'success' : 'warning'}>{healthCheck.environment}</Badge></div>
                                </div>
                            </div>
                            <div className="small mt-2">
                                Versión: {healthCheck.version} |
                                Base de Datos: {getStatusBadge(healthCheck.database)} |
                                Uptime: {Math.floor(healthCheck.uptime / 60)} minutos
                            </div>
                            {healthCheck.warnings && healthCheck.warnings.length > 0 && (
                                <div className="mt-2">
                                    <strong>Advertencias:</strong>
                                    <ul className="mb-0 mt-1">
                                        {healthCheck.warnings.map((warning, index) => (
                                            <li key={index} className="small">{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </Alert>
            )}

            {/* Pestañas de diagnóstico */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3">
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-activity me-2 text-primary"></i>
                        Herramientas de Diagnóstico
                    </h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k || 'overview')}
                        className="mb-0"
                    >
                        {/* TAB: RESUMEN */}
                        <Tab eventKey="overview" title={
                            <span>
                                <i className="bi bi-speedometer2 me-2"></i>
                                Resumen
                            </span>
                        }>
                            <div className="p-4">
                                <Row>
                                    {/* Database Status Card */}
                                    <Col lg={6} className="mb-4">
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                                <span className="fw-bold">
                                                    <i className="bi bi-database me-2 text-primary"></i>
                                                    Base de Datos
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={runDatabaseTests}
                                                    disabled={loading}
                                                >
                                                    {loading ? <Spinner size="sm" /> : 'Probar'}
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                {databaseTest ? (
                                                    <>
                                                        <div className="d-flex align-items-center mb-3">
                                                            {getStatusIcon(databaseTest.status)}
                                                            <div className="ms-2 flex-grow-1">
                                                                <div className="d-flex justify-content-between">
                                                                    <span>{getStatusBadge(databaseTest.status)}</span>
                                                                    <small className="text-muted">{databaseTest.responseTime}</small>
                                                                </div>
                                                                {!databaseTest.success && databaseTest.error && (
                                                                    <small className="text-danger">{databaseTest.error}</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Row className="text-center">
                                                            <Col xs={6} lg={3}>
                                                                <div className="fw-bold text-primary fs-4">{databaseTest.tableStats?.users_count || 0}</div>
                                                                <small className="text-muted">Usuarios</small>
                                                            </Col>
                                                            <Col xs={6} lg={3}>
                                                                <div className="fw-bold text-info fs-4">{databaseTest.tableStats?.projects_count || 0}</div>
                                                                <small className="text-muted">Proyectos</small>
                                                            </Col>
                                                            <Col xs={6} lg={3}>
                                                                <div className="fw-bold text-warning fs-4">{databaseTest.tableStats?.tasks_count || 0}</div>
                                                                <small className="text-muted">Tareas</small>
                                                            </Col>
                                                            <Col xs={6} lg={3}>
                                                                <div className="fw-bold text-success fs-4">{databaseTest.tableStats?.events_count || 0}</div>
                                                                <small className="text-muted">Eventos</small>
                                                            </Col>
                                                        </Row>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <i className="bi bi-database display-4 text-muted mb-3"></i>
                                                        <p className="text-muted">Ejecuta la prueba para ver el estado de la base de datos</p>
                                                        <Button variant="primary" onClick={runDatabaseTests} disabled={loading}>
                                                            <i className="bi bi-play-circle me-2"></i>
                                                            Ejecutar Prueba
                                                        </Button>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* API Tests Card */}
                                    <Col lg={6} className="mb-4">
                                        <Card className="h-100 border-0 shadow-sm">
                                            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                                <span className="fw-bold">
                                                    <i className="bi bi-globe me-2 text-success"></i>
                                                    APIs Internas
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="outline-success"
                                                    onClick={() => runAPITests('basic')}
                                                    disabled={loading}
                                                >
                                                    {loading ? <Spinner size="sm" /> : 'Probar'}
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                {apiTests ? (
                                                    <>
                                                        <div className="d-flex align-items-center mb-3">
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Exitosas: {apiTests.successCount}/{apiTests.totalTested}</span>
                                                                    <Badge bg={apiTests.successCount === apiTests.totalTested ? 'success' : 'warning'}>
                                                                        {apiTests.totalTested > 0 ? Math.round((apiTests.successCount / apiTests.totalTested) * 100) : 0}%
                                                                    </Badge>
                                                                </div>
                                                                <ProgressBar
                                                                    now={apiTests.totalTested > 0 ? (apiTests.successCount / apiTests.totalTested) * 100 : 0}
                                                                    variant={apiTests.successCount === apiTests.totalTested ? 'success' : 'warning'}
                                                                    style={{ height: '8px' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="small">
                                                            {apiTests.apiTests?.slice(0, 4).map((test, index) => (
                                                                <div key={index} className="d-flex justify-content-between align-items-center py-1">
                                                                    <span className="text-truncate" style={{ maxWidth: '60%' }}>{test.description}</span>
                                                                    <div className="d-flex align-items-center">
                                                                        <small className="text-muted me-2">{test.responseTime}</small>
                                                                        {getStatusIcon(test.status)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <i className="bi bi-globe display-4 text-muted mb-3"></i>
                                                        <p className="text-muted">Ejecuta la prueba para verificar las APIs internas</p>
                                                        <Button variant="success" onClick={() => runAPITests('basic')} disabled={loading}>
                                                            <i className="bi bi-play-circle me-2"></i>
                                                            Ejecutar Prueba
                                                        </Button>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* System Info Summary */}
                                {systemInfo && (
                                    <Card className="border-0 shadow-sm">
                                        <Card.Header className="bg-white py-3">
                                            <h6 className="fw-bold mb-0">
                                                <i className="bi bi-server me-2 text-info"></i>
                                                Información del Sistema
                                            </h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Row>
                                                <Col md={3}>
                                                    <h6>Servidor</h6>
                                                    <div className="small">
                                                        <div><strong>SO:</strong> {systemInfo.server.platform} {systemInfo.server.architecture}</div>
                                                        <div><strong>Node:</strong> {systemInfo.server.nodeVersion}</div>
                                                        <div><strong>Uptime:</strong> {systemInfo.server.uptime}</div>
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <h6>Memoria</h6>
                                                    <div className="small">
                                                        <div><strong>App:</strong> {systemInfo.server.memory.used} / {systemInfo.server.memory.total}</div>
                                                        <div><strong>Sistema:</strong> {systemInfo.server.memory.system}</div>
                                                        <ProgressBar
                                                            now={(parseInt(systemInfo.server.memory.used) / parseInt(systemInfo.server.memory.total)) * 100}
                                                            variant="info"
                                                            className="mt-1"
                                                            style={{ height: '8px' }}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <h6>CPU</h6>
                                                    <div className="small">
                                                        <div><strong>Cores:</strong> {systemInfo.server.cpu.cores}</div>
                                                        <div><strong>Load:</strong> {systemInfo.server.cpu.load.map(l => l.toFixed(2)).join(', ')}</div>
                                                    </div>
                                                </Col>
                                                <Col md={3}>
                                                    <h6>Aplicación</h6>
                                                    <div className="small">
                                                        <div><strong>Env:</strong> <Badge bg={systemInfo.application.environment === 'production' ? 'success' : 'warning'}>{systemInfo.application.environment}</Badge></div>
                                                        <div><strong>Puerto:</strong> {systemInfo.application.port}</div>
                                                        <div><strong>DB:</strong> {systemInfo.application.database}</div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                )}
                            </div>
                        </Tab>

                        {/* TAB: BASE DE DATOS */}
                        <Tab eventKey="database" title={
                            <span>
                                <i className="bi bi-database me-2"></i>
                                Base de Datos
                            </span>
                        }>
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h6 className="mb-0">Pruebas de Base de Datos</h6>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={runDatabaseTests}
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner size="sm" /> : <><i className="bi bi-link-45deg me-1"></i>Conectividad</>}
                                        </Button>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={runDatabasePerformanceTests}
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner size="sm" /> : <><i className="bi bi-speedometer me-1"></i>Rendimiento</>}
                                        </Button>
                                    </div>
                                </div>

                                <Row>
                                    <Col lg={8}>
                                        {/* Resultados de conectividad */}
                                        {databaseTest && (
                                            <Alert variant={databaseTest.success ? 'success' : 'danger'} className="mb-4">
                                                <div className="d-flex align-items-center">
                                                    {getStatusIcon(databaseTest.status)}
                                                    <div className="ms-3 flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <strong>{databaseTest.message}</strong>
                                                            <Badge bg={databaseTest.success ? 'success' : 'danger'}>
                                                                {databaseTest.responseTime}
                                                            </Badge>
                                                        </div>
                                                        <div className="small mt-1">
                                                            {databaseTest.serverTime && (
                                                                <>Hora del servidor: {new Date(databaseTest.serverTime).toLocaleString()}</>
                                                            )}
                                                            {databaseTest.error && (
                                                                <div className="text-danger mt-1">Error: {databaseTest.error}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Alert>
                                        )}

                                        {/* Resultados de rendimiento */}
                                        {databasePerformance && databasePerformance.performanceTests && (
                                            <Card className="border-0 shadow-sm">
                                                <Card.Header className="bg-white py-3">
                                                    <h6 className="fw-bold mb-0">
                                                        <i className="bi bi-speedometer me-2"></i>
                                                        Pruebas de Rendimiento
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table striped bordered hover size="sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Prueba</th>
                                                                <th>Tiempo</th>
                                                                <th>Estado</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {databasePerformance.performanceTests.map((test, index) => (
                                                                <tr key={index}>
                                                                    <td>{test.test}</td>
                                                                    <td>
                                                                        {test.error ? (
                                                                            <Badge bg="danger">Error</Badge>
                                                                        ) : (
                                                                            <Badge bg={
                                                                                parseInt(test.time) < 100 ? 'success' :
                                                                                    parseInt(test.time) < 500 ? 'warning' : 'danger'
                                                                            }>
                                                                                {test.time}
                                                                            </Badge>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {test.error ? (
                                                                            <span className="text-danger small">{test.error}</span>
                                                                        ) : (
                                                                            <i className="bi bi-check-circle text-success"></i>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>
                                        )}
                                    </Col>

                                    <Col lg={4}>
                                        <Card className="border-0 shadow-sm">
                                            <Card.Header className="bg-white py-3">
                                                <h6 className="fw-bold mb-0">
                                                    <i className="bi bi-table me-2"></i>
                                                    Estadísticas de Tablas
                                                </h6>
                                            </Card.Header>
                                            <Card.Body>
                                                {databaseTest?.tableStats ? (
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                            <span><i className="bi bi-people me-2"></i>Usuarios:</span>
                                                            <Badge bg="primary">{databaseTest.tableStats.users_count}</Badge>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                            <span><i className="bi bi-folder me-2"></i>Proyectos:</span>
                                                            <Badge bg="info">{databaseTest.tableStats.projects_count}</Badge>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                            <span><i className="bi bi-check-square me-2"></i>Tareas:</span>
                                                            <Badge bg="warning">{databaseTest.tableStats.tasks_count}</Badge>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center py-2">
                                                            <span><i className="bi bi-calendar-event me-2"></i>Eventos:</span>
                                                            <Badge bg="success">{databaseTest.tableStats.events_count}</Badge>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted py-3">
                                                        <i className="bi bi-info-circle me-2"></i>
                                                        <small>Ejecuta la prueba de conectividad para ver las estadísticas</small>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </Tab>

                        <Tab eventKey="apis" title={
                            <span>
                                <i className="bi bi-globe me-2"></i>
                                APIs
                            </span>
                        }>
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h6 className="mb-0">Pruebas de APIs Internas</h6>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant={currentAPILevel === 'basic' ? 'primary' : 'outline-primary'}
                                            size="sm"
                                            onClick={handleBasicTest}
                                            disabled={loading}
                                        >
                                            {loading && currentAPILevel === 'basic' ? <Spinner size="sm" className="me-1" /> : '🔴'}
                                            Críticas (4)
                                        </Button>
                                        <Button
                                            variant={currentAPILevel === 'full' ? 'warning' : 'outline-warning'}
                                            size="sm"
                                            onClick={handleFullTest}
                                            disabled={loading}
                                        >
                                            {loading && currentAPILevel === 'full' ? <Spinner size="sm" className="me-1" /> : '🟡'}
                                            Producción (9)
                                        </Button>
                                        <Button
                                            variant={currentAPILevel === 'complete' ? 'success' : 'outline-success'}
                                            size="sm"
                                            onClick={handleCompleteTest}
                                            disabled={loading}
                                        >
                                            {loading && currentAPILevel === 'complete' ? <Spinner size="sm" className="me-1" /> : '🚀'}
                                            Completas (15+)
                                        </Button>

                                    </div>
                                </div>

                                {/* Descripción del nivel actual */}
                                <Alert variant="info" className="mb-4">
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-info-circle me-2"></i>
                                        <div>
                                            <strong>Nivel actual: {currentAPILevel.toUpperCase()}</strong>
                                            <div className="small mt-1">
                                                {currentAPILevel === 'basic' && 'Probando solo APIs críticas: Usuarios, Proyectos, Tareas, Roles'}
                                                {currentAPILevel === 'full' && 'Probando APIs críticas + importantes: incluye Eventos, Guardias, Bitácora, Notificaciones'}
                                                {currentAPILevel === 'complete' && 'Probando todas las APIs disponibles: incluye Glosario, Contactos, iTracker, Incidentes y más'}
                                            </div>
                                        </div>
                                    </div>
                                </Alert>

                                {apiTests ? (
                                    <>
                                        <Alert variant={apiTests.successCount === apiTests.totalTested ? 'success' : 'warning'} className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>Resultado:</strong> {apiTests.successCount} de {apiTests.totalTested} APIs funcionando correctamente
                                                    <div className="small mt-1">
                                                        Última verificación: {new Date(apiTests.timestamp).toLocaleString()}
                                                        {apiTests.testLevel && (
                                                            <span className="ms-2">
                                                                <Badge bg="info">Nivel: {apiTests.testLevel}</Badge>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fw-bold h4 mb-0">
                                                        {apiTests.totalTested > 0 ? Math.round((apiTests.successCount / apiTests.totalTested) * 100) : 0}%
                                                    </div>
                                                    <ProgressBar
                                                        now={apiTests.totalTested > 0 ? (apiTests.successCount / apiTests.totalTested) * 100 : 0}
                                                        style={{ width: '100px', height: '8px' }}
                                                        variant={apiTests.successCount === apiTests.totalTested ? 'success' : 'warning'}
                                                    />
                                                </div>
                                            </div>
                                        </Alert>

                                        {/* Mostrar estadísticas por categoría si están disponibles */}
                                        {apiTests.summary && (
                                            <Row className="mb-4">
                                                {Object.entries(apiTests.summary).map(([category, stats]: [string, any]) => (
                                                    stats.total > 0 && (
                                                        <Col md={3} key={category}>
                                                            <Card className="border-0 shadow-sm h-100">
                                                                <Card.Body className="text-center">
                                                                    <div className="mb-2">
                                                                        {category === 'critical' && '🔴'}
                                                                        {category === 'important' && '🟡'}
                                                                        {category === 'optional' && '🟢'}
                                                                        {category === 'admin' && '🔧'}
                                                                    </div>
                                                                    <h6 className="text-capitalize">{category}</h6>
                                                                    <div className="h4 mb-1">{stats.successRate}%</div>
                                                                    <div className="small text-muted">
                                                                        {stats.success}/{stats.total} APIs
                                                                    </div>
                                                                    <div className="small text-muted">
                                                                        Promedio: {stats.avgResponseTime}
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    )
                                                ))}
                                            </Row>
                                        )}

                                        {/* Mostrar recomendaciones si están disponibles */}
                                        {apiTests.recommendations && apiTests.recommendations.length > 0 && (
                                            <Alert variant={
                                                apiTests.recommendations.some(r => r.level === 'urgent') ? 'danger' :
                                                    apiTests.recommendations.some(r => r.level === 'warning') ? 'warning' : 'success'
                                            } className="mb-4">
                                                <h6><i className="bi bi-lightbulb me-2"></i>Recomendaciones</h6>
                                                {apiTests.recommendations.map((rec, index) => (
                                                    <div key={index} className="mb-2">
                                                        <strong>{rec.message}</strong>
                                                        <div className="small">{rec.action}</div>
                                                    </div>
                                                ))}
                                            </Alert>
                                        )}

                                        <Card className="border-0 shadow-sm">
                                            <Card.Body>
                                                <div className="table-responsive">
                                                    <Table striped bordered hover>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: '50px' }}>Estado</th>
                                                                <th>Endpoint</th>
                                                                <th>Descripción</th>
                                                                <th style={{ width: '80px' }}>Categoría</th>
                                                                <th style={{ width: '80px' }}>Código</th>
                                                                <th style={{ width: '100px' }}>Tiempo</th>
                                                                <th style={{ width: '80px' }}>Datos</th>
                                                                <th style={{ width: '80px' }}>Salud</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {apiTests.apiTests && apiTests.apiTests.length > 0 ? (
                                                                apiTests.apiTests.map((test, index) => (
                                                                    <tr key={index} className={test.status === 'error' ? 'table-danger' : 'table-success'}>
                                                                        <td className="text-center">{getStatusIcon(test.status)}</td>
                                                                        <td><code className="small">{test.endpoint}</code></td>
                                                                        <td>{test.description}</td>
                                                                        <td>
                                                                            <Badge bg={
                                                                                test.category === 'critical' ? 'danger' :
                                                                                    test.category === 'important' ? 'warning' :
                                                                                        test.category === 'optional' ? 'success' : 'info'
                                                                            }>
                                                                                {test.category}
                                                                            </Badge>
                                                                        </td>
                                                                        <td>
                                                                            <Badge bg={test.status === 'success' ? 'success' : 'danger'}>
                                                                                {test.statusCode}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="small">{test.responseTime}</td>
                                                                        <td className="small">{test.dataCount || 'N/A'}</td>
                                                                        <td>
                                                                            {test.health && (
                                                                                <Badge bg={
                                                                                    test.health === 'excellent' ? 'success' :
                                                                                        test.health === 'good' ? 'primary' :
                                                                                            test.health === 'slow' ? 'warning' : 'danger'
                                                                                }>
                                                                                    {test.health}
                                                                                </Badge>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={8} className="text-center text-muted">
                                                                        No hay resultados de pruebas disponibles
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>

                                                {/* Mostrar errores si los hay */}
                                                {apiTests.apiTests && apiTests.apiTests.some(test => test.error) && (
                                                    <Alert variant="danger" className="mt-3">
                                                        <h6><i className="bi bi-exclamation-triangle me-2"></i>Errores Detectados</h6>
                                                        {apiTests.apiTests
                                                            .filter(test => test.error)
                                                            .map((test, index) => (
                                                                <div key={index} className="mb-2">
                                                                    <strong>{test.endpoint}:</strong> {test.error}
                                                                </div>
                                                            ))}
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-globe display-4 text-muted mb-3"></i>
                                        <p className="text-muted">No se han ejecutado pruebas de API aún.</p>
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button variant="primary" onClick={handleBasicTest} disabled={loading}>
                                                <i className="bi bi-play-circle me-2"></i>
                                                Probar APIs Críticas
                                            </Button>
                                            <Button variant="warning" onClick={handleFullTest} disabled={loading}>
                                                <i className="bi bi-play-circle me-2"></i>
                                                Probar APIs Importantes
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tab>

                        {/* TAB: SISTEMA */}
                        <Tab eventKey="system" title={
                            <span>
                                <i className="bi bi-cpu me-2"></i>
                                Sistema
                            </span>
                        }>
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h6 className="mb-0">Información del Sistema</h6>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={loadSystemInfo}
                                        disabled={loading}
                                    >
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        {loading ? 'Actualizando...' : 'Actualizar Información'}
                                    </Button>
                                </div>

                                {systemInfo ? (
                                    <Row>
                                        <Col md={6}>
                                            <Card className="mb-3 border-0 shadow-sm">
                                                <Card.Header className="bg-white py-3">
                                                    <h6 className="fw-bold mb-0">
                                                        <i className="bi bi-server me-2"></i>
                                                        Información del Servidor
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table borderless size="sm">
                                                        <tbody>
                                                            <tr>
                                                                <td><strong>Plataforma:</strong></td>
                                                                <td>
                                                                    <Badge bg="info">{systemInfo.server.platform}</Badge>
                                                                    <Badge bg="secondary" className="ms-2">{systemInfo.server.architecture}</Badge>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Node.js:</strong></td>
                                                                <td><code>{systemInfo.server.nodeVersion}</code></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Uptime:</strong></td>
                                                                <td>
                                                                    <i className="bi bi-clock me-2"></i>
                                                                    {systemInfo.server.uptime}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-3 border-0 shadow-sm">
                                                <Card.Header className="bg-white py-3">
                                                    <h6 className="fw-bold mb-0">
                                                        <i className="bi bi-memory me-2"></i>
                                                        Memoria
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span><strong>Aplicación:</strong></span>
                                                            <span>{systemInfo.server.memory.used} / {systemInfo.server.memory.total}</span>
                                                        </div>
                                                        <ProgressBar
                                                            now={(parseInt(systemInfo.server.memory.used) / parseInt(systemInfo.server.memory.total)) * 100}
                                                            variant="info"
                                                            style={{ height: '8px' }}
                                                        />
                                                        <div className="small text-muted mt-1">
                                                            Uso: {Math.round((parseInt(systemInfo.server.memory.used) / parseInt(systemInfo.server.memory.total)) * 100)}%
                                                        </div>
                                                    </div>
                                                    <div className="small">
                                                        <div><strong>Sistema Total:</strong> {systemInfo.server.memory.system}</div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        <Col md={6}>
                                            <Card className="mb-3 border-0 shadow-sm">
                                                <Card.Header className="bg-white py-3">
                                                    <h6 className="fw-bold mb-0">
                                                        <i className="bi bi-cpu me-2"></i>
                                                        CPU
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table borderless size="sm">
                                                        <tbody>
                                                            <tr>
                                                                <td><strong>Cores:</strong></td>
                                                                <td>
                                                                    <Badge bg="primary">{systemInfo.server.cpu.cores}</Badge>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Modelo:</strong></td>
                                                                <td>
                                                                    <span title={systemInfo.server.cpu.model} className="small">
                                                                        {systemInfo.server.cpu.model.substring(0, 40)}
                                                                        {systemInfo.server.cpu.model.length > 40 ? '...' : ''}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Load Average:</strong></td>
                                                                <td>
                                                                    {systemInfo.server.cpu.load.map((load, index) => (
                                                                        <Badge
                                                                            key={index}
                                                                            bg={load > 2 ? 'danger' : load > 1 ? 'warning' : 'success'}
                                                                            className="me-1"
                                                                            title={`${['1min', '5min', '15min'][index]} load average`}
                                                                        >
                                                                            {load.toFixed(2)}
                                                                        </Badge>
                                                                    ))}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-3 border-0 shadow-sm">
                                                <Card.Header className="bg-white py-3">
                                                    <h6 className="fw-bold mb-0">
                                                        <i className="bi bi-gear me-2"></i>
                                                        Aplicación
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table borderless size="sm">
                                                        <tbody>
                                                            <tr>
                                                                <td><strong>Entorno:</strong></td>
                                                                <td>
                                                                    <Badge bg={systemInfo.application.environment === 'production' ? 'success' : 'warning'}>
                                                                        {systemInfo.application.environment}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Puerto:</strong></td>
                                                                <td><code>{systemInfo.application.port}</code></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Base de Datos:</strong></td>
                                                                <td><code>{systemInfo.application.database}</code></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Log Level:</strong></td>
                                                                <td>
                                                                    <Badge bg={
                                                                        systemInfo.application.logLevel === 'error' ? 'danger' :
                                                                            systemInfo.application.logLevel === 'warning' ? 'warning' :
                                                                                'info'
                                                                    }>
                                                                        {systemInfo.application.logLevel}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-server display-4 text-muted mb-3"></i>
                                        <p className="text-muted">Cargando información del sistema...</p>
                                        {!loading && (
                                            <Button variant="primary" onClick={loadSystemInfo}>
                                                <i className="bi bi-arrow-clockwise me-2"></i>
                                                Cargar Información del Sistema
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Tab>

                        {/* TAB: SERVICIOS */}
                        <Tab eventKey="services" title={
                            <span>
                                <i className="bi bi-cloud me-2"></i>
                                Servicios
                            </span>
                        }>
                            <div className="p-4">
                                <Row>
                                    <Col lg={6} className="mb-4">
                                        <Card className="border-0 shadow-sm">
                                            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                                <h6 className="fw-bold mb-0">
                                                    <i className="bi bi-cloud-check me-2"></i>
                                                    Servicios Externos
                                                </h6>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={runExternalServicesTest}
                                                    disabled={loading}
                                                >
                                                    {loading ? <Spinner size="sm" /> : <><i className="bi bi-arrow-clockwise me-1"></i>Verificar</>}
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                {externalServices ? (
                                                    <div className="table-responsive">
                                                        <Table striped bordered hover size="sm">
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ width: '50px' }}>Estado</th>
                                                                    <th>Servicio</th>
                                                                    <th>Host</th>
                                                                    <th>Info</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {externalServices.externalServices.map((service, index) => (
                                                                    <tr key={index} className={
                                                                        service.status === 'available' ? 'table-success' :
                                                                            service.status === 'not_configured' ? 'table-warning' : 'table-danger'
                                                                    }>
                                                                        <td className="text-center">{getStatusIcon(service.status)}</td>
                                                                        <td><strong>{service.service}</strong></td>
                                                                        <td>{service.host || 'N/A'}</td>
                                                                        <td>
                                                                            {service.error ? (
                                                                                <span className="text-danger small">{service.error}</span>
                                                                            ) : (
                                                                                <span className="text-success small">OK</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <i className="bi bi-cloud display-4 text-muted mb-3"></i>
                                                        <p className="text-muted">Verifica los servicios externos del sistema</p>
                                                        <Button variant="primary" onClick={runExternalServicesTest}>
                                                            <i className="bi bi-play-circle me-2"></i>
                                                            Verificar Servicios
                                                        </Button>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col lg={6} className="mb-4">
                                        <Card className="border-0 shadow-sm">
                                            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                                <h6 className="fw-bold mb-0">
                                                    <i className="bi bi-folder-check me-2"></i>
                                                    Sistema de Archivos
                                                </h6>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={runFileSystemTest}
                                                    disabled={loading}
                                                >
                                                    {loading ? <Spinner size="sm" /> : <><i className="bi bi-arrow-clockwise me-1"></i>Verificar</>}
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                {fileSystemTests ? (
                                                    <div className="table-responsive">
                                                        <Table striped bordered hover size="sm">
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ width: '50px' }}>Estado</th>
                                                                    <th>Ruta</th>
                                                                    <th>Tipo</th>
                                                                    <th>Info</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {fileSystemTests.fileSystemTests.map((test, index) => (
                                                                    <tr key={index} className={
                                                                        ['exists', 'accessible'].includes(test.status) ? 'table-success' : 'table-danger'
                                                                    }>
                                                                        <td className="text-center">{getStatusIcon(test.status)}</td>
                                                                        <td><code className="small">{test.path}</code></td>
                                                                        <td>
                                                                            <Badge bg={test.type === 'directory' ? 'info' : 'secondary'}>
                                                                                {test.type || 'file'}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="small">
                                                                            {test.size && <div><strong>Tamaño:</strong> {test.size}</div>}
                                                                            {test.writable !== undefined && (
                                                                                <Badge bg={test.writable ? 'success' : 'warning'} className="ms-1">
                                                                                    {test.writable ? 'Escribible' : 'Solo lectura'}
                                                                                </Badge>
                                                                            )}
                                                                            {test.error && <div className="text-danger"><strong>Error:</strong> {test.error}</div>}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <i className="bi bi-folder display-4 text-muted mb-3"></i>
                                                        <p className="text-muted">Verifica archivos y directorios críticos</p>
                                                        <Button variant="primary" onClick={runFileSystemTest}>
                                                            <i className="bi bi-play-circle me-2"></i>
                                                            Verificar Archivos
                                                        </Button>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </Tab>

                        {/* TAB: LOGS */}
                        <Tab eventKey="logs" title={
                            <span>
                                <i className="bi bi-file-text me-2"></i>
                                Logs
                            </span>
                        }>
                            <div className="p-4">
                                <Card className="border-0 shadow-sm">
                                    <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                        <h6 className="fw-bold mb-0">
                                            <i className="bi bi-file-text me-2"></i>
                                            Logs del Sistema
                                        </h6>
                                        <div className="d-flex gap-2 align-items-center">
                                            <Form.Select
                                                size="sm"
                                                style={{ width: '150px' }}
                                                value={logLevel}
                                                onChange={(e) => setLogLevel(e.target.value)}
                                            >
                                                <option value="all">Todos los niveles</option>
                                                <option value="error">Solo errores</option>
                                                <option value="warning">Solo advertencias</option>
                                                <option value="info">Solo información</option>
                                            </Form.Select>
                                            <Form.Select
                                                size="sm"
                                                style={{ width: '100px' }}
                                                value={logLines}
                                                onChange={(e) => setLogLines(parseInt(e.target.value))}
                                            >
                                                <option value={25}>25 líneas</option>
                                                <option value={50}>50 líneas</option>
                                                <option value={100}>100 líneas</option>
                                                <option value={200}>200 líneas</option>
                                            </Form.Select>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={loadLogs}
                                                disabled={loading}
                                            >
                                                {loading ? <Spinner size="sm" /> : <><i className="bi bi-arrow-clockwise me-1"></i>Actualizar</>}
                                            </Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        {logs ? (
                                            <>
                                                <div className="mb-3 d-flex justify-content-between align-items-center">
                                                    <small className="text-muted">
                                                        Mostrando {logs.totalReturned} registros más recientes
                                                    </small>
                                                    <small className="text-muted">
                                                        Filtro: {logs.filter.level} | Líneas: {logs.filter.lines}
                                                    </small>
                                                </div>
                                                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                                    <Table striped bordered hover size="sm">
                                                        <thead className="sticky-top">
                                                            <tr>
                                                                <th style={{ width: '140px' }}>Timestamp</th>
                                                                <th style={{ width: '80px' }}>Nivel</th>
                                                                <th style={{ width: '80px' }}>Usuario</th>
                                                                <th style={{ width: '120px' }}>Acción</th>
                                                                <th>Descripción</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {logs.logs && logs.logs.length > 0 ? (
                                                                logs.logs.map((log, index) => (
                                                                    <tr key={index} className={
                                                                        log.level === 'error' ? 'table-danger' :
                                                                            log.level === 'warning' ? 'table-warning' : ''
                                                                    }>
                                                                        <td className="small">
                                                                            {new Date(log.created_at).toLocaleString()}
                                                                        </td>
                                                                        <td>
                                                                            <Badge bg={
                                                                                log.level === 'error' ? 'danger' :
                                                                                    log.level === 'warning' ? 'warning' :
                                                                                        'info'
                                                                            }>
                                                                                {log.level}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="small">{log.user_id || 'Sistema'}</td>
                                                                        <td className="small">
                                                                            <code>{log.action}</code>
                                                                        </td>
                                                                        <td className="small">{log.description}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={5} className="text-center text-muted py-4">
                                                                        <i className="bi bi-inbox display-4 mb-3"></i>
                                                                        <div>No hay logs disponibles con los filtros actuales</div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-5">
                                                <i className="bi bi-file-text display-4 text-muted mb-3"></i>
                                                <p className="text-muted">Carga los logs del sistema para monitorear la actividad</p>
                                                <Button variant="primary" onClick={loadLogs} disabled={loading}>
                                                    <i className="bi bi-play-circle me-2"></i>
                                                    Cargar Logs
                                                </Button>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            <LightFooter />
        </Container>
    );
};

export default DiagnosticsPanel;