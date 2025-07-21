import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// Componentes del layout
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Componentes específicos del módulo
import SessionStatsCards from '../components/SessionStatsCards';
import SessionChartsPanel from '../components/SessionChartsPanel';
import SessionUploadModal from '../components/SessionUploadModal';
import IpRangeManager from '../components/IpRangeManager';

// Servicios
import { sessionAnalysisService } from '../services/sessionAnalysisService';

interface CurrentStats {
  resumen: {
    total_sesiones: number;
    sesiones_activas: number;
    total_vm_pic: number;
    vm_pic_activas: number;
    total_home: number;
    total_call_center: number;
    home_activas: number;
    call_center_activas: number;
    porcentaje_home: number;
    porcentaje_call_center: number;
    usuarios_unicos: number;
    ultima_actualizacion: string;
  };
  versionesReceiver: Array<{
    version_receiver: string;
    cantidad: number;
    porcentaje: number;
  }>;
  distribucionUbicacion: Array<{
    ubicacion: string;
    total: number;
    activas: number;
    porcentaje: number;
  }>;
}

const SessionAnalysisDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados del layout (igual que PlacasDash)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Estados del módulo
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showIpManager, setShowIpManager] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Funciones del layout (igual que PlacasDash)
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Estilo del contenido principal (igual que PlacasDash)
  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  // Funciones del módulo
  const handleRefreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionAnalysisService.getCurrentStats();
      setCurrentStats(data);
    } catch (err) {
      setError('Error al cargar las estadísticas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = (result: any) => {
    setShowUploadModal(false);
    setRefreshTrigger(prev => prev + 1);
    handleRefreshData();
  };

  const handleRangesUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    handleRefreshData();
  };

  // Cargar datos inicial
  useEffect(() => {
    handleRefreshData();
  }, [refreshTrigger]);

  return (
    <div className="d-flex">
      {/* Sidebar - igual que en PlacasDash */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggle={toggleSidebar} 
        onLogout={handleLogout} 
      />

      {/* Contenido principal */}
      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          {/* Header con título y botones - igual estructura que PlacasDash */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">
              <i className="bi bi-graph-up me-2 text-primary"></i>
              Análisis de Sesiones VM PIC
            </h2>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setShowIpManager(true)}
                className="shadow-sm"
              >
                <i className="bi bi-router me-1"></i>
                Configurar IPs
              </Button>
              <Button
                variant="outline-primary"
                onClick={handleRefreshData}
                disabled={loading}
                className="shadow-sm"
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                {loading ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowUploadModal(true)}
                className="shadow-sm"
              >
                <i className="bi bi-upload me-1"></i>
                Subir Archivo
              </Button>
            </div>
          </div>

          {/* Contenido principal con manejo de estados */}
          {loading && !currentStats ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando estadísticas...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="shadow-sm">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          ) : !currentStats ? (
            <Row className="justify-content-center">
              <Col md={8}>
                <Card className="border-0 shadow-sm text-center py-5">
                  <Card.Body>
                    <div className="mb-4">
                      <i className="bi bi-database-x display-1 text-muted"></i>
                    </div>
                    <h4 className="text-muted mb-3">No hay datos disponibles</h4>
                    <p className="text-muted mb-4">
                      Para comenzar el análisis, sube un archivo de sesiones haciendo clic en "Subir Archivo"
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <i className="bi bi-upload me-2"></i>
                      Subir Primer Archivo
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            // Mostrar datos cuando están disponibles
            currentStats?.resumen && Number(currentStats.resumen.total_sesiones) > 0 ? (
              <>
                {/* Tarjetas de estadísticas */}
                <SessionStatsCards 
                  stats={currentStats} 
                  onRefresh={handleRefreshData} 
                />
                
                {/* Panel de gráficos */}
                <SessionChartsPanel stats={currentStats} />
              </>
            ) : (
              <Row className="justify-content-center">
                <Col md={8}>
                  <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                      <div className="mb-4">
                        <i className="bi bi-pie-chart display-1 text-muted"></i>
                      </div>
                      <h4 className="text-muted mb-3">Datos procesados pero sin resultados</h4>
                      <p className="text-muted mb-4">
                        Los archivos han sido procesados pero no se encontraron máquinas VM PIC para analizar
                      </p>
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          variant="outline-primary"
                          onClick={handleRefreshData}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Actualizar
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => setShowUploadModal(true)}
                        >
                          <i className="bi bi-upload me-1"></i>
                          Subir Nuevo Archivo
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )
          )}
        </Container>

        {/* Footer - igual que en PlacasDash */}
        <Footer />
      </div>

      {/* Modales */}
      <SessionUploadModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        onFileUploaded={handleFileUploaded}
      />

      <IpRangeManager
        show={showIpManager}
        onHide={() => setShowIpManager(false)}
        onRangesUpdated={handleRangesUpdated}
      />
    </div>
  );
};

export default SessionAnalysisDashboard;