import React, { useEffect, useState } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import AdminCalendar from '../components/AdminCalendar/AdminCalendar';
import { 
  fetchEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  importEvents,
  exportEvents
} from '../services/EventService';
import { Event } from '../models/Event';

const AdminCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Extraer parámetros de URL (para edición o creación desde una fecha específica)
  const queryParams = new URLSearchParams(location.search);
  const editEventId = queryParams.get('edit');
  const startDate = queryParams.get('start');
  const endDate = queryParams.get('end');

  // Función para cargar eventos - definida fuera del useEffect
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

  // Mostrar mensaje de éxito temporalmente
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleEventAdd = async (event: Event) => {
    try {
      await createEvent(event);
      const updatedEvents = await fetchEvents();
      setEvents(updatedEvents);
      setSuccessMessage('Evento creado correctamente');
    } catch (error) {
      console.error('Error al crear evento:', error);
      setError('No se pudo crear el evento');
    }
  };

  const handleEventUpdate = async (event: Event) => {
    try {
      await updateEvent(event);
      const updatedEvents = await fetchEvents();
      setEvents(updatedEvents);
      setSuccessMessage('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      setError('No se pudo actualizar el evento');
    }
  };

  const handleEventDelete = async (eventId: string | number) => {
    try {
      setLoading(true);
      
      console.log(`AdminCalendarPage: Eliminando evento ${eventId}, tipo: ${typeof eventId}`);
      
      // Llamar al servicio para eliminar el evento
      await deleteEvent(eventId);
      
      console.log(`AdminCalendarPage: Eliminación exitosa`);
      
      // Actualizar la lista de eventos después de la eliminación
      await loadEvents();
      
      setSuccessMessage('Evento eliminado correctamente');
      
      return true;
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      setError('No se pudo eliminar el evento. Por favor, intente nuevamente.');
      
      // Re-lanzar el error para que AdminCalendar pueda manejarlo y mostrar un mensaje al usuario
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleImportEvents = async (file: File) => {
    try {
      await importEvents(file); // Actualizado de importEventsFromCSV
      const updatedEvents = await fetchEvents();
      setEvents(updatedEvents);
      setSuccessMessage('Eventos importados correctamente');
    } catch (error) {
      console.error('Error al importar eventos:', error);
      setError('No se pudieron importar los eventos');
    }
  };

  // Versión corregida para coincidir con el tipo esperado en AdminCalendar
  const handleExportEvents = async (format?: string) => {
    // Validamos el formato o usamos 'csv' como valor predeterminado
    const validFormat = (format === 'csv' || format === 'json' || format === 'excel') 
      ? format 
      : 'csv';
    
    try {
      await exportEvents(validFormat);
      setSuccessMessage(`Eventos exportados correctamente en formato ${validFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Error al exportar eventos:', error);
      setError(`No se pudieron exportar los eventos en formato ${validFormat.toUpperCase()}`);
    }
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
        <Container fluid className="py-4 px-4">
          {successMessage && (
            <Alert variant="success" className="mb-4">
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando administrador de calendario...</p>
            </div>
          ) : (
            <AdminCalendar
              events={events}
              onEventAdd={handleEventAdd}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
              onImportEvents={handleImportEvents}
              onExportEvents={handleExportEvents} // Corregido para coincidir con el tipo esperado
              editEventId={editEventId}
              initialStartDate={startDate ? new Date(startDate) : undefined}
              initialEndDate={endDate ? new Date(endDate) : undefined}
            />
          )}
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default AdminCalendarPage;