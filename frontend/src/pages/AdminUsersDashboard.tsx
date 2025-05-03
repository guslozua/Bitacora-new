// src/pages/AdminUsersDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import UsersList from '../components/users/UsersList';
import UsersFilter from '../components/users/UsersFilter';
import { isAuthenticated } from '../services/authService';
import { fetchUserCount, UserFilters } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import LightFooter from '../components/LightFooter';

const AdminUsersDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [filters, setFilters] = useState<UserFilters>({});
  const navigate = useNavigate();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuthAndLoadData = async (): Promise<void> => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }
      
      try {
        // Obtener conteo de usuarios
        const countData = await fetchUserCount();
        if (countData.success) {
          setUserCount(countData.count);
        }
      } catch (err) {
        setError('Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndLoadData();
  }, [navigate]);

  // Manejar cambios en filtros
  const handleFilterChange = (newFilters: UserFilters): void => {
    setFilters(newFilters);
  };

  // Manejar la creación de un nuevo usuario
  const handleCreateUser = (): void => {
    navigate('/admin/users/new');
  };

  // Volver al panel de administración
  const handleBack = (): void => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <Container fluid className="py-5 px-4 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Cargando...</span>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <img
              src="/logoxside22.png"
              alt="Logo"
              style={{ width: '32px', height: '32px', marginRight: '10px' }}
            />
            <h2 className="mb-0 fw-bold">Administración de Usuarios</h2>
          </div>
          <p className="text-muted mb-0">
            Gestiona los usuarios del sistema, sus roles y permisos
          </p>
        </div>
        <div className="d-flex">
          <Button 
            variant="outline-secondary" 
            className="me-2 shadow-sm" 
            onClick={handleBack}
          >
            <i className="bi bi-arrow-left me-1"></i> Volver al Panel
          </Button>
          <Button 
            variant="primary" 
            className="shadow-sm"
            onClick={handleCreateUser}
          >
            <i className="bi bi-plus-circle me-1"></i> Nuevo Usuario
          </Button>
        </div>
      </div>
      
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total de Usuarios</h6>
                  <h2 className="fw-bold mb-0">{userCount}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#3498db20',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-people-fill fs-3" style={{ color: '#3498db' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Usuarios Activos</h6>
                  <h2 className="fw-bold mb-0">{Math.round(userCount * 0.8)}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#2ecc7120',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-person-check-fill fs-3" style={{ color: '#2ecc71' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Administradores</h6>
                  <h2 className="fw-bold mb-0">{Math.round(userCount * 0.2)}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#9b59b620',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-shield-lock-fill fs-3" style={{ color: '#9b59b6' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Usuarios Bloqueados</h6>
                  <h2 className="fw-bold mb-0">{Math.round(userCount * 0.05)}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#e74c3c20',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-person-fill-lock fs-3" style={{ color: '#e74c3c' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-list-ul me-2 text-primary"></i>
            Listado de Usuarios
          </h5>
        </Card.Header>
        <Card.Body>
          <UsersFilter onFilterChange={handleFilterChange} />
          <UsersList filters={filters} />
        </Card.Body>
      </Card>
      <LightFooter />
    </Container>
  );
};

export default AdminUsersDashboard;