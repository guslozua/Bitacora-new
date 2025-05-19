// src/components/Events/GuardiaDetails.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Tabs, Tab } from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event } from '../../models/Event';
import IncidentesListaGuardia from '../Incidentes/IncidentesListaGuardia';

interface GuardiaDetailsProps {
  event: Event;
  onEventUpdate?: () => void;
  openIncidentesTab?: boolean;
}

const GuardiaDetails: React.FC<GuardiaDetailsProps> = ({ 
  event, 
  onEventUpdate,
  openIncidentesTab = false
}) => {
  // Extraer el ID numérico de la guardia desde el ID del evento
  const getGuardiaId = () => {
    if (typeof event.id === 'string' && event.id.startsWith('guardia-')) {
      return parseInt(event.id.replace('guardia-', ''));
    }
    return parseInt(String(event.id).replace('guardia-', ''));
  };

  // Extraer el nombre del usuario de la guardia del título
  const userName = event.title.startsWith('Guardia:') 
    ? event.title.substring(9).trim() 
    : event.title;

  // Estado para la pestaña activa, inicializar con 'incidentes' si openIncidentesTab es true
  const [activeTab, setActiveTab] = useState(openIncidentesTab ? 'incidentes' : 'info');
  
  // Actualizar la pestaña activa si cambia openIncidentesTab
  useEffect(() => {
    if (openIncidentesTab) {
      setActiveTab('incidentes');
    }
  }, [openIncidentesTab]);

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="info" title="Información">
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
          </Tab>
          
          <Tab eventKey="incidentes" title="Incidentes">
            <IncidentesListaGuardia 
              guardia={{
                id: getGuardiaId(),
                fecha: new Date(event.start).toISOString(),
                usuario: userName,
                notas: event.description
              }}
              onIncidentesChanged={onEventUpdate}
            />
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default GuardiaDetails;