// pages/InformesPage.tsx
import React, { useState } from 'react';
import { Container, Nav, Tab, Row, Col } from 'react-bootstrap';
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
          <h2 className="mb-4">Informes y Estadísticas</h2>
          
          <Tab.Container id="informes-tabs" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
            <Row>
              <Col md={12}>
                <Nav variant="tabs" className="mb-4">
                  <Nav.Item>
                    <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="incidentes">Incidentes</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="guardias">Guardias</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="liquidaciones">Liquidaciones</Nav.Link>
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
                  <Tab.Pane eventKey="incidentes">
                    <InformeIncidentesComponent />
                  </Tab.Pane>
                  <Tab.Pane eventKey="guardias">
                    <InformeGuardiasComponent />
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