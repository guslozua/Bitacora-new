// src/components/incidentes/EstadoIncidente.tsx
import React, { useState, useEffect } from 'react';
import { 
  Button, Badge, Modal, Form, Alert, Spinner, 
  Row, Col, Card
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import api from '../../services/api';

interface HistorialEstado {
  id: number;
  estado_anterior: string | null;
  estado_nuevo: string;
  fecha_cambio: string;
  observaciones: string | null;
  usuario_cambio_nombre: string;
  usuario_cambio_email: string;
}

interface EstadoIncidenteProps {
  incidenteId: number;
  estadoActual: string;
  onEstadoChanged: (nuevoEstado: string) => void;
  showHistorial?: boolean;
  size?: 'sm' | 'lg'; // Arreglado - removido 'md'
}

const EstadoIncidente: React.FC<EstadoIncidenteProps> = ({
  incidenteId,
  estadoActual,
  onEstadoChanged,
  showHistorial = false,
  size = 'sm' // Cambiado a 'sm' que es válido
}) => {
  const [showModal, setShowModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<HistorialEstado[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuración de estados
  const estadosConfig = {
    registrado: {
      label: 'Registrado',
      color: 'secondary',
      icon: 'bi-pencil-square',
      siguientes: ['revisado', 'aprobado', 'rechazado']
    },
    revisado: {
      label: 'Revisado',
      color: 'info',
      icon: 'bi-eye',
      siguientes: ['aprobado', 'rechazado']
    },
    aprobado: {
      label: 'Aprobado',
      color: 'success',
      icon: 'bi-check-circle',
      siguientes: ['liquidado']
    },
    rechazado: {
      label: 'Rechazado',
      color: 'danger',
      icon: 'bi-x-circle',
      siguientes: ['registrado']
    },
    liquidado: {
      label: 'Liquidado',
      color: 'primary',
      icon: 'bi-cash-coin',
      siguientes: []
    }
  };

  // Cargar historial cuando se abre el modal
  useEffect(() => {
    if (showModal && showHistorial) {
      cargarHistorial();
    }
  }, [showModal, showHistorial]);

  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const response = await api.get(`/incidentes/${incidenteId}/historial`);
      
      if (response.data.success) {
        setHistorial(response.data.data);
      }
    } catch (error: any) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) {
      Swal.fire({
        title: 'Error',
        text: 'Debe seleccionar un estado',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.patch(`/incidentes/${incidenteId}/estado`, {
        estado: nuevoEstado,
        observaciones: observaciones || null
      });

      if (response.data.success) {
        Swal.fire({
          title: '¡Éxito!',
          text: `Estado cambiado a: ${estadosConfig[nuevoEstado as keyof typeof estadosConfig].label}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        onEstadoChanged(nuevoEstado);
        setShowModal(false);
        setNuevoEstado('');
        setObservaciones('');
        
        // Recargar historial si está visible
        if (showHistorial) {
          cargarHistorial();
        }
      }
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      const errorMessage = error.response?.data?.message || 'Error al cambiar estado';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setError(null);
    setNuevoEstado('');
    setObservaciones('');
  };

  const estadoInfo = estadosConfig[estadoActual as keyof typeof estadosConfig];
  const estadosSiguientes = estadoInfo?.siguientes || [];

  return (
    <>
      <div className="d-flex align-items-center gap-2">
        <Badge 
          bg={estadoInfo?.color || 'secondary'} 
          className="d-flex align-items-center gap-1"
        >
          <i className={estadoInfo?.icon || 'bi-question-circle'}></i>
          {estadoInfo?.label || estadoActual}
        </Badge>
        
        {estadosSiguientes.length > 0 && (
          <Button
            variant="outline-primary"
            size={size}
            onClick={handleOpenModal}
            className="d-flex align-items-center gap-1"
          >
            <i className="bi-arrow-right-circle"></i>
            Cambiar Estado
          </Button>
        )}
        
        {showHistorial && (
          <Button
            variant="outline-info"
            size={size}
            onClick={() => setShowModal(true)}
            className="d-flex align-items-center gap-1"
          >
            <i className="bi-clock-history"></i>
            Historial
          </Button>
        )}
      </div>

      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi-arrow-repeat me-2"></i>
            Gestión de Estado del Incidente
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Row>
            <Col md={showHistorial ? 6 : 12}>
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi-gear me-2"></i>
                    Cambiar Estado
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Estado Actual:</strong>
                    <Badge 
                      bg={estadoInfo?.color || 'secondary'} 
                      className="ms-2 d-inline-flex align-items-center gap-1"
                    >
                      <i className={estadoInfo?.icon || 'bi-question-circle'}></i>
                      {estadoInfo?.label || estadoActual}
                    </Badge>
                  </div>

                  {estadosSiguientes.length > 0 ? (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Nuevo Estado *</Form.Label>
                        <Form.Select
                          value={nuevoEstado}
                          onChange={(e) => setNuevoEstado(e.target.value)}
                        >
                          <option value="">Seleccionar nuevo estado...</option>
                          {estadosSiguientes.map((estado) => {
                            const config = estadosConfig[estado as keyof typeof estadosConfig];
                            return (
                              <option key={estado} value={estado}>
                                {config.label}
                              </option>
                            );
                          })}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Observaciones</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Comentarios sobre el cambio de estado (opcional)"
                        />
                      </Form.Group>
                    </>
                  ) : (
                    <Alert variant="info">
                      <i className="bi-info-circle me-2"></i>
                      Este incidente ha alcanzado su estado final. No hay cambios de estado disponibles.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {showHistorial && (
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">
                      <i className="bi-clock-history me-2"></i>
                      Historial de Estados
                    </h6>
                  </Card.Header>
                  <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loadingHistorial ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Cargando historial...
                      </div>
                    ) : historial.length === 0 ? (
                      <Alert variant="info" className="mb-0">
                        No hay historial de cambios disponible.
                      </Alert>
                    ) : (
                      <div className="timeline">
                        {historial.map((item, index) => {
                          const estadoConfig = estadosConfig[item.estado_nuevo as keyof typeof estadosConfig];
                          return (
                            <div key={item.id} className="timeline-item mb-3">
                              <div className="d-flex align-items-start gap-3">
                                <div className="flex-shrink-0">
                                  <Badge 
                                    bg={estadoConfig?.color || 'secondary'}
                                    className="d-flex align-items-center gap-1"
                                  >
                                    <i className={estadoConfig?.icon || 'bi-question-circle'}></i>
                                  </Badge>
                                </div>
                                <div className="flex-grow-1">
                                  <div className="fw-bold">
                                    {item.estado_anterior ? (
                                      <>
                                        {estadosConfig[item.estado_anterior as keyof typeof estadosConfig]?.label || item.estado_anterior}
                                        <i className="bi-arrow-right mx-2"></i>
                                        {estadoConfig?.label || item.estado_nuevo}
                                      </>
                                    ) : (
                                      <>Estado inicial: {estadoConfig?.label || item.estado_nuevo}</>
                                    )}
                                  </div>
                                  <small className="text-muted">
                                    {format(new Date(item.fecha_cambio), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    <br />
                                    Por: {item.usuario_cambio_nombre}
                                  </small>
                                  {item.observaciones && (
                                    <div className="mt-1">
                                      <small className="text-secondary">
                                        <i className="bi-chat-quote me-1"></i>
                                        {item.observaciones}
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {index < historial.length - 1 && (
                                <hr className="my-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          {estadosSiguientes.length > 0 && (
            <Button 
              variant="primary" 
              onClick={handleCambiarEstado}
              disabled={loading || !nuevoEstado}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Cambiando...
                </>
              ) : (
                <>
                  <i className="bi-check2 me-2"></i>
                  Confirmar Cambio
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EstadoIncidente;