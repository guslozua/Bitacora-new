// src/pages/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-center">Panel de Control</h2>

      <Row className="g-4">
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Usuarios</Card.Title>
              <Card.Text>Gestioná los usuarios y roles del sistema.</Card.Text>
              <Button variant="primary" onClick={() => navigate('/users')}>
                Ir a Usuarios
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Proyectos</Card.Title>
              <Card.Text>Accedé a todos los proyectos activos.</Card.Text>
              <Button variant="success" onClick={() => navigate('/projects')}>
                Ver Proyectos
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Tareas</Card.Title>
              <Card.Text>Asigná y seguí tareas y subtareas.</Card.Text>
              <Button variant="warning" onClick={() => navigate('/tasks')}>
                Ver Tareas
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Bitácora</Card.Title>
              <Card.Text>Revisá la actividad del sistema en tiempo real.</Card.Text>
              <Button variant="info" onClick={() => navigate('/bitacora')}>
                Ver Bitácora
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Reportes</Card.Title>
              <Card.Text>Generá reportes y estadísticas de uso.</Card.Text>
              <Button variant="dark" onClick={() => navigate('/reportes')}>
                Ver Reportes
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="text-center mt-5">
        <Button variant="outline-danger" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </Container>
  );
};

export default Dashboard;
