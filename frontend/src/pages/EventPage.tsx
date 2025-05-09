import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { fetchEventById, deleteEvent, markEventAsCompleted } from '../services/EventService';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Event } from '../models/Event';

const EventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const eventData = await fetchEventById(id);
        setEvent(eventData);
      } catch (error) {
        console.error('Error al cargar el evento:', error);
        setError('No se pudo cargar la información del evento');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleDelete = async () => {
    if (!event) return;
    
    if (window.confirm('¿Estás seguro que deseas eliminar este evento?')) {
      try {
        await deleteEvent(event.id);
        navigate('/calendar');
      } catch (error) {
        console.error('Error al eliminar el evento:', error);
        setError('No se pudo eliminar el evento');
      }
    }
  };

  const handleEdit = () => {
    // Si es una guardia, redirigir a la administración de guardias
    if (event?.type === 'guardia') {
      const guardiaId = event.id.replace('guardia-', '');
      navigate(`/admin/guardias?edit=${guardiaId}`);
    } else {
      // De lo contrario, redirigir a la edición de eventos
      navigate(`/calendar/admin?edit=${id}`);
    }
  };

  const handleCompleteTask = async () => {
    if (!event || event.type !== 'task') return;
    
    try {
      const completed = !event.completed;
      await markEventAsCompleted(event.id, completed);
      // Actualizar el estado local
      setEvent({
        ...event,
        completed
      });
    } catch (error) {
      console.error('Error al cambiar estado de la tarea:', error);
      setError('No se pudo actualizar el estado de la tarea');
    }
  };

  const handleBack = () => {
    navigate('/calendar');
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'task':
        return 'Tarea';
      case 'holiday':
        return 'Feriado';
      case 'event':
        return 'Evento';
      case 'guardia':
        return 'Guardia';
      default:
        return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'primary';
      case 'holiday':
        return 'danger';
      case 'event':
        return 'success';
      case 'guardia':
        return 'secondary'; // Usaremos secondary y luego estilizaremos con CSS
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  // Extraer el nombre del usuario de guardia del título si es un evento de tipo guardia
  const extractGuardiaUsername = (title: string) => {
    if (title.startsWith('Guardia: ')) {
      return title.replace('Guardia: ', '');
    }
    return title;
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={() => navigate('/')} />

      <div style={contentStyle}>
        <Container className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Button variant="outline-secondary" onClick={handleBack}>
              <i className="bi bi-arrow-left me-2"></i>
              Volver al Calendario
            </Button>
            <h2 className="mb-0">Detalles del Evento</h2>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando información del evento...</p>
            </div>
          ) : event ? (
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge 
                      bg={getEventTypeColor(event.type)} 
                      className="me-2"
                      style={event.type === 'guardia' ? { backgroundColor: '#9c27b0' } : {}}
                    >
                      {getEventTypeLabel(event.type)}
                    </Badge>
                    <h3 className="mb-0 d-inline">
                      {event.type === 'guardia' ? extractGuardiaUsername(event.title) : event.title}
                    </h3>
                  </div>
                  <div>
                    {event.type === 'task' && (
                      <Button
                        variant={event.completed ? 'outline-success' : 'success'}
                        className="me-2"
                        onClick={handleCompleteTask}
                      >
                        <i className={`bi ${event.completed ? 'bi-x-circle' : 'bi-check-circle'} me-1`}></i>
                        {event.completed ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                      </Button>
                    )}
                    <Button variant="outline-primary" className="me-2" onClick={handleEdit}>
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </Button>
                    <Button variant="outline-danger" onClick={handleDelete}>
                      <i className="bi bi-trash me-1"></i>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <Card.Title>Información del Evento</Card.Title>
                    <hr />
                    <Row className="mb-3">
                      <Col md={4} className="text-muted">Fecha de inicio:</Col>
                      <Col md={8}>{formatDate(event.start)}</Col>
                    </Row>
                    {/* Para guardias y feriados normalmente solo mostramos la fecha de inicio */}
                    {(event.type !== 'guardia' && event.type !== 'holiday') && (
                      <Row className="mb-3">
                        <Col md={4} className="text-muted">Fecha de fin:</Col>
                        <Col md={8}>{formatDate(event.end)}</Col>
                      </Row>
                    )}
                    {event.location && (
                      <Row className="mb-3">
                        <Col md={4} className="text-muted">Ubicación:</Col>
                        <Col md={8}>{event.location}</Col>
                      </Row>
                    )}
                    {event.type === 'task' && (
                      <Row className="mb-3">
                        <Col md={4} className="text-muted">Estado:</Col>
                        <Col md={8}>
                          <Badge bg={event.completed ? 'success' : 'warning'}>
                            {event.completed ? 'Completada' : 'Pendiente'}
                          </Badge>
                        </Col>
                      </Row>
                    )}
                    {event.type === 'guardia' && (
                      <Row className="mb-3">
                        <Col md={4} className="text-muted">Usuario de guardia:</Col>
                        <Col md={8}>{extractGuardiaUsername(event.title)}</Col>
                      </Row>
                    )}
                    {event.allDay && (
                      <Row className="mb-3">
                        <Col md={4} className="text-muted">Duración:</Col>
                        <Col md={8}>
                          <Badge bg="info">Todo el día</Badge>
                        </Col>
                      </Row>
                    )}
                    {event.createdAt && (
                      <Row className="mb-3">
                        <Col md={4} className="text-muted">Creado:</Col>
                        <Col md={8}>{new Date(event.createdAt).toLocaleString('es-AR')}</Col>
                      </Row>
                    )}
                    {event.color && (
                      <Row className="mb-3">
                        <Col md={4} className="text-muted">Color:</Col>
                        <Col md={8}>
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            backgroundColor: event.color || (event.type === 'guardia' ? '#9c27b0' : ''),
                            borderRadius: '4px',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            marginRight: '8px'
                          }}></div>
                          {event.color || (event.type === 'guardia' ? '#9c27b0' : '')}
                        </Col>
                      </Row>
                    )}
                  </Col>
                  <Col md={4}>
                    <Card className="bg-light">
                      <Card.Body>
                        <Card.Title>Descripción</Card.Title>
                        <hr />
                        <p>{event.description || 'No hay descripción disponible'}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer className="bg-white border-top-0 text-end">
                <Button variant="outline-secondary" className="me-2" onClick={handleBack}>
                  Volver
                </Button>
                <Button variant="outline-primary" onClick={handleEdit}>
                  Editar
                </Button>
              </Card.Footer>
            </Card>
          ) : (
            <Alert variant="warning">
              No se encontró el evento solicitado. Puede que haya sido eliminado o no tengas permisos para verlo.
            </Alert>
          )}
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default EventPage;