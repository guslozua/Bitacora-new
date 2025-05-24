// src/components/notificaciones/NotificacionesList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, Form, 
  ListGroup, Alert, Spinner, Pagination, ButtonGroup 
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import NotificacionService, { Notificacion } from '../../services/NotificacionService';

interface NotificacionesListProps {
  userId: number;
}

const NotificacionesList: React.FC<NotificacionesListProps> = ({ userId }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroLeida, setFiltroLeida] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const registrosPorPagina = 20;

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    no_leidas: 0,
    por_tipo: {} as Record<string, number>
  });

  useEffect(() => {
    cargarNotificaciones();
    cargarEstadisticas();
  }, [paginaActual, filtroTipo, filtroLeida, busqueda]);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar tu servicio existente - filtrar por tipo si está seleccionado
      const soloNoLeidas = filtroLeida === 'false' ? true : false;
      let notificacionesData = await NotificacionService.obtenerNotificaciones(userId, soloNoLeidas);
      
      // Filtrar por tipo si está seleccionado
      if (filtroTipo) {
        notificacionesData = notificacionesData.filter(n => n.tipo === filtroTipo);
      }
      
      // Filtrar por búsqueda si está presente
      if (busqueda) {
        notificacionesData = notificacionesData.filter(n => 
          n.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
          n.mensaje.toLowerCase().includes(busqueda.toLowerCase())
        );
      }
      
      // Paginación manual
      setTotalRegistros(notificacionesData.length);
      setTotalPaginas(Math.ceil(notificacionesData.length / registrosPorPagina));
      
      const inicio = (paginaActual - 1) * registrosPorPagina;
      const fin = inicio + registrosPorPagina;
      setNotificaciones(notificacionesData.slice(inicio, fin));
      
    } catch (error: any) {
      console.error('Error al cargar notificaciones:', error);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const todasNotificaciones = await NotificacionService.obtenerNotificaciones(userId, false);
      const noLeidas = await NotificacionService.obtenerContadorNoLeidas(userId);
      
      // Calcular estadísticas por tipo
      const porTipo: Record<string, number> = {};
      todasNotificaciones.forEach(n => {
        porTipo[n.tipo] = (porTipo[n.tipo] || 0) + 1;
      });
      
      setEstadisticas({
        total: todasNotificaciones.length,
        no_leidas: noLeidas,
        por_tipo: porTipo
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const marcarComoLeida = async (id: number) => {
    try {
      await NotificacionService.marcarComoLeida(id);
      cargarNotificaciones();
      cargarEstadisticas();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await NotificacionService.marcarTodasComoLeidas(userId);
      cargarNotificaciones();
      cargarEstadisticas();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroLeida('');
    setBusqueda('');
    setPaginaActual(1);
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_incidente':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'cambio_estado':
        return 'bi-arrow-repeat text-info';
      case 'incidente_liquidado':
        return 'bi-cash-coin text-success';
      case 'incidente_rechazado':
        return 'bi-x-circle-fill text-danger';
      case 'recordatorio':
        return 'bi-clock-fill text-secondary';
      default:
        return 'bi-bell-fill text-primary';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'nuevo_incidente': return 'Nuevo Incidente';
      case 'cambio_estado': return 'Cambio de Estado';
      case 'incidente_liquidado': return 'Liquidado';
      case 'incidente_rechazado': return 'Rechazado';
      case 'recordatorio': return 'Recordatorio';
      default: return tipo;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="bi bi-bell me-2"></i>
              Notificaciones
            </h2>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={() => cargarNotificaciones()}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Actualizar
              </Button>
              {estadisticas.no_leidas > 0 && (
                <Button
                  variant="primary"
                  onClick={marcarTodasComoLeidas}
                >
                  <i className="bi bi-check-all me-1"></i>
                  Marcar todas como leídas ({estadisticas.no_leidas})
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Estadísticas rápidas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-primary">{estadisticas.total}</h4>
              <small className="text-muted">Total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="text-warning">{estadisticas.no_leidas}</h4>
              <small className="text-muted">No leídas</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <h6>Por tipo:</h6>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(estadisticas.por_tipo || {}).map(([tipo, cantidad]) => (
                  <Badge key={tipo} bg="secondary">
                    {getTipoLabel(tipo)}: {cantidad}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Tipo</Form.Label>
                    <Form.Select
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                      <option value="">Todos los tipos</option>
                      <option value="nuevo_incidente">Nuevo Incidente</option>
                      <option value="cambio_estado">Cambio de Estado</option>
                      <option value="incidente_liquidado">Liquidado</option>
                      <option value="incidente_rechazado">Rechazado</option>
                      <option value="recordatorio">Recordatorio</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      value={filtroLeida}
                      onChange={(e) => setFiltroLeida(e.target.value)}
                    >
                      <option value="">Todas</option>
                      <option value="false">No leídas</option>
                      <option value="true">Leídas</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Buscar</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Buscar en título o mensaje..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={limpiarFiltros}
                    className="w-100"
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Limpiar
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lista de notificaciones */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Notificaciones ({totalRegistros})
              </h5>
              <small className="text-muted">
                Página {paginaActual} de {totalPaginas}
              </small>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <div className="mt-2">Cargando notificaciones...</div>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3">
                  {error}
                </Alert>
              ) : notificaciones.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-bell-slash fs-1"></i>
                  <div className="mt-2">No se encontraron notificaciones</div>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {notificaciones.map((notificacion) => (
                    <ListGroup.Item
                      key={notificacion.id}
                      className={`${!notificacion.leida ? 'bg-light border-start border-primary border-3' : ''}`}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <i className={`${getIconoTipo(notificacion.tipo)} fs-4`}></i>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 fw-bold">
                                {notificacion.titulo}
                                {!notificacion.leida && (
                                  <Badge bg="primary" className="ms-2">
                                    Nueva
                                  </Badge>
                                )}
                              </h6>
                              <small className="text-muted">
                                <Badge bg="secondary" className="me-2">
                                  {getTipoLabel(notificacion.tipo)}
                                </Badge>
                                {format(new Date(notificacion.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </small>
                            </div>
                            <ButtonGroup size="sm">
                              {!notificacion.leida && (
                                <Button
                                  variant="outline-primary"
                                  onClick={() => marcarComoLeida(notificacion.id)}
                                  title="Marcar como leída"
                                >
                                  <i className="bi bi-check"></i>
                                </Button>
                              )}
                            </ButtonGroup>
                          </div>
                          <p className="mb-2 text-secondary">
                            {notificacion.mensaje}
                          </p>
                          {(notificacion.referencia_id || notificacion.referencia_tipo) && (
                            <div className="mt-2">
                              <small className="text-muted">
                                {notificacion.referencia_id && notificacion.referencia_tipo === 'incidente' && (
                                  <span className="me-3">
                                    <i className="bi bi-file-text me-1"></i>
                                    Incidente #{notificacion.referencia_id}
                                  </span>
                                )}
                                {notificacion.referencia_id && notificacion.referencia_tipo === 'guardia' && (
                                  <span className="me-3">
                                    <i className="bi bi-shield me-1"></i>
                                    Guardia #{notificacion.referencia_id}
                                  </span>
                                )}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
            
            {/* Paginación */}
            {totalPaginas > 1 && (
              <Card.Footer>
                <div className="d-flex justify-content-center">
                  <Pagination>
                    <Pagination.First 
                      onClick={() => setPaginaActual(1)}
                      disabled={paginaActual === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => setPaginaActual(paginaActual - 1)}
                      disabled={paginaActual === 1}
                    />
                    
                    {/* Páginas visibles */}
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pagina: number;
                      if (totalPaginas <= 5) {
                        pagina = i + 1;
                      } else if (paginaActual <= 3) {
                        pagina = i + 1;
                      } else if (paginaActual >= totalPaginas - 2) {
                        pagina = totalPaginas - 4 + i;
                      } else {
                        pagina = paginaActual - 2 + i;
                      }
                      
                      return (
                        <Pagination.Item
                          key={pagina}
                          active={pagina === paginaActual}
                          onClick={() => setPaginaActual(pagina)}
                        >
                          {pagina}
                        </Pagination.Item>
                      );
                    })}
                    
                    <Pagination.Next 
                      onClick={() => setPaginaActual(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                    />
                    <Pagination.Last 
                      onClick={() => setPaginaActual(totalPaginas)}
                      disabled={paginaActual === totalPaginas}
                    />
                  </Pagination>
                </div>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotificacionesList;