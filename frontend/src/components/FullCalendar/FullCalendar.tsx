// FullCalendar.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import { Button, ButtonGroup, Card, Container, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import axios from 'axios';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './FullCalendar.css';
import { Event, EventFilters } from '../../models/Event';

// Configurar localización en español
moment.locale('es');
const localizer = momentLocalizer(moment);

// Interfaces adicionales para incidentes
interface Incidente {
  id: number;
  id_guardia: number;
  inicio: string;
  fin: string;
  descripcion: string;
  estado: string;
  observaciones?: string;
  duracion_minutos?: number;
}

interface IncidenteEvent extends Event {
  incidenteId: number;
  guardiaId: number;
  incidenteEstado: string;
  isIncidente: true;
}

interface FullCalendarProps {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
  onSelectSlot?: (slotInfo: any) => void;
  initialDate?: Date;
}

// Definir los filtros con iconos y colores
const filterConfig = {
  tasks: {
    icon: 'bi-list-check',
    label: 'Tareas',
    color: '#0d6efd',
    variant: 'primary'
  },
  events: {
    icon: 'bi-calendar-event',
    label: 'Eventos',
    color: '#198754',
    variant: 'success'
  },
  holidays: {
    icon: 'bi-calendar-x',
    label: 'Feriados',
    color: '#dc3545',
    variant: 'danger'
  },
  guardias: {
    icon: 'bi-shield-check',
    label: 'Guardias',
    color: '#9c27b0',
    variant: 'secondary'
  },
  birthdays: {
    icon: 'bi-gift',
    label: 'Cumpleaños',
    color: '#ff9800',
    variant: 'warning'
  },
  daysoff: {
    icon: 'bi-calendar-plus',
    label: 'Días a Favor',
    color: '#4caf50',
    variant: 'success'
  },
  gconect: {
    icon: 'bi-wifi',
    label: 'G. Conectividad',
    color: '#00bcd4',
    variant: 'info'
  },
  vacation: {
    icon: 'bi-airplane',
    label: 'Vacaciones',
    color: '#9e9e9e',
    variant: 'secondary'
  }
};

const FullCalendar: React.FC<FullCalendarProps> = ({
  events = [],
  onSelectEvent,
  onSelectSlot,
  initialDate
}) => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(initialDate || new Date());
  const [incidentes, setIncidentes] = useState<IncidenteEvent[]>([]);
  
  // Cambiar el estado inicial - solo guardias activado por defecto
  const [filters, setFilters] = useState<EventFilters>({
    tasks: false,
    events: false,
    holidays: false,
    guardias: true, // Solo este activado por defecto
    birthdays: false,
    daysoff: false,
    gconect: false,
    vacation: false,
    searchTerm: ''
  });

  // Cargar incidentes cuando cambien los eventos o el filtro de guardias
  useEffect(() => {
    // Cargar los incidentes solo si están habilitados en los filtros
    if (filters.guardias) {
      loadIncidentes();
    }
  }, [events, filters.guardias]);

  // Función para cargar incidentes - VERSIÓN OPTIMIZADA
  const loadIncidentes = async () => {
    try {
      // Filtrar solo eventos de tipo guardia
      const guardias = events.filter(event => event.type === 'guardia');

      if (guardias.length === 0) {
        setIncidentes([]);
        return;
      }

      // Obtener IDs de guardias
      const guardiaIds = guardias.map(guardia => {
        if (typeof guardia.id === 'string' && guardia.id.startsWith('guardia-')) {
          return parseInt(guardia.id.replace('guardia-', ''));
        }
        return parseInt(String(guardia.id).replace('guardia-', ''));
      }).filter(id => !isNaN(id)); // Filtrar IDs inválidos

      if (guardiaIds.length === 0) {
        setIncidentes([]);
        return;
      }

      // Hacer una sola petición para obtener todos los incidentes de las guardias
      // en lugar de múltiples peticiones individuales
      try {
        const response = await axios.post('/api/incidentes/guardias/multiple', {
          guardia_ids: guardiaIds
        });
        
        const incidentesData = response.data.data || [];
        
        // Convertir incidentes al formato de eventos
        const incidentesEvents: IncidenteEvent[] = incidentesData.map((incidente: Incidente) => {
          const guardia = guardias.find(g => {
            const guardiaId = typeof g.id === 'string' && g.id.startsWith('guardia-')
              ? parseInt(g.id.replace('guardia-', ''))
              : parseInt(String(g.id).replace('guardia-', ''));
            return guardiaId === incidente.id_guardia;
          });

          if (!guardia) return null;

          return {
            id: `incidente-${incidente.id}`,
            title: `Incidente: ${incidente.descripcion.substring(0, 20)}${incidente.descripcion.length > 20 ? '...' : ''}`,
            start: new Date(incidente.inicio),
            end: new Date(incidente.fin),
            allDay: false,
            type: 'guardia',
            color: getIncidenteColor(incidente.estado),
            description: incidente.descripcion,
            incidenteId: incidente.id,
            guardiaId: incidente.id_guardia,
            incidenteEstado: incidente.estado,
            isIncidente: true
          };
        }).filter(Boolean); // Filtrar elementos nulos

        setIncidentes(incidentesEvents);
        
      } catch (apiError) {
        // Si el endpoint múltiple no existe, usar el método original pero con manejo mejorado
        console.warn('Endpoint múltiple no disponible, usando método individual con manejo optimizado');
        
        // Limitar las peticiones concurrentes para evitar sobrecarga
        const BATCH_SIZE = 5;
        const incidentesEvents: IncidenteEvent[] = [];
        
        for (let i = 0; i < guardiaIds.length; i += BATCH_SIZE) {
          const batch = guardiaIds.slice(i, i + BATCH_SIZE);
          
          const batchPromises = batch.map(async (id) => {
            try {
              const response = await axios.get(`/api/incidentes/guardia/${id}`);
              return { guardiaId: id, incidentes: response.data.data || [] };
            } catch (error) {
              // Silenciosamente manejar errores 404 - es normal que algunas guardias no tengan incidentes
              if (axios.isAxiosError(error) && error.response?.status === 404) {
                return { guardiaId: id, incidentes: [] };
              }
              console.warn(`Error al cargar incidentes para guardia ${id}:`, error);
              return { guardiaId: id, incidentes: [] };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          
          // Procesar resultados del batch
          batchResults.forEach(({ guardiaId, incidentes: guardiaIncidentes }) => {
            guardiaIncidentes.forEach((incidente: Incidente) => {
              const guardia = guardias.find(g => {
                const gId = typeof g.id === 'string' && g.id.startsWith('guardia-')
                  ? parseInt(g.id.replace('guardia-', ''))
                  : parseInt(String(g.id).replace('guardia-', ''));
                return gId === guardiaId;
              });

              if (guardia) {
                incidentesEvents.push({
                  id: `incidente-${incidente.id}`,
                  title: `Incidente: ${incidente.descripcion.substring(0, 20)}${incidente.descripcion.length > 20 ? '...' : ''}`,
                  start: new Date(incidente.inicio),
                  end: new Date(incidente.fin),
                  allDay: false,
                  type: 'guardia',
                  color: getIncidenteColor(incidente.estado),
                  description: incidente.descripcion,
                  incidenteId: incidente.id,
                  guardiaId: incidente.id_guardia,
                  incidenteEstado: incidente.estado,
                  isIncidente: true
                });
              }
            });
          });
        }
        
        setIncidentes(incidentesEvents);
      }
      
    } catch (error) {
      console.error('Error general al cargar incidentes:', error);
      setIncidentes([]); // En caso de error, limpiar incidentes
    }
  };

  // Función para obtener el color según el estado del incidente
  const getIncidenteColor = (estado: string) => {
    switch (estado) {
      case 'registrado': return '#5c6bc0'; // Indigo
      case 'revisado': return '#26c6da';   // Cyan
      case 'aprobado': return '#66bb6a';   // Verde claro
      case 'rechazado': return '#ef5350';  // Rojo claro
      case 'liquidado': return '#78909c';  // Gris azulado
      default: return '#9c27b0';           // Color de guardia por defecto
    }
  };

  // Filtrar eventos y combinar con incidentes
  const filteredEvents = useMemo(() => {
    // Primero filtrar los eventos normales
    const filtered = events.filter(event => {
      // Filtrar por tipo
      if (event.type === 'task' && !filters.tasks) return false;
      if (event.type === 'event' && !filters.events) return false;
      if (event.type === 'holiday' && !filters.holidays) return false;
      if (event.type === 'guardia' && !filters.guardias) return false;
      if (event.type === 'birthday' && !filters.birthdays) return false;
      if (event.type === 'dayoff' && !filters.daysoff) return false;
      if (event.type === 'gconect' && !filters.gconect) return false;
      if (event.type === 'vacation' && !filters.vacation) return false;

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

    // Luego agregar los incidentes si las guardias están habilitadas
    const result = [...filtered];

    if (filters.guardias) {
      result.push(...incidentes);
    }

    return result;
  }, [events, incidentes, filters]);

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
  const handleFilterChange = (filterType: keyof EventFilters) => {
    if (typeof filters[filterType] === 'boolean') {
      setFilters(prevFilters => ({
        ...prevFilters,
        [filterType]: !prevFilters[filterType]
      }));
    }
  };

  // Personalizar el aspecto de los eventos - VERSIÓN CORREGIDA
  const eventStyleGetter = (event: Event) => {
    let backgroundColor = event.color || '#3174ad';

    if (!event.color) {
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
        case 'birthday':
          backgroundColor = '#ff9800'; // Naranja para cumpleaños
          break;
        case 'dayoff':
          backgroundColor = '#4caf50'; // Verde claro para días a favor
          break;
        case 'gconect':
          backgroundColor = '#00bcd4'; // Azul celeste para Guardia Conectividad
          break;
        case 'vacation':
          backgroundColor = '#9e9e9e'; // Gris para Vacaciones
          break;
      }
    }

    // Calcular opacidad base
    let opacity = event.type === 'task' && event.completed ? 0.6 : 0.9;

    // NUEVO: Verificar si el evento está en un día que pertenece a otro mes
    // Solo aplicar esta lógica en la vista de mes
    if (view === Views.MONTH) {
      const eventDate = moment(event.start);
      const currentViewMonth = moment(date).month();
      const currentViewYear = moment(date).year();
      
      // Si el evento no pertenece al mes actual que se está visualizando
      if (eventDate.month() !== currentViewMonth || eventDate.year() !== currentViewYear) {
        // Aplicar opacidad reducida para difuminar (similar a los días)
        opacity = 0.3;
      }
    }

    // Establecer estilo base
    const style: React.CSSProperties = {
      backgroundColor,
      borderRadius: '4px',
      opacity,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    // Si es un incidente, agregar un borde punteado
    if ((event as IncidenteEvent).isIncidente) {
      style.borderLeft = '3px solid white';
      style.fontStyle = 'italic';
    }

    return {
      style
    };
  };

  // Modificar onSelectEvent para manejar clics en incidentes
  const handleSelectEvent = (event: Event) => {
    if ((event as IncidenteEvent).isIncidente) {
      // Para incidentes, redirigir a la vista de guardia con la pestaña de incidentes activa
      const guardiaEvent = events.find(e => {
        const guardiaId = typeof e.id === 'string' && e.id.startsWith('guardia-')
          ? parseInt(e.id.replace('guardia-', ''))
          : parseInt(String(e.id).replace('guardia-', ''));
        return guardiaId === (event as IncidenteEvent).guardiaId;
      });

      if (guardiaEvent && onSelectEvent) {
        // Usar asType para ayudar a TypeScript
        onSelectEvent({
          ...guardiaEvent,
          openIncidentesTab: true
        } as Event);
      }
    } else if (onSelectEvent) {
      onSelectEvent(event);
    }
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
  
  // Formatear el día actual para la vista de día
  const currentDayFormatted = moment(date).format('dddd DD [de] MMMM [de] YYYY').toUpperCase();
  
  // Función para obtener el título según la vista
  const getTitleByView = () => {
    switch (view) {
      case Views.DAY:
        return currentDayFormatted;
      case Views.WEEK:
        const startWeek = moment(date).startOf('week');
        const endWeek = moment(date).endOf('week');
        return `${startWeek.format('DD [de] MMMM')} - ${endWeek.format('DD [de] MMMM YYYY')}`.toUpperCase();
      case Views.AGENDA:
        return `AGENDA - ${currentMonthYear}`;
      default: // MONTH
        return currentMonthYear;
    }
  };

  // Renderizar botón de filtro con icono - estilo similar al alfabético del glosario
  const renderFilterButton = (filterKey: keyof typeof filterConfig) => {
    const config = filterConfig[filterKey];
    const isActive = filters[filterKey as keyof EventFilters];
    
    return (
      <OverlayTrigger
        key={filterKey}
        placement="top"
        overlay={<Tooltip id={`tooltip-${filterKey}`}>{config.label}</Tooltip>}
      >
        <span
          onClick={() => handleFilterChange(filterKey as keyof EventFilters)}
          className={`filter-icon ${isActive ? 'active' : ''}`}
          style={{
            backgroundColor: isActive ? config.color : '#f8f9fa',
            color: isActive ? 'white' : config.color,
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            margin: '4px',
            border: isActive ? `2px solid ${config.color}` : '2px solid transparent',
            boxShadow: isActive 
              ? `0 4px 12px ${config.color}40, 0 0 0 3px ${config.color}20` 
              : '0 2px 8px rgba(0,0,0,0.1)',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <i 
            className={config.icon} 
            style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'none',
              zIndex: 1
            }}
          />
          {isActive && (
            <>
              {/* Efecto de brillo interno */}
              <div
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  right: '60%',
                  bottom: '60%',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  filter: 'blur(8px)'
                }}
              />
              {/* Anillo exterior pulsante */}
              <div
                className="pulse-ring"
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  borderRadius: '50%',
                  border: `2px solid ${config.color}`,
                  opacity: 0.6,
                  animation: 'pulse-ring 2s infinite'
                }}
              />
            </>
          )}
        </span>
      </OverlayTrigger>
    );
  };

  return (
    <Container fluid className="full-calendar-container">
      <Card className="calendar-card">
        <Card.Header className="py-3">
          <Row className="align-items-center">
            <Col sm={4}>
              <h4 className="mb-0 fw-bold" style={{ fontSize: view === Views.DAY ? '1.1rem' : '1.5rem' }}>
                {getTitleByView()}
              </h4>
              {view === Views.DAY && (
                <small className="text-muted d-block mt-1">
                  {moment(date).calendar(null, {
                    sameDay: '[Hoy]',
                    nextDay: '[Mañana]',
                    nextWeek: 'dddd',
                    lastDay: '[Ayer]',
                    lastWeek: '[El] dddd [pasado]',
                    sameElse: 'DD/MM/YYYY'
                  })}
                </small>
              )}
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
            <Col className="d-flex flex-wrap justify-content-center gap-1">
              <div className="d-flex flex-wrap justify-content-center align-items-center p-3">
                {Object.keys(filterConfig).map(filterKey => 
                  renderFilterButton(filterKey as keyof typeof filterConfig)
                )}
              </div>
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
                  onSelectEvent={handleSelectEvent}
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