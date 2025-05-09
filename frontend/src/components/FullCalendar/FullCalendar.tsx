// FullCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import { Button, ButtonGroup, Card, Container, Row, Col } from 'react-bootstrap';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './FullCalendar.css';
import { Event, EventFilters } from '../../models/Event'; // Importamos las interfaces desde el modelo centralizado

// Configurar localización en español
moment.locale('es');
const localizer = momentLocalizer(moment);

interface FullCalendarProps {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
  onSelectSlot?: (slotInfo: any) => void;
  initialDate?: Date; // Añadimos esta propiedad que usas en CalendarPage
}

const FullCalendar: React.FC<FullCalendarProps> = ({ 
  events = [], 
  onSelectEvent,
  onSelectSlot,
  initialDate
}) => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(initialDate || new Date());
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const [filters, setFilters] = useState<EventFilters>({
    tasks: true,
    events: true,
    holidays: true,
    guardias: true, // Añadido para filtrar guardias
    searchTerm: ''
  });

  useEffect(() => {
    // Aplicar filtros
    const filtered = events.filter(event => {
      // Filtrar por tipo
      if (event.type === 'task' && !filters.tasks) return false;
      if (event.type === 'event' && !filters.events) return false;
      if (event.type === 'holiday' && !filters.holidays) return false;
      if (event.type === 'guardia' && !filters.guardias) return false; // Filtro para guardias
      
      // Filtrar por término de búsqueda si existe
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.toLowerCase();
        return (
          event.title.toLowerCase().includes(searchTerm) ||
          (event.description || '').toLowerCase().includes(searchTerm) ||
          (event.location || '').toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    });
    
    setFilteredEvents(filtered);
  }, [events, filters]);

  // Manejar cambio de vista
  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // Manejar navegación en el calendario
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(date);
    
    if (action === 'PREV') {
      if (view === Views.MONTH) newDate.setMonth(date.getMonth() - 1);
      else if (view === Views.WEEK) newDate.setDate(date.getDate() - 7);
      else if (view === Views.DAY) newDate.setDate(date.getDate() - 1);
    } else if (action === 'NEXT') {
      if (view === Views.MONTH) newDate.setMonth(date.getMonth() + 1);
      else if (view === Views.WEEK) newDate.setDate(date.getDate() + 7);
      else if (view === Views.DAY) newDate.setDate(date.getDate() + 1);
    } else if (action === 'TODAY') {
      newDate.setTime(new Date().getTime());
    }
    
    setDate(newDate);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (filterType: 'tasks' | 'events' | 'holidays' | 'guardias') => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: !prevFilters[filterType as keyof EventFilters] as boolean
    }));
  };

  // Personalizar el aspecto de los eventos
  const eventStyleGetter = (event: Event) => {
    let backgroundColor = event.color || '#3174ad';
    
    if (!event.color) {
      // Ya que sabemos que type nunca es undefined (según nuestra interfaz Event)
      switch (event.type) {
        case 'task':
          backgroundColor = '#0d6efd'; // Bootstrap primary
          break;
        case 'holiday':
          backgroundColor = '#dc3545'; // Bootstrap danger
          break;
        case 'event':
          backgroundColor = '#198754'; // Bootstrap success
          break;
        case 'guardia':
          backgroundColor = '#9c27b0'; // Púrpura para guardias
          break;
      }
    }
    
    // Si es una tarea completada, añadir opacidad
    const opacity = event.type === 'task' && event.completed ? 0.6 : 0.9;
    
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    
    return {
      style
    };
  };

  // Formato para las horas
  const formats = {
    timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
    dayFormat: (date: Date) => moment(date).format('ddd DD'),
    eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
      return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
    }
  };

  // Formatear el mes actual en mayúsculas
  const currentMonthYear = moment(date).format('MMMM YYYY').toUpperCase();

  return (
    <Container fluid className="full-calendar-container">
      <Card className="calendar-card">
        <Card.Header className="py-3">
          <Row className="align-items-center">
            <Col sm={4}>
              <h4 className="mb-0 fw-bold">{currentMonthYear}</h4>
            </Col>
            <Col sm={4} className="text-center">
              <ButtonGroup>
                <Button variant="outline-secondary" onClick={() => handleNavigate('PREV')}>
                  &laquo;
                </Button>
                <Button variant="outline-primary" onClick={() => handleNavigate('TODAY')}>
                  Hoy
                </Button>
                <Button variant="outline-secondary" onClick={() => handleNavigate('NEXT')}>
                  &raquo;
                </Button>
              </ButtonGroup>
            </Col>
            <Col sm={4} className="text-end">
              <ButtonGroup>
                <Button 
                  variant={view === Views.MONTH ? 'primary' : 'outline-primary'}
                  onClick={() => handleViewChange(Views.MONTH)}
                >
                  Mes
                </Button>
                <Button 
                  variant={view === Views.WEEK ? 'primary' : 'outline-primary'}
                  onClick={() => handleViewChange(Views.WEEK)}
                >
                  Semana
                </Button>
                <Button 
                  variant={view === Views.DAY ? 'primary' : 'outline-primary'}
                  onClick={() => handleViewChange(Views.DAY)}
                >
                  Día
                </Button>
                <Button 
                  variant={view === Views.AGENDA ? 'primary' : 'outline-primary'}
                  onClick={() => handleViewChange(Views.AGENDA)}
                >
                  Agenda
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="px-3 py-4">
          <Row className="mb-3">
            <Col className="d-flex justify-content-end">
              <ButtonGroup>
                <Button 
                  variant={filters.tasks ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('tasks')}
                >
                  Tareas
                </Button>
                <Button 
                  variant={filters.events ? 'success' : 'outline-success'}
                  onClick={() => handleFilterChange('events')}
                >
                  Eventos
                </Button>
                <Button 
                  variant={filters.holidays ? 'danger' : 'outline-danger'}
                  onClick={() => handleFilterChange('holidays')}
                >
                  Feriados
                </Button>
                <Button 
                  variant={filters.guardias ? 'secondary' : 'outline-secondary'}
                  style={{ 
                    backgroundColor: filters.guardias ? '#9c27b0' : 'transparent', 
                    borderColor: '#9c27b0',
                    color: filters.guardias ? 'white' : '#9c27b0'
                  }}
                  onClick={() => handleFilterChange('guardias')}
                >
                  Guardias
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Row>
            <Col>
              <div className="calendar-container">
                <Calendar
                  localizer={localizer}
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 600 }}
                  view={view}
                  date={date}
                  onNavigate={(newDate) => setDate(newDate)}
                  onView={(newView) => setView(newView)}
                  eventPropGetter={eventStyleGetter}
                  selectable={true}
                  onSelectEvent={(event) => onSelectEvent && onSelectEvent(event as Event)}
                  onSelectSlot={(slotInfo) => onSelectSlot && onSelectSlot(slotInfo)}
                  formats={formats}
                  popup={true}
                  components={{
                    toolbar: () => null // Eliminamos la barra de herramientas duplicada
                  }}
                  messages={{
                    today: 'Hoy',
                    previous: 'Anterior',
                    next: 'Siguiente',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                    agenda: 'Agenda',
                    date: 'Fecha',
                    time: 'Hora',
                    event: 'Evento',
                    allDay: 'Todo el día',
                    noEventsInRange: 'No hay eventos en este rango'
                  }}
                />
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FullCalendar;