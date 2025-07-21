// components/AternityDashboard_improved.tsx - VERSIÓN MEJORADA COMPLETA
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Alert, ProgressBar, Container, Row, Col } from 'react-bootstrap';

interface VMPICCorrelationData {
  vmPicData: {
    nombre_maquina: string;
    usuario_asociado: string;
    ip_punto_final: string;
    direccion_ip: string;
    nombre_punto_final: string;
    call_center_asignado: string;
    cleanMachineName: string;
    cleanUser: string;
    validIPs: string[];
  };
  aternityData: any;
  hasAternityData: boolean;
  matchMethod: string;
  matchScore: number;
  correlationDetails: {
    cleanName: string;
    originalName: string;
    user: string;
    ips: string[];
    aternityDeviceName: string;
    aternityUser: string;
    aternityIP: string;
  };
}

const AternityDashboard: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'testing' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [correlationData, setCorrelationData] = useState<VMPICCorrelationData[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [stats, setStats] = useState({
    totalVMPIC: 0,
    withAternityData: 0,
    aternityDevicesTotal: 0,
    correlationPercentage: 0,
    matchMethods: {}
  });

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token found:', token ? 'Yes (length: ' + token.length + ')' : 'No');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Test connection usando el servidor dedicado
  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/aternity/test-connection', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conexión exitosa:', data);
        setConnectionStatus('connected');
      } else {
        throw new Error(`Error ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      setConnectionStatus('error');
      setError(`Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // Cargar correlación mejorada
  const loadCorrelationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/aternity/vm-pic-correlation', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Datos de correlación:', data);
        setCorrelationData(data.data.correlatedData);
        setStats({
          totalVMPIC: data.data.totalVMPIC,
          withAternityData: data.data.withAternityData,
          aternityDevicesTotal: data.data.aternityDevicesTotal,
          correlationPercentage: data.data.correlationPercentage,
          matchMethods: data.data.matchMethods
        });
      } else {
        throw new Error('Error cargando datos de correlación');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos de correlación');
    } finally {
      setLoading(false);
    }
  };

  // Cargar rendimiento por call center
  const loadPerformanceData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/aternity/performance-by-call-center', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data.data.callCenters);
      }
    } catch (err) {
      console.error('❌ Error cargando rendimiento:', err);
    }
  };

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadCorrelationData();
      loadPerformanceData();
    }
  }, [connectionStatus]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = correlationData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(correlationData.length / itemsPerPage);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'testing': return '🔄';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'testing': return 'Probando...';
      case 'error': return 'Error';
      default: return 'Desconectado';
    }
  };

  const getMatchBadge = (method: string, score: number) => {
    const variants = {
      'IP Exacta': 'success',
      'Usuario Exacto': 'primary', 
      'Ubicación Específica': 'info',
      'Rango IP': 'secondary',
      'Endpoint/Device': 'warning',
      'Nombre exacto': 'success',
      'Nombre parcial': 'primary',
      'Usuario': 'info',
      'IP Address': 'warning',
      'Sin match': 'secondary'
    };
    return <Badge bg={variants[method as keyof typeof variants] || 'secondary'}>{method}</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="bi bi-speedometer2 me-3"></i>
            Integración Aternity (MEJORADA)
          </h2>
        </Col>
      </Row>

      {/* Estado de Conexión */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <h5>Estado de Conexión con Aternity</h5>
              <p className="mb-0">
                Estado: <Badge bg={connectionStatus === 'connected' ? 'success' : 'secondary'}>
                  {getStatusIcon()} {getStatusText()}
                </Badge>
                {connectionStatus === 'connected' && ' - API de Aternity conectada correctamente'}
              </p>
            </Col>
            <Col md={4} className="text-end">
              <Button variant="outline-primary" onClick={testConnection} disabled={connectionStatus === 'testing'}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                {connectionStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
              </Button>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="mt-3 mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Estadísticas Mejoradas */}
      {connectionStatus === 'connected' && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-primary">
              <Card.Body>
                <h3 className="text-primary">{stats.totalVMPIC}</h3>
                <p className="mb-0">Total VM PIC</p>
                <small className="text-muted">Activas en sistema</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-success">
              <Card.Body>
                <h3 className="text-success">{stats.withAternityData}</h3>
                <p className="mb-0">Con Datos Aternity</p>
                <small className="text-muted">Correlacionadas exitosamente</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-info">
              <Card.Body>
                <h3 className="text-info">{stats.correlationPercentage}%</h3>
                <p className="mb-0">Cobertura Aternity</p>
                <ProgressBar 
                  now={stats.correlationPercentage} 
                  variant="info" 
                  className="mt-2"
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-warning">
              <Card.Body>
                <h3 className="text-warning">{stats.aternityDevicesTotal}</h3>
                <p className="mb-0">Dispositivos Aternity</p>
                <small className="text-muted">Total disponibles</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Métodos de Correlación */}
      {connectionStatus === 'connected' && stats.matchMethods && Object.keys(stats.matchMethods).length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <i className="bi bi-diagram-3 me-2"></i>
              Métodos de Correlación
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(stats.matchMethods).map(([method, count]) => (
                <Col md={2} key={method} className="text-center">
                  <div className="mb-2">
                    {getMatchBadge(method, 0)}
                  </div>
                  <h4>{count as number}</h4>
                  <small className="text-muted">{method}</small>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Botones de Acción */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col>
              <Button 
                variant="primary" 
                onClick={loadCorrelationData}
                disabled={connectionStatus !== 'connected' || loading}
                className="me-2"
              >
                <i className="bi bi-arrow-repeat me-1"></i>
                {loading ? 'Cargando...' : 'Cargar Correlación'}
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={loadPerformanceData}
                disabled={connectionStatus !== 'connected'}
              >
                <i className="bi bi-speedometer2 me-1"></i>
                Rendimiento por Call Center
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de Datos Correlacionados MEJORADA */}
      {correlationData.length > 0 && (
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-table me-2"></i>
              Datos Correlacionados VM PIC + Aternity
            </h5>
            <Badge bg="info">
              Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, correlationData.length)} de {correlationData.length}
            </Badge>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Máquina VM PIC</th>
                    <th>Punto Final</th>
                    <th>Usuario</th>
                    <th>Call Center</th>
                    <th>IP VM PIC</th>
                    <th>Correlación</th>
                    <th>Dispositivo Aternity</th>
                    <th>Usuario Aternity</th>
                    <th>IP Aternity</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div>
                          <strong>{item.correlationDetails.cleanName}</strong>
                          <br />
                          <small className="text-muted">{item.vmPicData.nombre_maquina}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <code className="bg-light p-1 rounded">{item.vmPicData.nombre_punto_final}</code>
                          <br />
                          <small className="text-muted">Endpoint ID</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="outline-primary" className="font-monospace">
                          {item.vmPicData.usuario_asociado}
                        </Badge>
                      </td>
                      <td>
                        <div>
                          <strong>{item.vmPicData.call_center_asignado || 'N/A'}</strong>
                          {item.vmPicData.call_center_asignado && (
                            <>
                              <br />
                              <small className="text-muted">Call Center</small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {item.correlationDetails.ips.length > 0 ? (
                            item.correlationDetails.ips.map((ip, i) => (
                              <div key={i} className="font-monospace small">
                                {ip}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">Sin IP válida</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {getMatchBadge(item.matchMethod, item.matchScore)}
                        {item.matchScore > 0 && (
                          <div className="mt-1">
                            <small className="text-muted">Score: {item.matchScore}/10</small>
                          </div>
                        )}
                      </td>
                      <td>
                        {item.aternityData ? (
                          <div>
                            <strong>{item.aternityData.DEVICE_NAME}</strong>
                            {item.aternityData.OS_NAME && (
                              <div>
                                <small className="text-muted">{item.aternityData.OS_NAME}</small>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">Sin datos</span>
                        )}
                      </td>
                      <td>
                        {item.aternityData?.USER_NAME ? (
                          <Badge bg="outline-info" className="font-monospace">
                            {item.aternityData.USER_NAME}
                          </Badge>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        {item.aternityData?.IP_ADDRESS ? (
                          <span className="font-monospace small">
                            {item.aternityData.IP_ADDRESS}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        {item.hasAternityData ? (
                          <Badge bg="success">
                            <i className="bi bi-check-circle me-1"></i>
                            Correlacionado
                          </Badge>
                        ) : (
                          <Badge bg="warning">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Sin match
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <Card.Footer>
              <div className="d-flex justify-content-between align-items-center">
                <Button 
                  variant="outline-primary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <i className="bi bi-chevron-left"></i> Anterior
                </Button>
                
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                
                <Button 
                  variant="outline-primary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Siguiente <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </Card.Footer>
          )}
        </Card>
      )}

      {/* Call Centers Performance */}
      {performanceData.length > 0 && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">
              <i className="bi bi-building me-2"></i>
              Rendimiento por Call Center
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Call Center</th>
                    <th>Localidad</th>
                    <th>Total Sesiones</th>
                    <th>Sesiones VM PIC</th>
                    <th>% VM PIC</th>
                    <th>Máquinas Únicas</th>
                    <th>Tasa Utilización</th>
                    <th>Tipo Contrato</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.slice(0, 15).map((cc, index) => (
                    <tr key={index}>
                      <td><strong>{cc.call_center_asignado}</strong></td>
                      <td>{cc.localidad_call_center}</td>
                      <td>
                        <Badge bg="primary">{cc.total_sesiones}</Badge>
                      </td>
                      <td>
                        <Badge bg="success">{cc.sesiones_vm_pic}</Badge>
                      </td>
                      <td>
                        <ProgressBar 
                          now={parseFloat(cc.performanceMetrics.vmPicPercentage)} 
                          label={`${cc.performanceMetrics.vmPicPercentage}%`}
                          style={{ minWidth: '80px' }}
                        />
                      </td>
                      <td>{cc.maquinas_unicas}</td>
                      <td>{cc.performanceMetrics.utilizationRate}%</td>
                      <td>
                        <Badge bg={cc.tipo_contrato === 'PROPIO' ? 'success' : 'info'}>
                          {cc.tipo_contrato}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AternityDashboard;