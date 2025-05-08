import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import FullCalendar from '../components/FullCalendar/FullCalendar';
import { fetchEvents, deleteEvent } from '../services/EventService';
import { Event } from '../models/Event';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Extraer fecha de los parámetros de URL
  const queryParams = new URLSearchParams(location.search);
  const dateParam = queryParams.get('date');
  const initialDate = dateParam ? new Date(dateParam) : new Date();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await fetchEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setError('No se pudieron cargar los eventos. Por favor intenta nuevamente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSelectEvent = (event: Event) => {
    navigate(`/calendar/event/${event.id}`);
  };

  const handleSelectSlot = (slotInfo: any) => {
    navigate(`/calendar/admin?start=${slotInfo.start.toISOString()}&end=${slotInfo.end.toISOString()}`);
  };

  const handleCreateEvent = () => {
    navigate('/calendar/admin');
  };

  const handleAdminMode = () => {
    navigate('/calendar/admin');
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
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={() => navigate('/')} />

      <div style={contentStyle}>
        <Container className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Calendario</h2>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={handleCreateEvent}>
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Evento
              </Button>
              <Button variant="outline-secondary" onClick={handleAdminMode}>
                <i className="bi bi-gear me-2"></i>
                Modo Administrador
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
              <Button
                variant="outline-primary"
                size="sm"
                className="ms-3"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </Button>
            </Alert>
          )}

          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando calendario...</p>
                </div>
              ) : (
                <FullCalendar
                  events={events}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  initialDate={initialDate}
                />
              )}
            </Card.Body>
          </Card>
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default CalendarPage;