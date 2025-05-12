// MiniCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, 
         isToday, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import './MiniCalendar.css';
import { Event } from '../../models/Event'; // Importamos la interfaz Event desde el modelo centralizado

interface MiniCalendarProps {
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  showHeader?: boolean; // Nueva prop para controlar la visibilidad del encabezado
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ 
  events = [], 
  onDateClick,
  onEventClick,
  showHeader = true // Por defecto, mostrar el encabezado
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Filtrar eventos próximos (hoy y los próximos 3 días)
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    
    const filtered = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate <= threeDaysLater;
    });
    
    // Ordenar por fecha
    filtered.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    // Limitar a 5 eventos más próximos
    setUpcomingEvents(filtered.slice(0, 5));
  }, [events]);

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const renderHeader = () => {
    return (
      <div className="header">
        <button 
          className="nav-button" 
          onClick={handlePrevMonth}
          type="button"
        >
          <i className="bi bi-caret-left-fill"></i>
        </button>
        <span className="month-name">
          {format(currentMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}
        </span>
        <button 
          className="nav-button" 
          onClick={handleNextMonth}
          type="button"
        >
          <i className="bi bi-caret-right-fill"></i>
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = 'EEEEE';
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="day-name" key={i}>
          {format(addDays(startDate, i), dateFormat, { locale: es }).toUpperCase()}
        </div>
      );
    }

    return <div className="days">{days}</div>;
  };

  // Función para obtener el color según el tipo de evento
  const getEventColor = (eventType: string, eventColor?: string): string => {
    if (eventColor) return eventColor;
    
    switch (eventType) {
      case 'holiday':
        return '#dc3545'; // Bootstrap danger (rojo)
      case 'task':
        return '#0d6efd'; // Bootstrap primary (azul)
      case 'guardia':
        return '#9c27b0'; // Púrpura para guardias
      case 'birthday':
        return '#ff9800'; // Naranja para cumpleaños
      case 'dayoff':
        return '#4caf50'; // Verde claro para días a favor
      case 'event':
      default:
        return '#198754'; // Bootstrap success (verde)
    }
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    const rows = [];
    let days = [];
    let day = startDate;

    for (let i = 0; i < 42; i++) {
      const cloneDay = new Date(day);
      
      // Verificar si hay eventos en este día
      const dayEvents = events.filter(event => 
        isSameDay(new Date(event.start), cloneDay)
      );
      
      // Objeto con clases CSS según el estado del día
      const dayClasses = [
        "day",
        !isSameMonth(day, monthStart) ? "disabled" : "",
        isToday(day) ? "today" : "",
        isSameDay(day, selectedDate) ? "selected" : "",
        dayEvents.length > 0 ? "has-events" : ""
      ].join(" ");

      days.push(
        <div className="col" key={day.toString()}>
          <div 
            className={`cell ${dayClasses}`}
            onClick={() => {
              setSelectedDate(cloneDay);
              if (onDateClick) onDateClick(cloneDay);
            }}
          >
            <span className="number">{format(day, 'd')}</span>
            {dayEvents.length > 0 && (
              <div className="event-indicator">
                <span className="dot" 
                  style={{ 
                    backgroundColor: getEventColor(dayEvents[0].type, dayEvents[0].color)
                  }}>
                </span>
                {dayEvents.length > 1 && <span className="event-count">+{dayEvents.length - 1}</span>}
              </div>
            )}
          </div>
        </div>
      );

      day = addDays(day, 1);
      
      // Nueva semana
      if ((i + 1) % 7 === 0) {
        rows.push(
          <div className="row" key={day.toString()}>
            {days}
          </div>
        );
        days = [];

        // Si ya pasamos el mes actual y tenemos al menos 4 filas, no mostrar más filas
        if (!isSameMonth(day, monthStart) && rows.length >= 4) {
          break;
        }
      }
    }

    return <div className="body">{rows}</div>;
  };

  // Función para obtener la variante del Badge según el tipo de evento
  const getBadgeVariant = (eventType: string): string => {
    switch (eventType) {
      case 'holiday':
        return 'danger';
      case 'task':
        return 'primary';
      case 'guardia':
        return 'secondary'; // Usaremos secondary y luego estilizaremos con CSS
      case 'birthday':
        return 'warning';   // Naranja para cumpleaños
      case 'dayoff':
        return 'success';   // Verde para días a favor
      case 'event':
      default:
        return 'success';
    }
  };

  // Función para obtener el texto del tipo de evento en español
  const getEventTypeText = (eventType: string): string => {
    switch (eventType) {
      case 'holiday':
        return 'Feriado';
      case 'task':
        return 'Tarea';
      case 'guardia':
        return 'Guardia';
      case 'birthday':
        return 'Cumpleaños';
      case 'dayoff':
        return 'Día a Favor';
      case 'event':
      default:
        return 'Evento';
    }
  };

  const renderUpcomingEvents = () => {
    if (upcomingEvents.length === 0) {
      return <p className="text-muted text-center">No hay eventos próximos</p>;
    }

    return upcomingEvents.map(event => (
      <div 
        key={event.id} 
        className="upcoming-event"
        onClick={() => onEventClick && onEventClick(event)}
      >
        <div className="d-flex align-items-center mb-1">
          <div 
            className="event-dot" 
            style={{ 
              backgroundColor: getEventColor(event.type, event.color)
            }}
          ></div>
          <span className="event-title">{event.title}</span>
        </div>
        <div className="event-date">
          {format(new Date(event.start), 'EEEE, d MMMM', { locale: es })}
          <Badge 
            bg={getBadgeVariant(event.type)}
            className="ms-2"
            style={
              event.type === 'guardia' ? { backgroundColor: '#9c27b0' } : 
              event.type === 'birthday' ? { backgroundColor: '#ff9800' } : 
              event.type === 'dayoff' ? { backgroundColor: '#4caf50' } : {}
            }
          >
            {getEventTypeText(event.type)}
          </Badge>
        </div>
      </div>
    ));
  };

  return (
    <Card className="mini-calendar-container">
      {showHeader && (
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Calendario</h5>
          <a href="/calendar" className="text-decoration-none">Ver completo</a>
        </Card.Header>
      )}
      <Card.Body className={showHeader ? "p-2" : "pt-0 p-2"}>
        <div className="calendar-with-bg">
          <div className="calendar">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </div>
        </div>
        <div className="upcoming-events">
          <h6>Próximos eventos</h6>
          {renderUpcomingEvents()}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MiniCalendar;