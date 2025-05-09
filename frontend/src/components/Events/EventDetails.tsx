// src/components/Events/EventDetails.tsx
import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event } from '../../models/Event';
import GuardiaDetails from './GuardiaDetails';

interface EventDetailsProps {
  event: Event;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event }) => {
  // Si es una guardia, usar el componente específico para guardias
  if (event.type === 'guardia') {
    return <GuardiaDetails event={event} />;
  }

  // Función para obtener la variante del Badge según el tipo de evento
  const getBadgeVariant = (eventType: string): string => {
    switch (eventType) {
      case 'holiday':
        return 'danger';
      case 'task':
        return 'primary';
      case 'guardia':
        return 'secondary'; // Para guardias se usa el componente GuardiaDetails
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
        return 'Guardia'; // Para guardias se usa el componente GuardiaDetails
      case 'event':
      default:
        return 'Evento';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="mb-3 d-flex align-items-center">
          <div 
            className="event-dot me-2" 
            style={{ 
              backgroundColor: event.color || 
                (event.type === 'holiday' ? '#dc3545' : 
                 event.type === 'task' ? '#0d6efd' : '#198754'),
              width: '12px',
              height: '12px',
              borderRadius: '50%'
            }}
          ></div>
          <Badge bg={getBadgeVariant(event.type)}>
            {getEventTypeText(event.type)}
          </Badge>
          
          {event.type === 'task' && (
            <Badge 
              bg={event.completed ? 'success' : 'warning'}
              className="ms-2"
            >
              {event.completed ? 'Completada' : 'Pendiente'}
            </Badge>
          )}
        </div>

        <h4 className="mb-3">{event.title}</h4>
        
        <Row className="mb-3">
          <Col xs={4} className="text-muted">Fecha:</Col>
          <Col>
            {format(new Date(event.start), 'EEEE, d MMMM yyyy', { locale: es })}
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col xs={4} className="text-muted">Hora:</Col>
          <Col>
            {event.allDay 
              ? 'Todo el día' 
              : `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}`}
          </Col>
        </Row>

        {event.location && (
          <Row className="mb-3">
            <Col xs={4} className="text-muted">Ubicación:</Col>
            <Col>{event.location}</Col>
          </Row>
        )}

        {event.description && (
          <Row className="mb-3">
            <Col xs={4} className="text-muted">Descripción:</Col>
            <Col>{event.description}</Col>
          </Row>
        )}

        <Row>
          <Col xs={4} className="text-muted">ID:</Col>
          <Col>
            <code>{event.id}</code>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default EventDetails;