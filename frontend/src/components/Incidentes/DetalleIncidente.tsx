// src/components/Incidentes/DetalleIncidente.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Incidente, CodigoAplicado } from '../../models/Event';
import IncidenteService from '../../services/IncidenteService';
import ResumenCodigos from './ResumenCodigos';
import DistribucionCodigos from './DistribucionCodigos';
import { formatearMinutosComoHoras } from '../../utils/DateUtils';

interface DetalleIncidenteProps {
  incidenteId: number;
  onEditar?: (incidente: Incidente) => void;
  onCambiarEstado?: (incidente: Incidente, nuevoEstado: string) => void;
  onEliminar?: (incidente: Incidente) => void;
  onCerrar?: () => void;
}

const DetalleIncidente: React.FC<DetalleIncidenteProps> = ({
  incidenteId,
  onEditar,
  onCambiarEstado,
  onEliminar,
  onCerrar
}) => {
  const [incidente, setIncidente] = useState<Incidente | null>(null);
  const [codigos, setCodigos] = useState<CodigoAplicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('detalles');
  
  // Cargar incidente al montar el componente
  useEffect(() => {
    cargarIncidente();
  }, [incidenteId]);
  
  // Cargar datos del incidente
  const cargarIncidente = async () => {
    try {
      setLoading(true);
      
      const data = await IncidenteService.fetchIncidenteById(incidenteId);
      setIncidente(data);
      
      // Extraer códigos aplicados
      if (data.codigos_aplicados) {
        setCodigos(data.codigos_aplicados);
      }
    } catch (error: any) {
      console.error('Error al cargar incidente:', error);
      setError('No se pudo cargar la información del incidente');
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener etiqueta para estado
  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'registrado':
        return 'Registrado';
      case 'revisado':
        return 'Revisado';
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      case 'liquidado':
        return 'Liquidado';
      default:
        return estado;
    }
  };
  
  // Obtener color para estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'registrado':
        return 'primary';
      case 'revisado':
        return 'info';
      case 'aprobado':
        return 'success';
      case 'rechazado':
        return 'danger';
      case 'liquidado':
        return 'dark';
      default:
        return 'secondary';
    }
  };
  
  // Obtener estados posibles para cambio
  const getEstadosSiguientes = (estadoActual: string) => {
    switch (estadoActual) {
      case 'registrado':
        return ['revisado', 'aprobado', 'rechazado'];
      case 'revisado':
        return ['aprobado', 'rechazado'];
      case 'aprobado':
        return ['liquidado'];
      case 'rechazado':
        return ['registrado'];
      case 'liquidado':
        return [];
      default:
        return [];
    }
  };
  
  // Formatear fecha y hora
  const formatearFechaHora = (fecha: Date | string) => {
    return format(new Date(fecha), 'EEEE, d MMMM yyyy - HH:mm', { locale: es });
  };
  
  // Calcular duración en minutos
  const calcularDuracion = (inicio: Date | string, fin: Date | string) => {
    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    const diffMs = finDate.getTime() - inicioDate.getTime();
    return Math.floor(diffMs / (1000 * 60));
  };
  
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando información del incidente...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }
  
  if (!incidente) {
    return (
      <Alert variant="warning">
        No se encontró el incidente solicitado.
      </Alert>
    );
  }
  
  return (
    <div>
      <Card className="shadow-sm mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center py-3">
          <div>
            <h5 className="mb-0">Incidente #{incidente.id}</h5>
            <Badge bg={getEstadoColor(incidente.estado!)}>
              {getEstadoLabel(incidente.estado!)}
            </Badge>
          </div>
          
          <div>
            {onEditar && incidente.estado !== 'liquidado' && (
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => onEditar(incidente)}
              >
                <i className="bi bi-pencil me-1"></i>
                Editar
              </Button>
            )}
            
            {onCambiarEstado && 
             getEstadosSiguientes(incidente.estado!).length > 0 && (
              <div className="dropdown d-inline-block me-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="dropdown-toggle"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-arrow-right me-1"></i>
                  Cambiar Estado
                </Button>
                <ul className="dropdown-menu">
                  {getEstadosSiguientes(incidente.estado!).map(estado => (
                    <li key={estado}>
                      <button
                        className="dropdown-item"
                        onClick={() => onCambiarEstado(incidente, estado)}
                      >
                        <Badge bg={getEstadoColor(estado)} className="me-2">
                          {getEstadoLabel(estado)}
                        </Badge>
                        Marcar como {getEstadoLabel(estado)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {onEliminar && incidente.estado !== 'liquidado' && (
              <Button
                variant="outline-danger"
                size="sm"
                className="me-2"
                onClick={() => onEliminar(incidente)}
              >
                <i className="bi bi-trash me-1"></i>
                Eliminar
              </Button>
            )}
            
            {onCerrar && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onCerrar}
              >
                <i className="bi bi-x-lg me-1"></i>
                Cerrar
              </Button>
            )}
          </div>
        </Card.Header>
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => k && setActiveTab(k)}
          className="nav-tabs-custom"
        >
          <Tab eventKey="detalles" title="Detalles">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-uppercase text-muted mb-3">Información General</h6>
                  
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Usuario Guardia:</Col>
                    <Col md={8}><strong>{incidente.usuario_guardia}</strong></Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Fecha Guardia:</Col>
                    <Col md={8}>{format(new Date(incidente.fecha_guardia!), 'EEEE, d MMMM yyyy', { locale: es })}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Descripción:</Col>
                    <Col md={8}>{incidente.descripcion}</Col>
                  </Row>
                  
                  {incidente.observaciones && (
                    <Row className="mb-3">
                      <Col md={4} className="text-muted">Observaciones:</Col>
                      <Col md={8}>{incidente.observaciones}</Col>
                    </Row>
                  )}
                </Col>
                
                <Col md={6}>
                  <h6 className="text-uppercase text-muted mb-3">Tiempo y Duración</h6>
                  
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Inicio:</Col>
                    <Col md={8}>{formatearFechaHora(incidente.inicio)}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Fin:</Col>
                    <Col md={8}>{formatearFechaHora(incidente.fin)}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4} className="text-muted">Duración:</Col>
                    <Col md={8}>
                      <strong>
                        {formatearMinutosComoHoras(
                          calcularDuracion(incidente.inicio, incidente.fin)
                        )}
                      </strong>
                      <span className="text-muted ms-2">
                        ({calcularDuracion(incidente.inicio, incidente.fin)} minutos)
                      </span>
                    </Col>
                  </Row>
                </Col>
              </Row>
              
              <hr className="my-4" />
              
              <h5 className="mb-3">Códigos Aplicados</h5>
              
              {codigos.length === 0 ? (
                <Alert variant="info">
                  No hay códigos asociados a este incidente.
                </Alert>
              ) : (
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Minutos</th>
                      <th>Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codigos.map((codigo) => (
                      <tr key={codigo.id_codigo}>
                        <td><Badge bg="secondary">{codigo.codigo}</Badge></td>
                        <td>{codigo.descripcion}</td>
                        <td>{codigo.minutos}</td>
                        <td>{formatearMinutosComoHoras(codigo.minutos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card.Body>
          </Tab>
          
          <Tab eventKey="analisis" title="Análisis">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <ResumenCodigos incidente={incidente} codigos={codigos} />
                </Col>
                <Col md={6}>
                  <DistribucionCodigos codigos={codigos} />
                </Col>
              </Row>
            </Card.Body>
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
};

export default DetalleIncidente;