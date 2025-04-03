import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import AdvancedGanttChart from '../components/AdvancedGanttChart'; // nuevo componente

const Projects = () => {
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const token = localStorage.getItem('token');

  let user = {};
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : {};
  } catch {
    user = {};
  }

  const nombre = (user as any)?.nombre || 'Usuario';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
          },
        };

        const projectsRes = await axios.get('http://localhost:5000/api/projects', config);
        setProyectos(projectsRes.data?.data?.length || 0);
      } catch (error) {
        console.error('Error cargando datos del proyecto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const sidebarStyle = {
    minHeight: '100vh',
    width: sidebarCollapsed ? '80px' : '250px',
    position: 'fixed' as 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    transition: 'all 0.3s',
    backgroundColor: '#343a40',
    color: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  const menuItemStyle = {
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '5px',
  };

  const iconStyle = {
    fontSize: '1.5rem',
    marginRight: sidebarCollapsed ? '0' : '10px',
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div className="p-3 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!sidebarCollapsed && (
            <div className="d-flex align-items-center">
              <img src="/logoxside.png" alt="Logo" style={{ width: '60px', height: '60px', marginRight: '10px' }} />
              <h5 className="mb-0">TASK manager</h5>
            </div>
          )}
          {sidebarCollapsed && (
            <img src="/logoxside.png" alt="Logo" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
          )}
          <Button variant="link" className="text-white p-0" onClick={toggleSidebar} style={{ marginLeft: sidebarCollapsed ? '0' : 'auto' }}>
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </Button>
        </div>

        <div className="pt-3">
          <div style={menuItemStyle} onClick={() => navigate('/dashboard')}>
            <i className="bi bi-speedometer2" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>
          <div style={menuItemStyle} onClick={() => navigate('/projects')}>
            <i className="bi bi-diagram-3-fill" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Proyectos</span>}
          </div>
          <div style={menuItemStyle} onClick={() => navigate('/tasks')}>
            <i className="bi bi-list-task" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Tareas</span>}
          </div>
          <div style={menuItemStyle} onClick={() => navigate('/users')}>
            <i className="bi bi-people-fill" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Usuarios</span>}
          </div>
          <div style={menuItemStyle} onClick={() => navigate('/bitacora')}>
            <i className="bi bi-journal-text" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Bitácora</span>}
          </div>
          <div style={menuItemStyle} onClick={() => navigate('/hitos')}>
            <i className="bi bi-flag-fill" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Hitos</span>}
          </div>
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '10px 15px' }}></div>
          <div style={menuItemStyle} onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={contentStyle}>
        <Container className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Gestión de Proyectos</h2>
            <Button variant="outline-primary">
              <i className="bi bi-plus me-2"></i>
              Nuevo Proyecto
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Row className="mb-4">
              <Col md={12}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <AdvancedGanttChart />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>

        <footer style={{
          backgroundColor: '#343a40',
          color: 'white',
          padding: '10px 0',
          textAlign: 'center',
          width: '100%',
          marginTop: 'auto'
        }}>
          <div className="d-flex justify-content-center align-items-center">
            <span>Desarrollado por <img 
              src="/logoxside.png" 
              alt="ATPC Logo" 
              style={{ height: '40px', marginRight: '10px' }} 
            /> </span>
            <small> - AseguramientoTecnicoydePlataformasdeContacto@teco.com.ar</small>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Projects;
