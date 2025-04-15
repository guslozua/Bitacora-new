import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, ListGroup, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { fetchAllUsers } from '../services/userService';

// Interfaces
interface User {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
}

interface UserAssignmentStat {
  userId: number;
  nombre: string;
  email: string;
  avatar?: string;
  asignaciones: {
    proyectos: number;
    tareas: number;
    subtareas: number;
    total: number;
  };
  carga: number; // Porcentaje de carga de trabajo (0-100)
}

interface UserAssignmentSummaryProps {
  onUserClick?: (userId: number) => void;
}

const UserAssignmentSummary: React.FC<UserAssignmentSummaryProps> = ({ onUserClick }) => {
  const [stats, setStats] = useState<UserAssignmentStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener estadísticas de asignación de usuarios
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token || '',
          },
        };
        
        // 1. Obtener todos los usuarios
        const users = await fetchAllUsers();
        
        // 2. Obtener estadísticas de asignación para cada usuario
        const userStats: UserAssignmentStat[] = [];
        
        for (const user of users) {
          // Obtener proyectos asignados
          const projectsResponse = await axios.get(
            `http://localhost:5000/api/usuarios/${user.id}/proyectos`, 
            config
          );
          
          const proyectos = projectsResponse.data.success ? 
            projectsResponse.data.proyectos.length : 0;
          
          // Obtener tareas asignadas
          const tasksResponse = await axios.get(
            `http://localhost:5000/api/usuarios/${user.id}/tareas`, 
            config
          );
          
          const tareas = tasksResponse.data.success ? 
            tasksResponse.data.tareas.length : 0;
          
          // Obtener subtareas asignadas
          const subtasksResponse = await axios.get(
            `http://localhost:5000/api/usuarios/${user.id}/subtareas`, 
            config
          );
          
          const subtareas = subtasksResponse.data.success ? 
            subtasksResponse.data.subtareas.length : 0;
          
          // Calcular carga de trabajo (usando un algoritmo simple)
          // Podría refinarse según tu lógica de negocio
          const totalAsignaciones = proyectos + tareas + subtareas;
          // Aquí asumimos que más de 15 asignaciones es una carga completa
          const cargaPorcentaje = Math.min(100, (totalAsignaciones / 15) * 100);
          
          userStats.push({
            userId: user.id,
            nombre: user.nombre,
            email: user.email,
            avatar: user.avatar,
            asignaciones: {
              proyectos,
              tareas,
              subtareas,
              total: totalAsignaciones
            },
            carga: Math.round(cargaPorcentaje)
          });
        }
        
        // Ordenar por carga de trabajo (descendente)
        userStats.sort((a, b) => b.carga - a.carga);
        
        setStats(userStats);
      } catch (error: any) {
        console.error('Error al obtener estadísticas de asignación:', error.message);
        setError(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Función para obtener la variante de color según la carga
  const getCargaVariant = (carga: number): string => {
    if (carga >= 80) return 'danger';
    if (carga >= 60) return 'warning';
    if (carga >= 30) return 'primary';
    return 'success';
  };
  
  // Función para manejar el clic en un usuario
  const handleUserClick = (userId: number) => {
    if (onUserClick) {
      onUserClick(userId);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <Card.Header>Resumen de Asignación de Usuarios</Card.Header>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando estadísticas...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <Card.Header>Resumen de Asignación de Usuarios</Card.Header>
        <Card.Body>
          <div className="alert alert-danger">{error}</div>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Resumen de Asignación de Usuarios</span>
        <Badge bg="primary">{stats.length} usuarios</Badge>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col md={6} className="mb-3 mb-md-0">
            <Card className="h-100">
              <Card.Header className="bg-light">Usuarios con Mayor Carga</Card.Header>
              <ListGroup variant="flush">
                {stats.slice(0, 5).map((stat) => (
                  <ListGroup.Item 
                    key={stat.userId}
                    action
                    onClick={() => handleUserClick(stat.userId)}
                    className="d-flex align-items-center"
                  >
                    <div style={{ width: '40px', height: '40px', marginRight: '10px' }}>
                      {stat.avatar ? (
                        <img 
                          src={stat.avatar} 
                          alt={stat.nombre} 
                          className="rounded-circle" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                          style={{ width: '100%', height: '100%' }}
                        >
                          {stat.nombre.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold">{stat.nombre}</div>
                      <ProgressBar 
                        now={stat.carga} 
                        variant={getCargaVariant(stat.carga)} 
                        label={`${stat.carga}%`}
                      />
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="bg-light">Distribución de Carga</Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-around">
                  <div className="text-center">
                    <div className="h3 mb-0">
                      {stats.filter(s => s.carga >= 80).length}
                    </div>
                    <div className="small text-danger">
                      Alta (&gt;80%)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h3 mb-0">
                      {stats.filter(s => s.carga >= 50 && s.carga < 80).length}
                    </div>
                    <div className="small text-warning">
                      Media (50-80%)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h3 mb-0">
                      {stats.filter(s => s.carga < 50).length}
                    </div>
                    <div className="small text-success">
                      Baja (&lt;50%)
                    </div>
                  </div>
                </div>
                
                <hr />
                
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total de asignaciones:</span>
                    <strong>
                      {stats.reduce((total, stat) => total + stat.asignaciones.total, 0)}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Proyectos asignados:</span>
                    <strong>
                      {stats.reduce((total, stat) => total + stat.asignaciones.proyectos, 0)}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tareas asignadas:</span>
                    <strong>
                      {stats.reduce((total, stat) => total + stat.asignaciones.tareas, 0)}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Subtareas asignadas:</span>
                    <strong>
                      {stats.reduce((total, stat) => total + stat.asignaciones.subtareas, 0)}
                    </strong>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Card>
          <Card.Header className="bg-light">Todos los Usuarios</Card.Header>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <ListGroup variant="flush">
              {stats.map((stat) => (
                <ListGroup.Item 
                  key={stat.userId} 
                  action
                  onClick={() => handleUserClick(stat.userId)}
                >
                  <Row className="align-items-center">
                    <Col xs={6} md={3} className="d-flex align-items-center">
                      <div 
                        style={{ width: '30px', height: '30px', marginRight: '10px' }}
                        className="flex-shrink-0"
                      >
                        {stat.avatar ? (
                          <img 
                            src={stat.avatar} 
                            alt={stat.nombre} 
                            className="rounded-circle" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div 
                            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                            style={{ width: '100%', height: '100%', fontSize: '14px' }}
                          >
                            {stat.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="text-truncate">
                        <span className="fw-medium">{stat.nombre}</span>
                      </div>
                    </Col>
                    
                    <Col xs={6} md={3} className="d-none d-md-block text-muted small">
                      {stat.email}
                    </Col>
                    
                    <Col xs={6} md={3}>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg="secondary" pill>{stat.asignaciones.total}</Badge>
                        <span className="small">asignaciones</span>
                      </div>
                    </Col>
                    
                    <Col xs={6} md={3}>
                      <ProgressBar 
                        now={stat.carga} 
                        variant={getCargaVariant(stat.carga)} 
                        style={{ height: '10px' }} 
                        className="mt-1"
                      />
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small>Carga de trabajo</small>
                        <small className="fw-bold">{stat.carga}%</small>
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Card>
      </Card.Body>
    </Card>
  );
};

export default UserAssignmentSummary;