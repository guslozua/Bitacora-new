// src/components/users/UserDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Badge, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import UserRoles from './UserRoles';
import { fetchUserById, fetchUserPermissions, UserAdmin } from '../../services/userService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserAdmin | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Cargar datos básicos del usuario
        const userData = await fetchUserById(id);
        
        if (userData.success && userData.data) {
          setUser(userData.data);
          
          // Cargar permisos del usuario
          const permisosData = await fetchUserPermissions(id);
          
          if (permisosData.success) {
            setPermisos(permisosData.data || []);
          }
        } else {
          setError('Error al cargar los datos del usuario');
        }
      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [id]);
  
  // Manejar edición
  const handleEdit = () => {
    if (id) navigate(`/admin/users/${id}/edit`);
  };
  
  // Volver al listado
  const handleBack = () => {
    navigate('/admin/users');
  };
  
  // Renderizar estado con badge
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'activo':
        return <Badge bg="success">Activo</Badge>;
      case 'inactivo':
        return <Badge bg="warning">Inactivo</Badge>;
      case 'bloqueado':
        return <Badge bg="danger">Bloqueado</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Desconocido'}</Badge>;
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString?: string | Date): string => {
    if (!dateString) return 'No disponible';
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };
  
  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  
  if (error) return <Alert variant="danger">{error}</Alert>;
  
  if (!user) return <Alert variant="warning">Usuario no encontrado</Alert>;
  
  return (
    <div className="container py-4">
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" onClick={handleBack}>
            <i className="fas fa-arrow-left me-2"></i>Volver
          </Button>
        </Col>
      </Row>
      
      <Row>
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Información del Usuario</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                {user.imagen_perfil ? (
                  <img 
                    src={user.imagen_perfil} 
                    alt={user.nombre} 
                    className="rounded-circle img-thumbnail" 
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto" 
                    style={{ width: '120px', height: '120px' }}
                  >
                    <i className="fas fa-user fa-3x text-secondary"></i>
                  </div>
                )}
                <h4 className="mt-3">{user.nombre}</h4>
                <p className="text-muted">{user.email}</p>
                <div>
                  {renderStatusBadge(user.estado)}
                  {user.roles && user.roles.map((role, index) => (
                    <Badge key={index} bg="info" className="ms-1">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>ID:</strong> {user.id}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Último acceso:</strong> {user.ultimo_acceso ? formatDate(user.ultimo_acceso) : 'Nunca'}
                </ListGroup.Item>
              </ListGroup>
              
              <div className="d-grid gap-2 mt-3">
                <Button variant="primary" onClick={handleEdit}>
                  <i className="fas fa-edit me-2"></i>Editar Usuario
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Row>
            <Col>
              <Card className="shadow-sm mb-4">
                <Card.Header>
                  <h5 className="mb-0">Roles del Usuario</h5>
                </Card.Header>
                <Card.Body>
                  {id && <UserRoles userId={Number(id)} userRoles={user.roles || []} />}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Card className="shadow-sm mb-4">
                <Card.Header>
                  <h5 className="mb-0">Permisos del Usuario</h5>
                </Card.Header>
                <Card.Body>
                  {permisos.length === 0 ? (
                    <Alert variant="info">Este usuario no tiene permisos asignados</Alert>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {permisos.map((permiso, index) => (
                        <Badge key={index} bg="secondary" className="py-2 px-3">
                          {permiso}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default UserDetail;