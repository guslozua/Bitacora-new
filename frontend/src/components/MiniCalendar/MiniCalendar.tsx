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
                    backgroundColor: dayEvents[0].color || 
                    (dayEvents[0].type === 'holiday' ? '#dc3545' : 
                     dayEvents[0].type === 'task' ? '#0d6efd' : '#198754') 
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
              backgroundColor: event.color || 
              (event.type === 'holiday' ? '#dc3545' : 
               event.type === 'task' ? '#0d6efd' : '#198754') 
            }}
          ></div>
          <span className="event-title">{event.title}</span>
        </div>
        <div className="event-date">
          {format(new Date(event.start), 'EEEE, d MMMM', { locale: es })}
          <Badge 
            bg={event.type === 'holiday' ? 'danger' : event.type === 'task' ? 'primary' : 'success'}
            className="ms-2"
          >
            {event.type === 'holiday' ? 'Feriado' : event.type === 'task' ? 'Tarea' : 'Evento'}
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