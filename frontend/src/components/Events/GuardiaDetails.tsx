// src/components/Events/GuardiaDetails.tsx
import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event } from '../../models/Event';

interface GuardiaDetailsProps {
  event: Event;
}

const GuardiaDetails: React.FC<GuardiaDetailsProps> = ({ event }) => {
  // Extraer el nombre del usuario de la guardia del título
  // El título tiene formato "Guardia: Nombre del Usuario"
  const userName = event.title.startsWith('Guardia:') 
    ? event.title.substring(9).trim() 
    : event.title;

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="mb-3 d-flex align-items-center">
          <div 
            className="event-dot me-2" 
            style={{ 
              backgroundColor: '#9c27b0',
              width: '12px',
              height: '12px',
              borderRadius: '50%'
            }}
          ></div>
          <Badge 
            bg="secondary" 
            style={{ backgroundColor: '#9c27b0' }}
          >
            Guardia
          </Badge>
        </div>

        <h4 className="mb-3">{userName}</h4>
        
        <Row className="mb-3">
          <Col xs={4} className="text-muted">Fecha:</Col>
          <Col>
            {format(new Date(event.start), 'EEEE, d MMMM yyyy', { locale: es })}
          </Col>
        </Row>

        {event.description && (
          <Row className="mb-3">
            <Col xs={4} className="text-muted">Notas:</Col>
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

export default GuardiaDetails;