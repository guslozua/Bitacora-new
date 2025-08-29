// src/components/users/UserDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Badge, Button, ListGroup, Alert, Spinner } from 'react-bootstrap';
import UserRoles from './UserRoles';
import { fetchUserById, fetchUserPermissions, UserAdmin } from '../../services/userService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserDetailModalProps {
  show: boolean;
  onHide: () => void;
  userId?: string | null;
  onEdit?: (userId: string) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ show, onHide, userId, onEdit }) => {
  const [user, setUser] = useState<UserAdmin | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (show && userId) {
      loadUserData();
    } else {
      // Limpiar datos cuando se cierra el modal
      setUser(null);
      setPermisos([]);
      setError(null);
    }
  }, [show, userId]);
  
  // Función para cargar datos del usuario
  const loadUserData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos básicos del usuario
      const userData = await fetchUserById(userId);
      
      if (userData.success && userData.data) {
        setUser(userData.data);
        
        // Cargar permisos del usuario
        const permisosData = await fetchUserPermissions(userId);
        
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
  
  // Manejar edición
  const handleEdit = () => {
    if (userId && onEdit) {
      onEdit(userId);
      onHide();
    }
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
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {user ? `Detalles del Usuario: ${user.nombre}` : 'Detalles del Usuario'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
            <p className="mt-2">Cargando información...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : !user ? (
          <Alert variant="warning">Usuario no encontrado</Alert>
        ) : (
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
                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto" 
                        style={{ 
                          width: '120px', 
                          height: '120px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          fontSize: '2.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {user.nombre ? user.nombre.split(' ').map(name => name.charAt(0).toUpperCase()).slice(0, 2).join('') : 'NN'}
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
                      {userId && <UserRoles userId={Number(userId)} userRoles={user.roles || []} onRoleChange={loadUserData} />}
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
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        {user && onEdit && (
          <Button variant="primary" onClick={handleEdit}>
            <i className="fas fa-edit me-2"></i>Editar Usuario
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default UserDetailModal;