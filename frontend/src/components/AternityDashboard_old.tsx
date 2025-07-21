// components/AternityDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Table } from 'react-bootstrap';
import { aternityService } from '../services/aternityService';

interface VMPICCorrelationData {
  vmPicData: {
    nombre_maquina: string;
    usuario_asociado: string;
    ip_punto_final: string;
    call_center_asignado: string;
  };
  aternityData: any;
  hasAternityData: boolean;
}

interface AternityStats {
  totalVMPIC: number;
  withAternityData: number;
  correlatedData: VMPICCorrelationData[];
}

const AternityDashboard: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error' | null>(null);
  const [correlationData, setCorrelationData] = useState<AternityStats | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Probar conexión con Aternity
  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    const token = localStorage.getItem('token');
    console.log('🔍 Token disponible:', !!token);
    console.log('🔍 Intentando conexión con:', '/api/aternity/test-connection');
    
    if (!token) {
      setConnectionStatus('error');
      setError('No hay token de autenticación. Inicia sesión nuevamente.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5002/test-connection', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Respuesta recibida:', response.status, response.statusText);
      console.log('📡 Content-Type:', response.headers.get('content-type'));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        setConnectionStatus('connected');
      } else {
        const responseText = await response.text();
        console.log('❌ Respuesta de error:', responseText.substring(0, 500));
        
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          errorMessage = `Error ${response.status}: El servidor devolvió HTML en lugar de JSON. Verifica que el backend esté corriendo correctamente.`;
        }
        
        setConnectionStatus('error');
        setError(errorMessage);
      }
    } catch (err) {
      console.log('❌ Error de red:', err);
      setConnectionStatus('error');
      setError(`Error de red: ${err instanceof Error ? err.message : 'Error desconocido'}. Verifica que el backend esté corriendo.`);
    }
  };

  // Probar ruta de emergencia
  const testEmergencyConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    console.log('🆘 Probando ruta de emergencia...');
    
    try {
      const response = await fetch('http://localhost:5002/test-connection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Respuesta emergencia:', response.status, response.statusText);
      console.log('📡 Content-Type emergencia:', response.headers.get('content-type'));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos emergencia:', data);
        setConnectionStatus('connected');
      } else {
        const responseText = await response.text();
        console.log('❌ Respuesta de error emergencia:', responseText.substring(0, 500));
        
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
        } catch (parseError) {
          errorMessage = `Error ${response.status}: Ruta de emergencia también devuelve HTML`;
        }
        
        setConnectionStatus('error');
        setError(errorMessage);
      }
    } catch (err) {
      console.log('❌ Error de red emergencia:', err);
      setConnectionStatus('error');
      setError(`Error en ruta de emergencia: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // Obtener datos correlacionados VM PIC + Aternity
  const loadCorrelationData = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay token de autenticación');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5002/vm-pic-correlation', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCorrelationData(data.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error cargando datos de correlación');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos de correlación');
    } finally {
      setLoading(false);
    }
  };

  // Obtener rendimiento por call center
  const loadPerformanceData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No hay token de autenticación');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5002/performance-by-call-center', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error cargando datos de rendimiento');
      }
    } catch (err) {
      console.error('Error cargando datos de rendimiento:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos de rendimiento');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge bg="warning">Probando...</Badge>;
      case 'connected':
        return <Badge bg="success">Conectado</Badge>;
      case 'error':
        return <Badge bg="danger">Error</Badge>;
      default:
        return <Badge bg="secondary">Desconocido</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold">
          <i className="bi bi-speedometer2 me-2 text-primary"></i>
          Integración Aternity
        </h2>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={testConnection}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Probar Conexión
          </Button>
          <Button 
            variant="outline-warning" 
            onClick={testEmergencyConnection}
          >
            <i className="bi bi-exclamation-triangle me-1"></i>
            Emergencia
          </Button>
          <Button 
            variant="primary" 
            onClick={loadCorrelationData}
            disabled={connectionStatus !== 'connected'}
          >
            <i className="bi bi-diagram-3 me-1"></i>
            Cargar Correlación
          </Button>
        </div>
      </div>

      {/* Estado de Conexión */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Estado de Conexión con Aternity</h5>
              <div className="d-flex align-items-center">
                <span className="me-2">Estado:</span>
                {getConnectionBadge()}
                {connectionStatus === 'connected' && (
                  <span className="ms-3 text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    API de Aternity conectada correctamente
                  </span>
                )}
                {error && (
                  <Alert variant="danger" className="mt-3 mb-0">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {error}
                  </Alert>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estadísticas de Correlación */}
      {correlationData && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <h3 className="fw-bold text-primary">{correlationData.totalVMPIC}</h3>
                <p className="text-muted mb-0">Total VM PIC</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <h3 className="fw-bold text-success">{correlationData.withAternityData}</h3>
                <p className="text-muted mb-0">Con Datos Aternity</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <h3 className="fw-bold text-info">
                  {correlationData.totalVMPIC > 0 
                    ? Math.round((correlationData.withAternityData / correlationData.totalVMPIC) * 100)
                    : 0}%
                </h3>
                <p className="text-muted mb-0">Cobertura Aternity</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla de Datos Correlacionados */}
      {correlationData && correlationData.correlatedData && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="fw-bold mb-3">Datos Correlacionados VM PIC + Aternity</h5>
                <div className="table-responsive">
                  <Table striped hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Hostname (Session)</th>
                        <th>Device Name (Aternity)</th>
                        <th>IP Session</th>
                        <th>IP Aternity</th>
                        <th>CIDR/Subnet</th>
                        <th>Método Correlación</th>
                        <th>Call Center</th>
                      </tr>
                    </thead>
                    <tbody>
                      {correlationData.correlatedData.slice(0, 20).map((item, index) => (
                        <tr key={index}>
                          <td>
                            <code>{item.vmPicData.nombre_maquina.replace('TELECOM\\\\', '')}</code>
                          </td>
                          <td>{item.vmPicData.usuario_asociado}</td>
                          <td>
                            {item.vmPicData.call_center_asignado ? (
                              <Badge bg="info">{item.vmPicData.call_center_asignado}</Badge>
                            ) : (
                              <Badge bg="secondary">Home Office</Badge>
                            )}
                          </td>
                          <td><small>{item.vmPicData.ip_punto_final}</small></td>
                          <td>
                            {item.aternityData?.IP_ADDRESS ? (
                              <small className="text-success">{item.aternityData.IP_ADDRESS}</small>
                            ) : (
                              <small className="text-muted">Sin IP</small>
                            )}
                          </td>
                          <td>
                            {item.hasAternityData ? (
                              <Badge bg="success">
                                <i className="bi bi-check-circle me-1"></i>
                                Disponible
                              </Badge>
                            ) : (
                              <Badge bg="warning">
                                <i className="bi bi-question-circle me-1"></i>
                                No encontrado
                              </Badge>
                            )}
                          </td>
                          <td>
                            {item.aternityData ? (
                              <small className="text-muted">
                                {Object.keys(item.aternityData).length} campos
                              </small>
                            ) : (
                              <small className="text-muted">Sin datos</small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {correlationData.correlatedData.length > 20 && (
                  <div className="text-center mt-3">
                    <small className="text-muted">
                      Mostrando 20 de {correlationData.correlatedData.length} registros
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Botones de Carga */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Acciones Disponibles</h5>
              <div className="d-flex gap-2 flex-wrap">
                <Button 
                  variant="outline-primary" 
                  onClick={loadPerformanceData}
                  disabled={connectionStatus !== 'connected'}
                >
                  <i className="bi bi-speedometer me-1"></i>
                  Rendimiento por Call Center
                </Button>
                <Button 
                  variant="outline-success"
                  disabled={connectionStatus !== 'connected'}
                >
                  <i className="bi bi-graph-up me-1"></i>
                  Métricas de Red
                </Button>
                <Button 
                  variant="outline-info"
                  disabled={connectionStatus !== 'connected'}
                >
                  <i className="bi bi-person-workspace me-1"></i>
                  Experiencia de Usuario
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Cargando datos de Aternity...</p>
        </div>
      )}
    </Container>
  );
};

export default AternityDashboard;