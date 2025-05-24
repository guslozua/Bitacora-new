// pages/InformesPage.tsx
import React, { useState } from 'react';
import { Container, Nav, Tab, Row, Col, Badge } from 'react-bootstrap';
import DashboardResumen from '../components/Informes/DashboardResumen';
import InformeIncidentesComponent from '../components/Informes/InformeIncidentesComponent';
import InformeGuardiasComponent from '../components/Informes/InformeGuardiasComponent';
import InformeLiquidacionesComponent from '../components/Informes/InformeLiquidacionesComponent';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const InformesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const contentStyle: React.CSSProperties = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />
      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Informes y Estadísticas</h2>
            <div className="d-flex gap-2">
              <Badge bg="success" className="fs-6 px-3 py-2">
                <i className="bi bi-graph-up me-1"></i> Analytics
              </Badge>
            </div>
          </div>
          
          <Tab.Container id="informes-tabs" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
            <Row>
              <Col md={12}>
                <Nav variant="tabs" className="mb-4">
                  <Nav.Item>
                    <Nav.Link eventKey="dashboard">
                      <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="guardias">
                      <i className="bi bi-shield-check me-2"></i>Guardias
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="incidentes">
                      <i className="bi bi-exclamation-triangle me-2"></i>Incidentes
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="liquidaciones">
                      <i className="bi bi-cash-coin me-2"></i>Liquidaciones
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Tab.Content>
                  <Tab.Pane eventKey="dashboard">
                    <DashboardResumen />
                  </Tab.Pane>
                  <Tab.Pane eventKey="guardias">
                    <InformeGuardiasComponent />
                  </Tab.Pane>
                  <Tab.Pane eventKey="incidentes">
                    <InformeIncidentesComponent />
                  </Tab.Pane>
                  <Tab.Pane eventKey="liquidaciones">
                    <InformeLiquidacionesComponent />
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default InformesPage;