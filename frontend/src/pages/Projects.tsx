import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import AdvancedGanttChart from '../components/AdvancedGanttChart';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const Projects = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
          },
        };

        await axios.get('http://localhost:5000/api/projects', config);
        // Si no usás los datos, no es necesario guardarlos
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

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  return (
    <div className="d-flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggle={toggleSidebar}
        onLogout={handleLogout}
      />

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

        <Footer />
      </div>
    </div>
  );
};

export default Projects;
