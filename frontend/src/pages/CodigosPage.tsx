// src/pages/CodigosPage.tsx - VERSIÓN CON FOOTER CORREGIDO
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert, Nav, Tab, Badge, Form, Table, Modal, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import CodigosList from '../components/Codigos/CodigosList';
import CodigoModal from '../components/Codigos/CodigoModal';
import CodigoFilters from '../components/Codigos/CodigoFilters';
import CodigoService, { Codigo } from '../services/CodigoService';
import TarifaService, {
  Tarifa,
  TarifaCreacion,
  ResultadoSimulacion,
  ParametrosSimulacion,
  CodigoAplicable,
  getColorTipoCodigo,
  prepararParametrosSimulacionSegura
} from '../services/TarifaService';

interface ResultadoCalculo {
  tarifa_utilizada: Tarifa;
  fecha_calculo: string;
  desglose: {
    guardia_pasiva: number;
    guardia_activa: number;
    adicional_nocturno: number;
    total: number;
  };
  detalle: Array<{
    tipo: string;
    codigo?: string;
    descripcion?: string;
    horas?: number;
    tarifa_hora?: number;
    valor_fijo?: number;
    importe: number;
    observaciones: string;
  }>;
}

const CodigosPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados existentes para códigos
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState<Codigo | null>(null);
  const [filters, setFilters] = useState({
    tipo: '',
    estado: 'activo',
    search: '',
    incluirInactivos: false,
    modalidad_convenio: ''
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Estados para tarifas
  const [activeTab, setActiveTab] = useState<string>('codigos');
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [tarifaActual, setTarifaActual] = useState<Tarifa | null>(null);
  const [loadingTarifas, setLoadingTarifas] = useState(false);
  const [showTarifaModal, setShowTarifaModal] = useState(false);
  const [selectedTarifa, setSelectedTarifa] = useState<Tarifa | null>(null);

  // Estados para simulador
  const [simulacion, setSimulacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '20:00',
    hora_fin: '08:00',
    tipo_guardia: 'activa' as 'pasiva' | 'activa',
    modalidad_convenio: 'FC' as 'FC' | 'DC'
  });
  const [resultadoSimulacion, setResultadoSimulacion] = useState<ResultadoCalculo | null>(null);
  const [loadingSimulacion, setLoadingSimulacion] = useState(false);
  const [codigosAplicables, setCodigosAplicables] = useState<CodigoAplicable[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (activeTab === 'codigos') {
      loadCodigos();
    } else if (activeTab === 'tarifas') {
      cargarTarifas();
    }
  }, [filters, activeTab]);

  // Función para cargar códigos
  const loadCodigos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        tipo: filters.tipo || undefined,
        estado: filters.estado || undefined,
        search: filters.search || undefined,
        incluir_inactivos: filters.incluirInactivos ? 'true' : undefined,
        modalidad_convenio: filters.modalidad_convenio || undefined
      };

      console.log('🔍 Filtros enviados al backend:', params);

      const codigosData = await CodigoService.fetchCodigos(params);
      setCodigos(codigosData);
    } catch (error) {
      console.error('Error al cargar códigos:', error);
      setError('No se pudieron cargar los códigos de facturación');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar tarifas
  const cargarTarifas = async () => {
    setLoadingTarifas(true);
    try {
      console.log('🔄 Cargando tarifas desde el backend...');

      const tarifasData = await TarifaService.fetchTarifas({
        incluir_inactivas: true
      });

      console.log('✅ Tarifas cargadas:', tarifasData.length);
      setTarifas(tarifasData);

      // Buscar tarifa vigente
      const tarifaVigente = tarifasData.find(t => t.estado === 'activo') || null;
      setTarifaActual(tarifaVigente);

      if (tarifaVigente) {
        console.log('✅ Tarifa vigente encontrada:', tarifaVigente.nombre);
      } else {
        console.log('⚠️ No hay tarifa vigente activa');
      }

    } catch (err: any) {
      console.error('❌ Error al cargar tarifas:', err);
      setError(`Error al cargar tarifas: ${err.message || err}`);
    } finally {
      setLoadingTarifas(false);
    }
  };

  // Simular cálculo
  const simularCalculo = async () => {
    if (!tarifaActual || !tarifaActual.id) {
      setError('No hay tarifa seleccionada para simular');
      return;
    }

    setLoadingSimulacion(true);
    try {
      console.log('🧮 Iniciando simulación con códigos, fechas y MODALIDAD:', {
        modalidad_convenio: simulacion.modalidad_convenio
      });

      const parametros = prepararParametrosSimulacionSegura(
        simulacion.fecha,
        simulacion.hora_inicio,
        simulacion.hora_fin,
        simulacion.tipo_guardia,
        tarifaActual.id,
        simulacion.modalidad_convenio
      );

      console.log('📝 Parámetros de simulación con modalidad:', parametros);

      const resultadoReal = await TarifaService.simularCalculo(parametros);

      console.log('✅ Simulación completada con códigos y modalidad:', resultadoReal);

      // Adaptar resultado del backend
      const resultadoAdaptado: ResultadoCalculo = {
        tarifa_utilizada: {
          id: resultadoReal.tarifa_utilizada.id,
          nombre: resultadoReal.tarifa_utilizada.nombre,
          valor_guardia_pasiva: resultadoReal.tarifa_utilizada.valores.guardia_pasiva,
          valor_hora_activa: resultadoReal.tarifa_utilizada.valores.hora_activa,
          valor_adicional_nocturno_habil: resultadoReal.tarifa_utilizada.valores.nocturno_habil,
          valor_adicional_nocturno_no_habil: resultadoReal.tarifa_utilizada.valores.nocturno_no_habil,
          vigencia_desde: resultadoReal.tarifa_utilizada.vigor_desde,
          estado: 'activo' as const
        },
        fecha_calculo: new Date().toISOString(),
        desglose: resultadoReal.calculos,
        detalle: resultadoReal.detalle.map(item => ({
          tipo: item.concepto,
          codigo: undefined,
          descripcion: item.descripcion,
          horas: undefined,
          tarifa_hora: undefined,
          valor_fijo: undefined,
          importe: item.importe,
          observaciones: item.calculo
        }))
      };

      setResultadoSimulacion(resultadoAdaptado);
      setCodigosAplicables(resultadoReal.codigos_aplicables || []);

    } catch (err: any) {
      console.error('❌ Error en simulación:', err);
      setError(`Error en la simulación: ${err.message || err}`);
    } finally {
      setLoadingSimulacion(false);
    }
  };

  // Funciones para códigos
  const handleNewCodigo = () => {
    setSelectedCodigo(null);
    setShowModal(true);
  };

  const handleEditCodigo = (codigo: Codigo) => {
    setSelectedCodigo(codigo);
    setShowModal(true);
  };

  const handleDeactivateCodigo = async (codigo: Codigo) => {
    try {
      await CodigoService.deactivateCodigo(codigo.id!);
      loadCodigos();
    } catch (error) {
      console.error('Error al desactivar código:', error);
      setError('No se pudo desactivar el código');
    }
  };

  const handleDeleteCodigo = async (codigo: Codigo) => {
    try {
      await CodigoService.deleteCodigo(codigo.id!);
      loadCodigos();
    } catch (error) {
      console.error('Error al eliminar código:', error);
      setError('No se pudo eliminar el código');
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleModalClose = (reloadData: boolean = false) => {
    setShowModal(false);
    if (reloadData) {
      loadCodigos();
    }
  };

  // Funciones para tarifas
  const abrirModalTarifa = (tarifa?: Tarifa) => {
    setSelectedTarifa(tarifa || null);
    setShowTarifaModal(true);
  };

  const cerrarModalTarifa = () => {
    setShowTarifaModal(false);
    setSelectedTarifa(null);
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    minHeight: '100vh', // ✨ AGREGAR ALTURA MÍNIMA
    display: 'flex',    // ✨ USAR FLEXBOX
    flexDirection: 'column' as const // ✨ DIRECCIÓN COLUMNA
  };

  return (
    <div className="d-flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggle={toggleSidebar}
        onLogout={() => navigate('/login')}
      />

      <div style={contentStyle}>
        {/* ✨ CONTENIDO PRINCIPAL CON FLEX-GROW */}
        <div className="flex-grow-1">
          <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-0 fw-bold">Administración de Facturación</h2>
                <p className="text-muted mb-0">Gestione códigos de facturación y tarifas del sistema</p>
              </div>
              <div className="d-flex gap-2">
                {activeTab === 'tarifas' && tarifaActual && (
                  <Badge bg="success" className="fs-6 px-3 py-2">
                    <i className="bi bi-check-circle me-1"></i>
                    Tarifa Vigente: {tarifaActual.nombre}
                  </Badge>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
              <Row>
                <Col md={12}>
                  <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                      <Nav.Link eventKey="codigos">
                        <i className="bi bi-code-square me-2"></i>
                        Códigos de Facturación
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="tarifas">
                        <i className="bi bi-cash-coin me-2"></i>
                        Tarifas y Valores
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="simulador">
                        <i className="bi bi-calculator me-2"></i>
                        Simulador de Cálculos
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Tab.Content>
                    {/* Tab: Códigos de Facturación */}
                    <Tab.Pane eventKey="codigos">
                      <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                          <Row className="align-items-center mb-4">
                            <Col>
                              <h5 className="mb-0">Códigos de Facturación</h5>
                              <p className="text-muted mb-0">Gestione los códigos utilizados para facturar las guardias e incidentes</p>
                            </Col>
                            <Col xs="auto">
                              <Button variant="primary" onClick={handleNewCodigo}>
                                <i className="bi bi-plus-circle me-2"></i>
                                Nuevo Código
                              </Button>
                            </Col>
                          </Row>

                          <CodigoFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                          />

                          {loading ? (
                            <div className="text-center py-5">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-3 text-muted">Cargando códigos...</p>
                            </div>
                          ) : (
                            <CodigosList
                              codigos={codigos}
                              onEdit={handleEditCodigo}
                              onDeactivate={handleDeactivateCodigo}
                              onDelete={handleDeleteCodigo}
                            />
                          )}
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Tab: Tarifas y Valores */}
                    <Tab.Pane eventKey="tarifas">
                      <Card className="shadow-sm border-0 mb-4"> {/* ✨ AGREGAR MARGIN-BOTTOM */}
                        <Card.Header className="bg-primary text-white">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                              <i className="bi bi-cash-coin me-2"></i>
                              Tarifas Configuradas
                            </h5>
                            <Button
                              variant="outline-light"
                              size="sm"
                              onClick={() => abrirModalTarifa()}
                            >
                              <i className="bi bi-plus-circle me-1"></i>
                              Nueva Tarifa
                            </Button>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {loadingTarifas ? (
                            <div className="text-center py-5">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-3 text-muted">Cargando tarifas...</p>
                            </div>
                          ) : (
                            <Table responsive hover>
                              <thead>
                                <tr className="table-light">
                                  <th>Nombre</th>
                                  <th>Guardia Pasiva</th>
                                  <th>Hora Activa</th>
                                  <th>Nocturno Hábil</th>
                                  <th>Nocturno No Hábil</th>
                                  <th>Vigencia</th>
                                  <th>Estado</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tarifas.map(tarifa => (
                                  <tr key={tarifa.id} className={tarifa.estado === 'activo' ? 'table-success' : ''}>
                                    <td>
                                      <strong>{tarifa.nombre}</strong>
                                      {tarifa.estado === 'activo' && (
                                        <Badge bg="success" className="ms-2">Vigente</Badge>
                                      )}
                                    </td>
                                    <td>{formatearMoneda(tarifa.valor_guardia_pasiva)}</td>
                                    <td>{formatearMoneda(tarifa.valor_hora_activa)}</td>
                                    <td>{formatearMoneda(tarifa.valor_adicional_nocturno_habil)}</td>
                                    <td>{formatearMoneda(tarifa.valor_adicional_nocturno_no_habil)}</td>
                                    <td>
                                      <small>
                                        Desde: {new Date(tarifa.vigencia_desde).toLocaleDateString()}
                                        {tarifa.vigencia_hasta && (
                                          <><br />Hasta: {new Date(tarifa.vigencia_hasta).toLocaleDateString()}</>
                                        )}
                                      </small>
                                    </td>
                                    <td>
                                      <Badge bg={tarifa.estado === 'activo' ? 'success' : 'secondary'}>
                                        {tarifa.estado}
                                      </Badge>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-1">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => abrirModalTarifa(tarifa)}
                                          title="Editar tarifa"
                                        >
                                          <i className="bi bi-pencil"></i>
                                        </Button>
                                        <Button
                                          variant="outline-success"
                                          size="sm"
                                          onClick={() => {
                                            setTarifaActual(tarifa);
                                            setActiveTab('simulador');
                                          }}
                                          title="Usar para simulación"
                                        >
                                          <i className="bi bi-calculator"></i>
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    {/* Tab: Simulador */}
                    <Tab.Pane eventKey="simulador">
                      <Row>
                        <Col md={6}>
                          <Card className="shadow-sm border-0 mb-4">
                            <Card.Header className="bg-info text-white">
                              <h5 className="mb-0">
                                <i className="bi bi-calculator me-2"></i>
                                Simulador de Cálculos
                              </h5>
                            </Card.Header>
                            <Card.Body>
                              {!tarifaActual ? (
                                <Alert variant="warning">
                                  <i className="bi bi-exclamation-triangle me-2"></i>
                                  Debe seleccionar una tarifa vigente antes de simular cálculos.
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="ms-2"
                                    onClick={() => setActiveTab('tarifas')}
                                  >
                                    Ir a Tarifas
                                  </Button>
                                </Alert>
                              ) : (
                                <>
                                  <div className="mb-3 p-2 bg-light rounded">
                                    <small className="text-muted">Tarifa seleccionada:</small>
                                    <div className="fw-bold">{tarifaActual.nombre}</div>
                                  </div>

                                  <Form>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Fecha del Incidente</Form.Label>
                                      <Form.Control
                                        type="date"
                                        value={simulacion.fecha}
                                        onChange={(e) => setSimulacion({ ...simulacion, fecha: e.target.value })}
                                      />
                                    </Form.Group>

                                    <Row className="mb-3">
                                      <Col md={6}>
                                        <Form.Group>
                                          <Form.Label>Hora de Inicio</Form.Label>
                                          <Form.Control
                                            type="time"
                                            value={simulacion.hora_inicio}
                                            onChange={(e) => setSimulacion({ ...simulacion, hora_inicio: e.target.value })}
                                          />
                                        </Form.Group>
                                      </Col>
                                      <Col md={6}>
                                        <Form.Group>
                                          <Form.Label>Hora de Fin</Form.Label>
                                          <Form.Control
                                            type="time"
                                            value={simulacion.hora_fin}
                                            onChange={(e) => setSimulacion({ ...simulacion, hora_fin: e.target.value })}
                                          />
                                        </Form.Group>
                                      </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                      <Form.Label>Tipo de Guardia</Form.Label>
                                      <Form.Select
                                        value={simulacion.tipo_guardia}
                                        onChange={(e) => setSimulacion({ ...simulacion, tipo_guardia: e.target.value as 'pasiva' | 'activa' })}
                                      >
                                        <option value="pasiva">Guardia Pasiva</option>
                                        <option value="activa">Guardia Activa</option>
                                      </Form.Select>
                                      <Form.Text className="text-muted">
                                        Las guardias pasivas se cobran por día completo, las activas por hora trabajada.
                                      </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                      <Form.Label>Modalidad de Convenio</Form.Label>
                                      <Form.Select
                                        value={simulacion.modalidad_convenio}
                                        onChange={(e) => setSimulacion({ ...simulacion, modalidad_convenio: e.target.value as 'FC' | 'DC' })}
                                      >
                                        <option value="FC">Fuera de Convenio (FC)</option>
                                        <option value="DC">Dentro de Convenio (DC)</option>
                                      </Form.Select>
                                      <Form.Text className="text-muted">
                                        Seleccione la modalidad contractual para ver códigos y factores correspondientes.
                                      </Form.Text>
                                    </Form.Group>

                                    <div className="d-grid">
                                      <Button
                                        variant="primary"
                                        onClick={simularCalculo}
                                        disabled={loadingSimulacion}
                                      >
                                        {loadingSimulacion ? (
                                          <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Calculando...
                                          </>
                                        ) : (
                                          <>
                                            <i className="bi bi-play-circle me-2"></i>
                                            Simular Cálculo
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </Form>
                                </>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col md={6}>
                          {resultadoSimulacion ? (
                            <>
                              {/* Card: Resultado de la Simulación */}
                              <Card className="shadow-sm border-0 mb-3">
                                <Card.Header className="bg-success text-white">
                                  <h5 className="mb-0">
                                    <i className="bi bi-check-circle me-2"></i>
                                    Resultado de la Simulación
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  <div className="mb-4">
                                    <h6 className="text-muted">Tarifa Utilizada:</h6>
                                    <p className="fw-bold">{resultadoSimulacion.tarifa_utilizada.nombre}</p>
                                  </div>

                                  <div className="mb-4">
                                    <h6 className="text-muted">Desglose de Importes:</h6>
                                    <Table className="table-sm">
                                      <tbody>
                                        <tr>
                                          <td>Guardia Pasiva:</td>
                                          <td className="text-end">{formatearMoneda(resultadoSimulacion.desglose.guardia_pasiva)}</td>
                                        </tr>
                                        <tr>
                                          <td>Guardia Activa:</td>
                                          <td className="text-end">{formatearMoneda(resultadoSimulacion.desglose.guardia_activa)}</td>
                                        </tr>
                                        <tr>
                                          <td>Adicional Nocturno:</td>
                                          <td className="text-end">{formatearMoneda(resultadoSimulacion.desglose.adicional_nocturno)}</td>
                                        </tr>
                                        <tr className="table-primary fw-bold">
                                          <td>TOTAL:</td>
                                          <td className="text-end">{formatearMoneda(resultadoSimulacion.desglose.total)}</td>
                                        </tr>
                                      </tbody>
                                    </Table>
                                  </div>

                                  <div>
                                    <h6 className="text-muted">Detalle de Cálculo:</h6>
                                    {resultadoSimulacion.detalle.map((item, index) => (
                                      <div key={index} className="border rounded p-2 mb-2 bg-light">
                                        <div className="d-flex justify-content-between align-items-center">
                                          <div>
                                            <strong>{item.tipo}</strong>
                                            {item.codigo && <Badge bg="secondary" className="ms-2">{item.codigo}</Badge>}
                                          </div>
                                          <span className="fw-bold text-primary">{formatearMoneda(item.importe)}</span>
                                        </div>
                                        <small className="text-muted">{item.observaciones}</small>
                                      </div>
                                    ))}
                                  </div>
                                </Card.Body>
                              </Card>

                              {/* Códigos Aplicables */}
                              {codigosAplicables.length > 0 && (
                                <Card className="shadow-sm border-0 mb-4"> {/* ✨ AGREGAR MARGIN-BOTTOM */}
                                  <Card.Header className="bg-primary text-white">
                                    <h6 className="mb-0">
                                      <i className="bi bi-tags me-2"></i>
                                      Códigos Aplicables ({codigosAplicables.length})
                                    </h6>
                                  </Card.Header>
                                  <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {codigosAplicables.map((codigo, index) => (
                                      <div key={`${codigo.id}-${index}`} className="border rounded p-2 mb-2 bg-light">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                          <div>
                                            <Badge bg={getColorTipoCodigo(codigo.tipo)} className="me-2">
                                              {codigo.tipo.toUpperCase()}
                                            </Badge>
                                            <strong>{codigo.codigo}</strong>
                                          </div>
                                          <Badge bg="info" className="ms-2">
                                            Factor: x{codigo.factor_multiplicador}
                                          </Badge>
                                        </div>

                                        <div className="mt-1">
                                          <small className="text-dark fw-bold">{codigo.descripcion}</small>
                                        </div>

                                        <div className="mt-1">
                                          <small className="text-muted">
                                            <strong>Horario:</strong> {
                                              codigo.horario.inicio && codigo.horario.fin
                                                ? `${codigo.horario.inicio} - ${codigo.horario.fin}${codigo.horario.cruza_medianoche ? ' (cruza medianoche)' : ''}`
                                                : 'Todo el día'
                                            }
                                          </small>
                                        </div>

                                        <div className="mt-1">
                                          <small className="text-muted">
                                            <strong>Días:</strong> {codigo.dias_aplicables}
                                          </small>
                                        </div>

                                        <div className="mt-1">
                                          <small className="text-success">
                                            <i className="bi bi-check-circle me-1"></i>
                                            {codigo.aplicabilidad.motivo}
                                          </small>
                                        </div>
                                      </div>
                                    ))}
                                  </Card.Body>
                                </Card>
                              )}
                            </>
                          ) : (
                            <Card className="shadow-sm border-0 mb-4"> {/* ✨ AGREGAR MARGIN-BOTTOM */}
                              <Card.Body className="text-center text-muted">
                                <i className="bi bi-calculator display-1"></i>
                                <p className="mt-3">Configure los parámetros y haga clic en "Simular Cálculo" para ver los resultados.</p>
                              </Card.Body>
                            </Card>
                          )}
                        </Col>
                      </Row>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </Container>
        </div>

        {/* ✨ FOOTER FIJO AL FINAL */}
        <Footer />

        {/* Modal para crear/editar código */}
        <CodigoModal
          show={showModal}
          onHide={handleModalClose}
          codigo={selectedCodigo}
        />

        {/* Modal para crear/editar tarifa */}
        <TarifaModal
          show={showTarifaModal}
          onHide={cerrarModalTarifa}
          tarifa={selectedTarifa}
          onSave={async (tarifaData) => {
            try {
              let tarifaGuardada: Tarifa;

              if (selectedTarifa && selectedTarifa.id) {
                // Actualizar tarifa existente
                tarifaGuardada = await TarifaService.updateTarifa({
                  ...selectedTarifa,
                  ...tarifaData
                });

                // Actualizar en el estado local
                setTarifas(prev => prev.map(t => t.id === tarifaGuardada.id ? tarifaGuardada : t));
              } else {
                // Crear nueva tarifa
                tarifaGuardada = await TarifaService.createTarifa(tarifaData);

                // Agregar al estado local
                setTarifas(prev => [...prev, tarifaGuardada]);
              }

              cerrarModalTarifa();

              // Recargar tarifas para asegurar consistencia
              await cargarTarifas();

            } catch (error: any) {
              console.error('Error al guardar tarifa:', error);
              setError(`Error al guardar tarifa: ${error.message || error}`);
            }
          }}
        />
      </div>
    </div>
  );
};

// ✅ Componente Modal para Tarifa
interface TarifaModalProps {
  show: boolean;
  onHide: () => void;
  tarifa?: Tarifa | null;
  onSave: (tarifa: TarifaCreacion) => Promise<void>;
}

const TarifaModal: React.FC<TarifaModalProps> = ({ show, onHide, tarifa, onSave }) => {
  const [formData, setFormData] = useState<TarifaCreacion>({
    nombre: '',
    valor_guardia_pasiva: 0,
    valor_hora_activa: 0,
    valor_adicional_nocturno_habil: 0,
    valor_adicional_nocturno_no_habil: 0,
    vigencia_desde: new Date().toISOString().split('T')[0],
    vigencia_hasta: null,
    estado: 'activo',
    observaciones: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (show) {
      if (tarifa) {
        // Editar tarifa existente
        setFormData(TarifaService.tarifaACreacion(tarifa));
      } else {
        // Nueva tarifa
        setFormData(TarifaService.getTarifaDefecto());
      }
      setErrors([]);
    }
  }, [show, tarifa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      // Validar usando el servicio
      const validacion = TarifaService.validarTarifa(formData);

      if (!validacion.valida) {
        setErrors(validacion.errores);
        return;
      }

      // Guardar tarifa
      await onSave(formData);

    } catch (error: any) {
      console.error('Error al guardar tarifa:', error);
      setErrors([error.message || 'Error al guardar la tarifa']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {tarifa ? 'Editar Tarifa' : 'Nueva Tarifa'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errors.length > 0 && (
          <Alert variant="danger">
            <Alert.Heading className="h6">Se encontraron errores:</Alert.Heading>
            <ul className="mb-0">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Nombre de la Tarifa *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Tarifa 2025 - Convenio Colectivo"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Guardia Pasiva *</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_guardia_pasiva}
                    onChange={(e) => setFormData({ ...formData, valor_guardia_pasiva: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Valor fijo por día de guardia pasiva
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Hora Activa *</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_hora_activa}
                    onChange={(e) => setFormData({ ...formData, valor_hora_activa: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Valor por hora de guardia activa
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Adicional Nocturno Hábil *</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_adicional_nocturno_habil}
                    onChange={(e) => setFormData({ ...formData, valor_adicional_nocturno_habil: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Lun-Vie 21:00-06:00
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Adicional Nocturno No Hábil *</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_adicional_nocturno_no_habil}
                    onChange={(e) => setFormData({ ...formData, valor_adicional_nocturno_no_habil: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Fines de semana y feriados 21:00-06:00
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Vigencia Desde *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.vigencia_desde}
                  onChange={(e) => setFormData({ ...formData, vigencia_desde: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Vigencia Hasta</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.vigencia_hasta || ''}
                  onChange={(e) => setFormData({ ...formData, vigencia_hasta: e.target.value || null })}
                />
                <Form.Text className="text-muted">
                  Dejar vacío para vigencia indefinida
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'activo' | 'inactivo' })}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Información adicional sobre esta tarifa..."
            />
          </Form.Group>

          <Alert variant="info">
            <Alert.Heading className="h6">
              <i className="bi bi-info-circle me-2"></i>
              Información sobre los Valores
            </Alert.Heading>
            <ul className="small mb-0">
              <li><strong>Guardia Pasiva:</strong> Se cobra por día completo, independientemente de si hay incidentes.</li>
              <li><strong>Hora Activa:</strong> Se cobra por cada hora de incidente, con fraccionamiento hacia arriba.</li>
              <li><strong>Nocturnos:</strong> Adicionales que se suman a las guardias activas entre 21:00 y 06:00.</li>
            </ul>
          </Alert>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            tarifa ? 'Actualizar' : 'Guardar'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CodigosPage;