// =============================================
// PÁGINA MEJORADA: pages/ContactosPage.tsx - CON 4 PESTAÑAS
// =============================================

import React, { useState, useEffect } from 'react';
import { Container, Card, Nav, Tab, Alert, Spinner, Row, Col, InputGroup, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import AgendaEquipos from '../components/Contactos/AgendaEquipos';
import ContactosIndividuales from '../components/Contactos/ContactosIndividuales';
import SistemasMonitoreados from '../components/Contactos/SistemasMonitoreados';
import SimuladorRespuesta from '../components/Contactos/SimuladorRespuesta';
import ContactosService from '../services/ContactosService';
import { Equipo, Sistema, Integrante, ResultadoBusqueda } from '../types/contactos';

// ✅ ENUMS PARA CAMPOS PREDEFINIDOS
export const ROLES_DISPONIBLES = [
  'Desarrollador Senior',
  'Desarrollador Junior', 
  'Tester',
  'Product Owner',
  'Coordinador',
  'Gerente',
  'Analista',
  'IT',
  'Otro'
];

export const CATEGORIAS_SISTEMAS = [
  'Aplicacion Web',
  'Base de Datos',
  'API',
  'Red/Infraestructura',
  'Escritorios remotos',
  'Monitoreo',
  'Seguridad',
  'Backup/Storage',
  'Telefonía',
  'Redes Sociales',
  'Cloud Service'
];

const ContactosPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<string>('equipos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para datos
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('');
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadoBusqueda[]>([]);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Búsqueda global con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaGlobal.length >= 2) {
        realizarBusquedaGlobal();
      } else {
        setResultadosBusqueda([]);
        setMostrarBusqueda(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busquedaGlobal]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [equiposData, sistemasData, integrantesData] = await Promise.all([
        ContactosService.fetchEquipos(),
        ContactosService.fetchSistemas(),
        ContactosService.fetchIntegrantes()
      ]);

      setEquipos(equiposData);
      setSistemas(sistemasData);
      setIntegrantes(integrantesData);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos de contactos');
    } finally {
      setLoading(false);
    }
  };

  const realizarBusquedaGlobal = async () => {
    try {
      const resultados = await ContactosService.buscarContactos(busquedaGlobal);
      setResultadosBusqueda(resultados);
      setMostrarBusqueda(true);
    } catch (err) {
      console.error('Error en búsqueda global:', err);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleBusquedaGlobal = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusquedaGlobal(e.target.value);
  };

  const handleContactoBusqueda = (resultado: ResultadoBusqueda) => {
    if (resultado.telefono) {
      if (resultado.tipo === 'equipo') {
        ContactosService.abrirWhatsApp(resultado.telefono, 'Hola, me comunico por un incidente técnico.');
      } else {
        ContactosService.abrirLlamada(resultado.telefono);
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const
  };

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          toggle={toggleSidebar}
          onLogout={() => navigate('/login')}
        />
        <div style={contentStyle}>
          <Container fluid className="py-4">
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando contactos...</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggle={toggleSidebar}
        onLogout={() => navigate('/login')}
      />

      <div style={contentStyle}>
        <div className="flex-grow-1">
          <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-0 fw-bold">📞 Agenda de Contactos</h2>
                <p className="text-muted mb-0">Gestión completa de equipos, contactos y sistemas</p>
              </div>
              
              {/* Búsqueda Global */}
              <div className="position-relative" style={{ width: '300px' }}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Búsqueda rápida..."
                    value={busquedaGlobal}
                    onChange={handleBusquedaGlobal}
                  />
                </InputGroup>
                
                {/* Resultados de búsqueda global */}
                {mostrarBusqueda && resultadosBusqueda.length > 0 && (
                  <Card className="position-absolute mt-1 w-100" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                    <Card.Body className="p-2">
                      {resultadosBusqueda.map((resultado, index) => (
                        <div
                          key={`${resultado.tipo}-${resultado.id}-${index}`}
                          className="d-flex justify-content-between align-items-center p-2 rounded hover-bg mb-1"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleContactoBusqueda(resultado)}
                        >
                          <div>
                            <div className="d-flex align-items-center">
                              <span 
                                className="badge rounded-pill me-2"
                                style={{ backgroundColor: resultado.color, width: '8px', height: '8px' }}
                              ></span>
                              <strong>{resultado.titulo}</strong>
                              <small className="text-muted ms-2">({resultado.tipo})</small>
                            </div>
                            {resultado.descripcion && (
                              <small className="text-muted">{resultado.descripcion}</small>
                            )}
                            {resultado.telefono && (
                              <small className="d-block text-primary">
                                📞 {ContactosService.formatearTelefono(resultado.telefono)}
                              </small>
                            )}
                          </div>
                          {resultado.telefono && (
                            <div>
                              <i className="bi bi-telephone text-primary"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}

            {/* ✅ TABS MEJORADOS - 4 PESTAÑAS */}
            <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
              <Row>
                <Col md={12}>
                  <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                      <Nav.Link eventKey="equipos">
                        <i className="bi bi-people-fill me-2"></i>
                        Equipos Técnicos
                        <span className="badge bg-primary ms-2">{equipos.length}</span>
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="contactos">
                        <i className="bi bi-person-lines-fill me-2"></i>
                        Contactos Individuales
                        <span className="badge bg-success ms-2">{integrantes.length}</span>
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="sistemas">
                        <i className="bi bi-diagram-3 me-2"></i>
                        Sistemas Monitoreados
                        <span className="badge bg-info ms-2">{sistemas.length}</span>
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="simulador">
                        <i className="bi bi-gear-wide-connected me-2"></i>
                        Simulador de Respuesta
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Tab.Content>
                    {/* ✅ Tab: Equipos Técnicos */}
                    <Tab.Pane eventKey="equipos">
                      <AgendaEquipos
                        equipos={equipos}
                        integrantes={integrantes}
                        sistemas={sistemas}
                        searchTerm={searchTerm}
                        onSearch={handleSearch}
                        filtroDisponibilidad={filtroDisponibilidad}
                        onFiltroDisponibilidadChange={setFiltroDisponibilidad}
                        filtroEquipo={filtroEquipo}
                        onFiltroEquipoChange={setFiltroEquipo}
                        onReload={loadInitialData}
                      />
                    </Tab.Pane>

                    {/* ✅ Tab: Contactos Individuales */}
                    <Tab.Pane eventKey="contactos">
                      <ContactosIndividuales
                        integrantes={integrantes}
                        equipos={equipos}
                        onReload={loadInitialData}
                      />
                    </Tab.Pane>

                    {/* ✅ Tab: Sistemas Monitoreados */}
                    <Tab.Pane eventKey="sistemas">
                      <SistemasMonitoreados
                        sistemas={sistemas}
                        equipos={equipos}
                        onReload={loadInitialData}
                      />
                    </Tab.Pane>

                    {/* ✅ Tab: Simulador de Respuesta */}
                    <Tab.Pane eventKey="simulador">
                      <SimuladorRespuesta sistemas={sistemas} />
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </Container>
        </div>

        <Footer />
      </div>

      <style>{`
        .hover-bg:hover {
          background-color: rgba(0,123,255,0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default ContactosPage;