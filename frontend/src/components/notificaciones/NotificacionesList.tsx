// src/components/notificaciones/NotificacionesList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, Form, 
  ListGroup, Alert, Spinner, Pagination, ButtonGroup 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import NotificacionService, { Notificacion } from '../../services/NotificacionService';
import Sidebar from '../Sidebar';
import Footer from '../Footer';

interface NotificacionesListProps {
  userId: number;
}

const NotificacionesList: React.FC<NotificacionesListProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
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

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">
              <i className="bi bi-bell me-2"></i>
              Notificaciones
            </h2>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                className="shadow-sm"
                onClick={() => cargarNotificaciones()}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Actualizar
              </Button>
              {estadisticas.no_leidas > 0 && (
                <Button
                  variant="primary"
                  className="shadow-sm"
                  onClick={marcarTodasComoLeidas}
                >
                  <i className="bi bi-check-all me-1"></i>
                  Marcar todas como leídas ({estadisticas.no_leidas})
                </Button>
              )}
            </div>
          </div>

          {/* KPIs - Estilo Dashboard */}
          <Row className="g-4 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Total Notificaciones</h6>
                      <h2 className="fw-bold mb-0">{formatNumber(estadisticas.total)}</h2>
                    </div>
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className="bi bi-bell fs-3 text-dark" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">No Leídas</h6>
                      <h2 className="fw-bold mb-0 text-warning">{formatNumber(estadisticas.no_leidas)}</h2>
                    </div>
                    <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className="bi bi-bell-fill fs-3 text-warning" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Leídas</h6>
                      <h2 className="fw-bold mb-0 text-success">{formatNumber(estadisticas.total - estadisticas.no_leidas)}</h2>
                    </div>
                    <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className="bi bi-check-circle fs-3 text-success" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Tipos Únicos</h6>
                      <h2 className="fw-bold mb-0 text-info">{Object.keys(estadisticas.por_tipo || {}).length}</h2>
                    </div>
                    <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className="bi bi-collection fs-3 text-info" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Estadísticas por tipo */}
          <Row className="g-4 mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Distribución por Tipo</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {Object.entries(estadisticas.por_tipo || {}).map(([tipo, cantidad], idx) => (
                      <Badge 
                        key={tipo} 
                        className="fs-6 px-3 py-2"
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#3498db' : '#2ecc71',
                          fontSize: '0.875rem'
                        }}
                      >
                        {getTipoLabel(tipo)}: {cantidad}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filtros */}
          <Row className="g-4 mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-funnel me-2"></i>
                    Filtros
                  </h5>
                  <Row>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Tipo</Form.Label>
                        <Form.Select
                          className="shadow-sm"
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
                        <Form.Label className="fw-semibold">Estado</Form.Label>
                        <Form.Select
                          className="shadow-sm"
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
                        <Form.Label className="fw-semibold">Buscar</Form.Label>
                        <Form.Control
                          type="text"
                          className="shadow-sm"
                          placeholder="Buscar en título o mensaje..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                      <Button
                        variant="outline-secondary"
                        className="w-100 shadow-sm"
                        onClick={limpiarFiltros}
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
          <Row className="g-4 mb-4">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-list-ul me-2"></i>
                      Lista de Notificaciones ({formatNumber(totalRegistros)})
                    </h5>
                    <small className="text-muted fw-medium">
                      Página {paginaActual} de {totalPaginas}
                    </small>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <div className="mt-2 text-muted">Cargando notificaciones...</div>
                    </div>
                  ) : error ? (
                    <Alert variant="danger" className="m-3 border-0 shadow-sm">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </Alert>
                  ) : notificaciones.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-bell-slash fs-1 mb-3 d-block"></i>
                      <h5>No se encontraron notificaciones</h5>
                      <p>Intenta ajustar los filtros o buscar con otros términos.</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {notificaciones.map((notificacion) => (
                        <div key={notificacion.id} className="col-12">
                          <Card 
                            className={`border-0 shadow-sm ${!notificacion.leida ? 'border-start border-primary border-4' : ''}`}
                            style={{ 
                              borderLeftWidth: !notificacion.leida ? '4px' : undefined,
                              borderLeftColor: !notificacion.leida ? '#0d6efd' : undefined
                            }}
                          >
                            <Card.Body className="p-4">
                              <div className="d-flex align-items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '3rem', height: '3rem' }}>
                                    <i className={`${getIconoTipo(notificacion.tipo)} fs-4`}></i>
                                  </div>
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
                                      <div className="d-flex align-items-center gap-2 mb-2">
                                        <Badge 
                                          bg="secondary" 
                                          className="text-white"
                                          style={{ fontSize: '0.75rem' }}
                                        >
                                          {getTipoLabel(notificacion.tipo)}
                                        </Badge>
                                        <small className="text-muted">
                                          <i className="bi bi-clock me-1"></i>
                                          {format(new Date(notificacion.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </small>
                                      </div>
                                    </div>
                                    <ButtonGroup size="sm">
                                      {!notificacion.leida && (
                                        <Button
                                          variant="outline-primary"
                                          className="shadow-sm"
                                          onClick={() => marcarComoLeida(notificacion.id)}
                                          title="Marcar como leída"
                                        >
                                          <i className="bi bi-check"></i>
                                        </Button>
                                      )}
                                    </ButtonGroup>
                                  </div>
                                  <p className="mb-2 text-secondary lh-sm">
                                    {notificacion.mensaje}
                                  </p>
                                  {(notificacion.referencia_id || notificacion.referencia_tipo) && (
                                    <div className="mt-2">
                                      <small className="text-muted">
                                        {notificacion.referencia_id && notificacion.referencia_tipo === 'incidente' && (
                                          <Badge bg="info" className="me-2 text-white">
                                            <i className="bi bi-file-text me-1"></i>
                                            Incidente #{notificacion.referencia_id}
                                          </Badge>
                                        )}
                                        {notificacion.referencia_id && notificacion.referencia_tipo === 'guardia' && (
                                          <Badge bg="info" className="me-2 text-white">
                                            <i className="bi bi-shield me-1"></i>
                                            Guardia #{notificacion.referencia_id}
                                          </Badge>
                                        )}
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
                
                {/* Paginación */}
                {totalPaginas > 1 && (
                  <Card.Footer className="bg-white border-0 py-3">
                    <div className="d-flex justify-content-center">
                      <Pagination className="mb-0">
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

        <Footer />
      </div>
    </div>
  );
};

export default NotificacionesList;