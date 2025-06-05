// src/pages/GestionGuardiasPage.tsx - VERSIÓN CON NAVEGACIÓN MEJORADA COMPLETA
import React, { useState } from 'react';
import { Container, Nav, Tab, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Importar los componentes existentes
import AdminGuardias from '../components/AdminGuardias/AdminGuardias';
import DashboardResumen from '../components/Informes/DashboardResumen';
import InformeIncidentesComponent from '../components/Informes/InformeIncidentesComponent';
import InformeGuardiasComponent from '../components/Informes/InformeGuardiasComponent';
import InformeLiquidacionesComponent from '../components/Informes/InformeLiquidacionesComponent';

// Importar todo lo necesario para la sección de códigos
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

import { 
  Card, Button, Spinner, Alert, Form, Table, Modal, InputGroup 
} from 'react-bootstrap';

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

const GestionGuardiasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Obtener tab activo desde URL o default
  const tabFromUrl = searchParams.get('tab') || 'cronograma';
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Estados para códigos y tarifas (copiados de CodigosPage)
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Estados para tarifas
  const [subTab, setSubTab] = useState<string>('codigos');
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

  // Cargar datos cuando cambia el tab
  React.useEffect(() => {
    if (activeTab === 'facturacion') {
      if (subTab === 'codigos') {
        loadCodigos();
      } else if (subTab === 'tarifas') {
        cargarTarifas();
      }
    }
  }, [filters, activeTab, subTab]);

  // Actualizar URL cuando cambia el tab
  const handleTabChange = (tab: string | null) => {
    if (tab) {
      setActiveTab(tab);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', tab);
      setSearchParams(newSearchParams);
    }
  };

  // Funciones para códigos (copiadas de CodigosPage)
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

      const codigosData = await CodigoService.fetchCodigos(params);
      setCodigos(codigosData);
    } catch (error) {
      console.error('Error al cargar códigos:', error);
      setError('No se pudieron cargar los códigos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const cargarTarifas = async () => {
    setLoadingTarifas(true);
    try {
      const tarifasData = await TarifaService.fetchTarifas({
        incluir_inactivas: true
      });

      setTarifas(tarifasData);
      const tarifaVigente = tarifasData.find(t => t.estado === 'activo') || null;
      setTarifaActual(tarifaVigente);

    } catch (err: any) {
      console.error('Error al cargar tarifas:', err);
      setError(`Error al cargar tarifas: ${err.message || err}`);
    } finally {
      setLoadingTarifas(false);
    }
  };

  const simularCalculo = async () => {
    if (!tarifaActual || !tarifaActual.id) {
      setError('No hay tarifa seleccionada para simular');
      return;
    }

    setLoadingSimulacion(true);
    try {
      const parametros = prepararParametrosSimulacionSegura(
        simulacion.fecha,
        simulacion.hora_inicio,
        simulacion.hora_fin,
        simulacion.tipo_guardia,
        tarifaActual.id,
        simulacion.modalidad_convenio
      );

      const resultadoReal = await TarifaService.simularCalculo(parametros);

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
      console.error('Error en simulación:', err);
      setError(`Error en la simulación: ${err.message || err}`);
    } finally {
      setLoadingSimulacion(false);
    }
  };

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

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const contentStyle: React.CSSProperties = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div className="d-flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggle={toggleSidebar}
        onLogout={handleLogout}
      />

      <div style={contentStyle}>
        <div className="flex-grow-1">
          <Container fluid className="py-4">
            {/* Header principal */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-0 fw-bold">Gestión Integral de Guardias</h2>
                <p className="text-muted mb-0">Cronograma, facturación e informes en un solo lugar</p>
              </div>
              <div className="d-flex gap-2">
                {activeTab === 'facturacion' && tarifaActual && (
                  <Badge bg="success" className="fs-6 px-3 py-2">
                    <i className="bi bi-check-circle me-1"></i>
                    Tarifa Vigente: {tarifaActual.nombre}
                  </Badge>
                )}
                <Badge bg="primary" className="fs-6 px-3 py-2">
                  <i className="bi bi-shield-check me-1"></i>
                  Sistema Integrado
                </Badge>
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* 🚀 NAVEGACIÓN PRINCIPAL MEJORADA - ESTILO CARD CON SEPARADORES */}
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body className="p-0">
                <div className="d-flex">
                  {/* Tab: Cronograma */}
                  <div 
                    className={`flex-fill p-4 cursor-pointer border-end ${activeTab === 'cronograma' ? 'bg-primary text-white' : 'bg-light'}`}
                    onClick={() => handleTabChange('cronograma')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderTopLeftRadius: '0.375rem',
                      borderBottomLeftRadius: '0.375rem'
                    }}
                  >
                    <div className="text-center">
                      <i className={`bi bi-calendar-week fs-1 ${activeTab === 'cronograma' ? 'text-white' : 'text-primary'} mb-2`}></i>
                      <h5 className={`mb-1 fw-bold ${activeTab === 'cronograma' ? 'text-white' : 'text-dark'}`}>
                        Cronograma de Guardias
                      </h5>
                      <small className={activeTab === 'cronograma' ? 'text-white-50' : 'text-muted'}>
                        Gestión del calendario y asignaciones
                      </small>
                    </div>
                  </div>

                  {/* Tab: Facturación */}
                  <div 
                    className={`flex-fill p-4 cursor-pointer border-end ${activeTab === 'facturacion' ? 'bg-success text-white' : 'bg-light'}`}
                    onClick={() => handleTabChange('facturacion')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div className="text-center">
                      <i className={`bi bi-receipt fs-1 ${activeTab === 'facturacion' ? 'text-white' : 'text-success'} mb-2`}></i>
                      <h5 className={`mb-1 fw-bold ${activeTab === 'facturacion' ? 'text-white' : 'text-dark'}`}>
                        Facturación y Tarifas
                      </h5>
                      <small className={activeTab === 'facturacion' ? 'text-white-50' : 'text-muted'}>
                        Códigos, tarifas y simulaciones
                      </small>
                    </div>
                  </div>

                  {/* Tab: Informes */}
                  <div 
                    className={`flex-fill p-4 cursor-pointer ${activeTab === 'informes' ? 'bg-info text-white' : 'bg-light'}`}
                    onClick={() => handleTabChange('informes')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderTopRightRadius: '0.375rem',
                      borderBottomRightRadius: '0.375rem'
                    }}
                  >
                    <div className="text-center">
                      <i className={`bi bi-graph-up fs-1 ${activeTab === 'informes' ? 'text-white' : 'text-info'} mb-2`}></i>
                      <h5 className={`mb-1 fw-bold ${activeTab === 'informes' ? 'text-white' : 'text-dark'}`}>
                        Informes y Estadísticas
                      </h5>
                      <small className={activeTab === 'informes' ? 'text-white-50' : 'text-muted'}>
                        Dashboard y reportes analíticos
                      </small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* CONTENIDO DE LAS PESTAÑAS */}
            <div>
              {/* Tab: Cronograma de Guardias */}
              {activeTab === 'cronograma' && (
                <div>
                  <AdminGuardias />
                </div>
              )}

              {/* Tab: Facturación y Tarifas */}
              {activeTab === 'facturacion' && (
                <div>
                  {/* 🚀 SUB-NAVEGACIÓN MEJORADA - ESTILO BREADCRUMB CARD */}
                  <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-success text-white py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-receipt fs-4 me-3"></i>
                          <div>
                            <h5 className="mb-0 text-white">Facturación y Tarifas</h5>
                            <small className="text-white-50">Gestión completa del sistema de facturación</small>
                          </div>
                        </div>
                        {tarifaActual && (
                          <Badge bg="light" className="text-success fs-6 px-3 py-2">
                            <i className="bi bi-check-circle me-1"></i>
                            Tarifa Vigente: {tarifaActual.nombre}
                          </Badge>
                        )}
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="d-flex">
                        {/* Sub-tab: Códigos */}
                        <div 
                          className={`flex-fill p-3 cursor-pointer border-end ${subTab === 'codigos' ? 'bg-primary text-white' : 'bg-white'}`}
                          onClick={() => setSubTab('codigos')}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center">
                            <i className={`bi bi-upc-scan me-2 ${subTab === 'codigos' ? 'text-white' : 'text-primary'}`}></i>
                            <span className={`fw-medium ${subTab === 'codigos' ? 'text-white' : 'text-dark'}`}>
                              Códigos de Facturación
                            </span>
                          </div>
                        </div>

                        {/* Sub-tab: Tarifas */}
                        <div 
                          className={`flex-fill p-3 cursor-pointer border-end ${subTab === 'tarifas' ? 'bg-primary text-white' : 'bg-white'}`}
                          onClick={() => setSubTab('tarifas')}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center">
                            <i className={`bi bi-cash-coin me-2 ${subTab === 'tarifas' ? 'text-white' : 'text-success'}`}></i>
                            <span className={`fw-medium ${subTab === 'tarifas' ? 'text-white' : 'text-dark'}`}>
                              Tarifas y Valores
                            </span>
                          </div>
                        </div>

                        {/* Sub-tab: Simulador */}
                        <div 
                          className={`flex-fill p-3 cursor-pointer ${subTab === 'simulador' ? 'bg-primary text-white' : 'bg-white'}`}
                          onClick={() => setSubTab('simulador')}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center">
                            <i className={`bi bi-calculator me-2 ${subTab === 'simulador' ? 'text-white' : 'text-info'}`}></i>
                            <span className={`fw-medium ${subTab === 'simulador' ? 'text-white' : 'text-dark'}`}>
                              Simulador de Cálculos
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* CONTENIDO DE SUB-PESTAÑAS */}
                  <div>
                    {/* Sub-tab: Códigos */}
                    {subTab === 'codigos' && (
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
                    )}

                    {/* Sub-tab: Tarifas */}
                    {subTab === 'tarifas' && (
                      <Card className="shadow-sm border-0 mb-4">
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
                                            setSubTab('simulador');
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
                    )}

                    {/* Sub-tab: Simulador */}
                    {subTab === 'simulador' && (
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
                                    onClick={() => setSubTab('tarifas')}
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
                                <Card className="shadow-sm border-0 mb-4">
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
                            <Card className="shadow-sm border-0 mb-4">
                              <Card.Body className="text-center text-muted">
                                <i className="bi bi-calculator display-1"></i>
                                <p className="mt-3">Configure los parámetros y haga clic en "Simular Cálculo" para ver los resultados.</p>
                              </Card.Body>
                            </Card>
                          )}
                        </Col>
                      </Row>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Informes y Estadísticas */}
              {activeTab === 'informes' && (
                <div>
                  {/* 🚀 SUB-NAVEGACIÓN MEJORADA PARA INFORMES */}
                  <Card className="shadow-sm border-0 mb-4">
                    <Card.Header className="bg-info text-white py-3">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-graph-up fs-4 me-3"></i>
                        <div>
                          <h5 className="mb-0 text-white">Informes y Estadísticas</h5>
                          <small className="text-white-50">Dashboard analítico y reportes detallados</small>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="row g-0">
                        {/* Dashboard */}
                        <div className="col-md-3">
                          <div 
                            className="p-4 h-100 cursor-pointer border-end"
                            onClick={() => setSubTab('dashboard')}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backgroundColor: subTab === 'dashboard' ? '#0dcaf0' : 'white',
                              color: subTab === 'dashboard' ? 'white' : 'inherit'
                            }}
                          >
                            <div className="text-center">
                              <i className={`bi bi-speedometer2 fs-2 mb-2 ${subTab === 'dashboard' ? 'text-white' : 'text-info'}`}></i>
                              <h6 className={`mb-1 fw-bold ${subTab === 'dashboard' ? 'text-white' : 'text-dark'}`}>Dashboard</h6>
                              <small className={subTab === 'dashboard' ? 'text-white-50' : 'text-muted'}>
                                Vista general
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Guardias */}
                        <div className="col-md-3">
                          <div 
                            className="p-4 h-100 cursor-pointer border-end"
                            onClick={() => setSubTab('guardias-informe')}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backgroundColor: subTab === 'guardias-informe' ? '#0dcaf0' : 'white',
                              color: subTab === 'guardias-informe' ? 'white' : 'inherit'
                            }}
                          >
                            <div className="text-center">
                              <i className={`bi bi-shield-check fs-2 mb-2 ${subTab === 'guardias-informe' ? 'text-white' : 'text-success'}`}></i>
                              <h6 className={`mb-1 fw-bold ${subTab === 'guardias-informe' ? 'text-white' : 'text-dark'}`}>Guardias</h6>
                              <small className={subTab === 'guardias-informe' ? 'text-white-50' : 'text-muted'}>
                                Análisis de guardias
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Incidentes */}
                        <div className="col-md-3">
                          <div 
                            className="p-4 h-100 cursor-pointer border-end"
                            onClick={() => setSubTab('incidentes')}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backgroundColor: subTab === 'incidentes' ? '#0dcaf0' : 'white',
                              color: subTab === 'incidentes' ? 'white' : 'inherit'
                            }}
                          >
                            <div className="text-center">
                              <i className={`bi bi-exclamation-triangle fs-2 mb-2 ${subTab === 'incidentes' ? 'text-white' : 'text-warning'}`}></i>
                              <h6 className={`mb-1 fw-bold ${subTab === 'incidentes' ? 'text-white' : 'text-dark'}`}>Incidentes</h6>
                              <small className={subTab === 'incidentes' ? 'text-white-50' : 'text-muted'}>
                                Reportes de incidentes
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Liquidaciones */}
                        <div className="col-md-3">
                          <div 
                            className="p-4 h-100 cursor-pointer"
                            onClick={() => setSubTab('liquidaciones')}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backgroundColor: subTab === 'liquidaciones' ? '#0dcaf0' : 'white',
                              color: subTab === 'liquidaciones' ? 'white' : 'inherit'
                            }}
                          >
                            <div className="text-center">
                              <i className={`bi bi-cash-coin fs-2 mb-2 ${subTab === 'liquidaciones' ? 'text-white' : 'text-primary'}`}></i>
                              <h6 className={`mb-1 fw-bold ${subTab === 'liquidaciones' ? 'text-white' : 'text-dark'}`}>Liquidaciones</h6>
                              <small className={subTab === 'liquidaciones' ? 'text-white-50' : 'text-muted'}>
                                Facturación y pagos
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* CONTENIDO DE SUB-PESTAÑAS DE INFORMES */}
                  <div>
                    {subTab === 'dashboard' && <DashboardResumen />}
                    {subTab === 'guardias-informe' && <InformeGuardiasComponent />}
                    {subTab === 'incidentes' && <InformeIncidentesComponent />}
                    {subTab === 'liquidaciones' && <InformeLiquidacionesComponent />}
                  </div>
                </div>
              )}
            </div>
          </Container>
        </div>

        {/* Footer fijo al final */}
        <Footer />

        {/* Modales */}
        <CodigoModal
          show={showModal}
          onHide={handleModalClose}
          codigo={selectedCodigo}
        />

        <TarifaModal
          show={showTarifaModal}
          onHide={cerrarModalTarifa}
          tarifa={selectedTarifa}
          onSave={async (tarifaData) => {
            try {
              let tarifaGuardada: Tarifa;

              if (selectedTarifa && selectedTarifa.id) {
                tarifaGuardada = await TarifaService.updateTarifa({
                  ...selectedTarifa,
                  ...tarifaData
                });
                setTarifas(prev => prev.map(t => t.id === tarifaGuardada.id ? tarifaGuardada : t));
              } else {
                tarifaGuardada = await TarifaService.createTarifa(tarifaData);
                setTarifas(prev => [...prev, tarifaGuardada]);
              }

              cerrarModalTarifa();
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

// Componente Modal para Tarifa (copiado de CodigosPage)
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

  React.useEffect(() => {
    if (show) {
      if (tarifa) {
        setFormData(TarifaService.tarifaACreacion(tarifa));
      } else {
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
      const validacion = TarifaService.validarTarifa(formData);

      if (!validacion.valida) {
        setErrors(validacion.errores);
        return;
      }

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

export default GestionGuardiasPage;