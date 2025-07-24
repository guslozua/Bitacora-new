import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Spinner, Button, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import { Link } from 'react-router-dom';

interface User {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
  rol?: string;
}

interface Assignment {
  id: number;
  tipo: 'proyecto' | 'tarea' | 'subtarea';
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  porcentaje_completado: number;
  prioridad: string;
  path?: string; // URL para navegar al elemento
}

interface UserDetailProps {
  userId: number;
  onBack?: () => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ userId, onBack }) => {
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    rol: ''
  });
  
  const token = localStorage.getItem('token');
  
  // Cargar datos del usuario y sus asignaciones
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
          },
        };
        
        // 1. Obtener datos del usuario
        const userResponse = await axios.get(`${API_BASE_URL}/usuarios/${userId}`, config);
        
        if (userResponse.data.success) {
          setUser(userResponse.data.usuario);
          
          // Inicializar formulario de edición
          setEditForm({
            nombre: userResponse.data.usuario.nombre,
            email: userResponse.data.usuario.email,
            rol: userResponse.data.usuario.rol || ''
          });
          
          // 2. Obtener proyectos asignados
          const projectsResponse = await axios.get(
            `${API_BASE_URL}/usuarios/${userId}/proyectos`, 
            config
          );
          
          const proyectos = projectsResponse.data.success ? 
            projectsResponse.data.proyectos.map((p: any) => ({
              id: p.id,
              tipo: 'proyecto' as const,
              titulo: p.titulo,
              descripcion: p.descripcion,
              fecha_inicio: p.fecha_inicio,
              fecha_vencimiento: p.fecha_fin || p.fecha_vencimiento,
              porcentaje_completado: p.porcentaje_completado || 0,
              prioridad: p.prioridad || 'media',
              path: `/proyectos/${p.id}`
            })) : [];
          
          // 3. Obtener tareas asignadas
          const tasksResponse = await axios.get(
            `${API_BASE_URL}/usuarios/${userId}/tareas`, 
            config
          );
          
          const tareas = tasksResponse.data.success ? 
            tasksResponse.data.tareas.map((t: any) => ({
              id: t.id,
              tipo: 'tarea' as const,
              titulo: t.titulo,
              descripcion: t.descripcion,
              fecha_inicio: t.fecha_inicio,
              fecha_vencimiento: t.fecha_fin || t.fecha_vencimiento,
              porcentaje_completado: t.porcentaje_completado || 0,
              prioridad: t.prioridad || 'media',
              path: `/proyectos/${t.id_proyecto}/tareas/${t.id}`
            })) : [];
          
          // 4. Obtener subtareas asignadas
          const subtasksResponse = await axios.get(
            `${API_BASE_URL}/usuarios/${userId}/subtareas`, 
            config
          );
          
          const subtareas = subtasksResponse.data.success ? 
            subtasksResponse.data.subtareas.map((st: any) => ({
              id: st.id,
              tipo: 'subtarea' as const,
              titulo: st.titulo,
              descripcion: st.descripcion,
              fecha_inicio: st.fecha_inicio,
              fecha_vencimiento: st.fecha_fin || st.fecha_vencimiento,
              porcentaje_completado: st.porcentaje_completado || 0,
              prioridad: st.prioridad || 'media',
              path: `/proyectos/${st.id_proyecto}/tareas/${st.id_tarea}/subtareas/${st.id}`
            })) : [];
          
          // 5. Combinar todas las asignaciones y ordenar por fecha de vencimiento
          const allAssignments = [...proyectos, ...tareas, ...subtareas];
          allAssignments.sort((a, b) => {
            return new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime();
          });
          
          setAssignments(allAssignments);
        } else {
          setError('No se pudo obtener información del usuario');
        }
      } catch (error: any) {
        console.error('Error al obtener datos del usuario:', error.message);
        setError(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, token]);
  
  // Manejar cambios en el formulario de edición
  const handleInputChange = (e: React.ChangeEvent<HTMLElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Guardar cambios del usuario
  const handleSaveUser = async () => {
    try {
      const config = {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
      };
      
      const response = await axios.put(
        `${API_BASE_URL}/usuarios/${userId}`,
        editForm,
        config
      );
      
      if (response.data.success) {
        // Actualizar datos del usuario en estado
        setUser(prev => prev ? {...prev, ...editForm} : null);
        setShowEditModal(false);
      } else {
        alert(`Error al actualizar usuario: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error.message);
      alert(`Error al actualizar usuario: ${error.message}`);
    }
  };
  
  // Obtener etiqueta según prioridad
  const getPriorityBadge = (prioridad: string) => {
    switch(prioridad.toLowerCase()) {
      case 'alta':
        return <Badge bg="danger">Alta</Badge>;
      case 'media':
        return <Badge bg="warning">Media</Badge>;
      case 'baja':
        return <Badge bg="success">Baja</Badge>;
      default:
        return <Badge bg="secondary">{prioridad}</Badge>;
    }
  };
  
  // Obtener etiqueta según estado de completado
  const getStatusBadge = (porcentaje: number) => {
    if (porcentaje === 100) {
      return <Badge bg="success">Completado</Badge>;
    } else if (porcentaje > 0) {
      return <Badge bg="primary">En Progreso</Badge>;
    } else {
      return <Badge bg="secondary">Pendiente</Badge>;
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };
  
  // Verificar si una fecha está vencida
  const isOverdue = (dateString: string, porcentaje: number) => {
    if (porcentaje === 100) return false;
    
    try {
      const dueDate = new Date(dateString);
      const today = new Date();
      return dueDate < today;
    } catch {
      return false;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Detalle de Usuario</span>
          {onBack && (
            <Button variant="outline-secondary" size="sm" onClick={onBack}>
              Volver
            </Button>
          )}
        </Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando información del usuario...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (error || !user) {
    return (
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Detalle de Usuario</span>
          {onBack && (
            <Button variant="outline-secondary" size="sm" onClick={onBack}>
              Volver
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <div className="alert alert-danger">{error || 'No se pudo cargar la información del usuario'}</div>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Detalle de Usuario</span>
          {onBack && (
            <Button variant="outline-secondary" size="sm" onClick={onBack}>
              Volver
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3} className="text-center mb-3 mb-md-0">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.nombre} 
                  className="rounded-circle img-fluid" 
                  style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }} 
                />
              ) : (
                <div 
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto" 
                  style={{ width: '150px', height: '150px', fontSize: '60px' }}
                >
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
              )}
            </Col>
            <Col md={9}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h3>{user.nombre}</h3>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <i className="bi bi-pencil"></i> Editar
                </Button>
              </div>
              <p className="text-muted">{user.email}</p>
              <p>
                <strong>Rol:</strong> {user.rol || 'No especificado'}
              </p>
              <div className="mt-3">
                <Row>
                  <Col md={4} className="mb-2">
                    <div className="border rounded p-2 text-center">
                      <div className="h4">{assignments.filter(a => a.tipo === 'proyecto').length}</div>
                      <div className="small text-muted">Proyectos Asignados</div>
                    </div>
                  </Col>
                  <Col md={4} className="mb-2">
                    <div className="border rounded p-2 text-center">
                      <div className="h4">{assignments.filter(a => a.tipo === 'tarea').length}</div>
                      <div className="small text-muted">Tareas Asignadas</div>
                    </div>
                  </Col>
                  <Col md={4} className="mb-2">
                    <div className="border rounded p-2 text-center">
                      <div className="h4">{assignments.filter(a => a.tipo === 'subtarea').length}</div>
                      <div className="small text-muted">Subtareas Asignadas</div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Asignaciones de {user.nombre}</h5>
        </Card.Header>
        <div style={{ overflowX: 'auto' }}>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Fecha Inicio</th>
                <th>Fecha Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-3">
                    No hay asignaciones para este usuario
                  </td>
                </tr>
              ) : (
                assignments.map(item => (
                  <tr key={`${item.tipo}-${item.id}`}>
                    <td>{item.titulo}</td>
                    <td>
                      <Badge bg={
                        item.tipo === 'proyecto' ? 'info' :
                        item.tipo === 'tarea' ? 'primary' : 'secondary'
                      }>
                        {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                      </Badge>
                    </td>
                    <td>{getPriorityBadge(item.prioridad)}</td>
                    <td>{formatDate(item.fecha_inicio)}</td>
                    <td>
                      <span className={isOverdue(item.fecha_vencimiento, item.porcentaje_completado) ? 'text-danger fw-bold' : ''}>
                        {formatDate(item.fecha_vencimiento)}
                        {isOverdue(item.fecha_vencimiento, item.porcentaje_completado) && (
                          <Badge bg="danger" className="ms-1">Vencido</Badge>
                        )}
                      </span>
                    </td>
                    <td>{getStatusBadge(item.porcentaje_completado)}</td>
                    <td>
                      {item.path && (
                        <Link to={item.path} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i> Ver
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
      
      {/* Modal para editar usuario */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control 
                type="text" 
                name="nombre" 
                value={editForm.nombre} 
                onChange={handleInputChange} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email" 
                value={editForm.email} 
                onChange={handleInputChange} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select 
                name="rol" 
                value={editForm.rol} 
                onChange={handleInputChange}
              >
                <option value="">No especificado</option>
                <option value="admin">Administrador</option>
                <option value="gerente">Gerente</option>
                <option value="desarrollador">Desarrollador</option>
                <option value="analista">Analista</option>
                <option value="diseñador">Diseñador</option>
                <option value="tester">Tester</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserDetail;