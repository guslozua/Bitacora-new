import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSidebarVisibility } from '../services/SidebarVisibilityContext';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { visibility, setVisibility } = useSidebarVisibility();
  
  // Mantener una copia local del estado para aplicar cambios solo cuando se guarda
  const [localVisibility, setLocalVisibility] = useState({...visibility});
  const [isDirty, setIsDirty] = useState(false);
  
  const toggleSidebarItem = (id: string) => {
    const newState = {
      ...localVisibility,
      [id]: !localVisibility[id],
    };
    setLocalVisibility(newState);
    setIsDirty(true);
  };
  
  const saveChanges = () => {
    setVisibility(localVisibility);
    setIsDirty(false);
    // Mostrar mensaje de éxito o feedback
    alert('Cambios guardados correctamente');
  };
  
  // Reset changes if user cancels
  const cancelChanges = () => {
    setLocalVisibility({...visibility});
    setIsDirty(false);
  };

  const [dashboardItems, setDashboardItems] = useState([
    { id: 'resumenProyectos', label: 'Resumen de Proyectos', visible: true },
    { id: 'tareasPendientes', label: 'Tareas Pendientes', visible: true },
    { id: 'ultimasCargas', label: 'Últimos archivos cargados', visible: true },
  ]);

  const toggleDashboardItem = (id: string) => {
    setDashboardItems(items =>
      items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)
    );
    setIsDirty(true);
  };

  const sidebarItemsMeta = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', color: '#3498db' },
    { id: 'proyectos', label: 'Proyectos', icon: 'bi-diagram-3-fill', color: '#2ecc71' },
    { id: 'tareas', label: 'Tareas', icon: 'bi-list-task', color: '#f1c40f' },
    { id: 'usuarios', label: 'ABM Usuarios', icon: 'bi-people-fill', color: '#e74c3c' },
    { id: 'bitacora', label: 'Bitácora', icon: 'bi-journal-text', color: '#9b59b6' },
    { id: 'hitos', label: 'Hitos', icon: 'bi-flag-fill', color: '#1abc9c' },
    { id: 'itracker', label: 'iTracker', icon: 'bi-hdd-network-fill', color: '#3498db' },
    { id: 'tabulaciones', label: 'Tabulaciones', icon: 'bi-table', color: '#2ecc71' },
    { id: 'incidencias', label: 'Inc. en Guardia', icon: 'bi-shield-exclamation', color: '#f1c40f' },
    { id: 'stats', label: 'Estadísticas', icon: 'bi-graph-up', color: '#e74c3c' },
    { id: 'admin', label: 'Configuración', icon: 'bi-gear-fill', color: '#9b59b6' },
    { id: 'reports', label: 'Informes', icon: 'bi-file-earmark-text', color: '#1abc9c' },
    { id: 'calendar', label: 'Calendario', icon: 'bi-calendar-event', color: '#3498db' },
    { id: 'messages', label: 'Mensajes', icon: 'bi-chat-dots-fill', color: '#2ecc71' },
    { id: 'notifications', label: 'Notificaciones', icon: 'bi-bell-fill', color: '#f1c40f' },
  ];

  // Estadísticas simuladas para el panel de administración
  const adminStats = [
    { title: 'Usuarios Activos', value: 148, icon: 'bi-people-fill', color: '#3498db' },
    { title: 'Proyectos', value: 42, icon: 'bi-diagram-3-fill', color: '#2ecc71' },
    { title: 'Tareas Abiertas', value: 63, icon: 'bi-list-task', color: '#f1c40f' },
    { title: 'Archivos Cargados', value: 257, icon: 'bi-cloud-upload-fill', color: '#e74c3c' },
  ];

  return (
    <Container fluid className="py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold">Panel de Administración</h2>
          <p className="text-muted mb-0">Configura el comportamiento y apariencia del sistema</p>
        </div>
        
        {isDirty && (
          <div>
            <Button variant="success" className="me-2 shadow-sm" onClick={saveChanges}>
              <i className="bi bi-check-circle me-1"></i> Guardar cambios
            </Button>
            <Button variant="light" className="shadow-sm" onClick={cancelChanges}>
              <i className="bi bi-x-circle me-1"></i> Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <Row className="g-4 mb-4">
        {adminStats.map((stat, index) => (
          <Col md={3} key={index}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">{stat.title}</h6>
                    <h2 className="fw-bold mb-0">{stat.value}</h2>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: `${stat.color}20` }}>
                    <i className={`bi ${stat.icon} fs-3`} style={{ color: stat.color }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Configuración del Sidebar con Vista Previa */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-layout-sidebar me-2 text-primary"></i>
            Menú lateral (Sidebar)
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {/* Vista previa del sidebar - Con tamaño reducido pero mostrando todas las opciones */}
            <Col md={3}>
              <div className="pb-2 d-flex align-items-center">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-eye me-2 text-primary"></i>
                  Vista previa
                </h6>
              </div>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                  <div className="sidebar-preview" style={{ backgroundColor: '#2c3e50', borderRadius: '8px', overflow: 'hidden' }}>
                    <div className="sidebar-header p-3 d-flex align-items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="d-flex align-items-center">
                        {/* Logo real sidebar */}
                        <img src="/logoxside.png" alt="Logo" height="24" className="me-2" />
                        <h6 className="mb-0 text-white">TASK manager</h6>
                      </div>
                      <Button variant="link" className="ms-auto p-0 text-white">
                        <i className="bi bi-chevron-left"></i>
                      </Button>
                    </div>
                    <div className="sidebar-body py-2" style={{ fontSize: '0.85rem' }}>
                      {sidebarItemsMeta.map(item => (
                        localVisibility[item.id] !== false && (
                          <div key={item.id} className="sidebar-item d-flex align-items-center px-3 py-1 text-white">
                            <i className={`bi ${item.icon} me-2`}></i>
                            <span>{item.label}</span>
                          </div>
                        )
                      ))}
                      <div className="mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="sidebar-item d-flex align-items-center px-3 py-1 text-white mt-2">
                          <i className="bi bi-box-arrow-right me-2"></i>
                          <span>Cerrar sesión</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mt-3">
                    <small className="text-muted">
                      {isDirty ? 
                        "Las modificaciones solo se aplicarán al guardar los cambios" : 
                        "El sidebar se muestra como está actualmente configurado"}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Opciones de configuración - Con ajuste de tamaño */}
            <Col md={9}>
              <div className="pb-2 d-flex align-items-center">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-toggles me-2 text-primary"></i>
                  Opciones de visibilidad
                </h6>
              </div>
              <Row>
                {sidebarItemsMeta.map(item => (
                  <Col xs={12} md={6} lg={4} key={item.id} className="mb-3">
                    <Card className="border shadow-sm h-100">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <div className="p-2 rounded-circle me-3" style={{ backgroundColor: `${item.color}20` }}>
                              <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: '1rem' }}></i>
                            </div>
                            <span className="fw-medium">{item.label}</span>
                          </div>
                          <Form.Check
                            type="switch"
                            id={`switch-${item.id}`}
                            checked={localVisibility[item.id] !== false}
                            onChange={() => toggleSidebarItem(item.id)}
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Configuración del Dashboard */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-grid-1x2 me-2 text-success"></i>
            Contenido del Dashboard Principal
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {dashboardItems.map((item, index) => (
              <Col xs={12} md={6} lg={4} key={item.id} className="mb-3">
                <Card className="border shadow-sm h-100">
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div className="p-2 rounded-circle me-3" style={{ backgroundColor: '#f8f9fa' }}>
                          <i className="bi bi-window-dock text-dark" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        <span className="fw-medium">{item.label}</span>
                      </div>
                      <Form.Check
                        type="switch"
                        id={`switch-dash-${item.id}`}
                        checked={item.visible}
                        onChange={() => toggleDashboardItem(item.id)}
                        className="fs-4"
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Accesos rápidos a herramientas */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-tools me-2 text-warning"></i>
            Herramientas Administrativas
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-0">
                  <Button 
                    variant="light" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0"
                    onClick={() => navigate('/admin/users')}
                  >
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle mb-3">
                      <i className="bi bi-people-fill fs-3 text-primary"></i>
                    </div>
                    <span className="fw-medium">Gestión de Usuarios</span>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-0">
                  <Button 
                    variant="light" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0"
                    onClick={() => navigate('/itrackerupload')}
                  >
                    <div className="bg-success bg-opacity-10 p-3 rounded-circle mb-3">
                      <i className="bi bi-file-earmark-excel fs-3 text-success"></i>
                    </div>
                    <span className="fw-medium">Subir archivos iTracker</span>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-0">
                  <Button 
                    variant="light" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0"
                    onClick={() => navigate('/tabulacionesupload')}
                  >
                    <div className="bg-info bg-opacity-10 p-3 rounded-circle mb-3">
                      <i className="bi bi-table fs-3 text-info"></i>
                    </div>
                    <span className="fw-medium">Subir archivos Tabulaciones</span>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-0">
                  <Button 
                    variant="light" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0"
                    disabled
                  >
                    <div className="bg-secondary bg-opacity-10 p-3 rounded-circle mb-3">
                      <i className="bi bi-cloud-upload-fill fs-3 text-secondary"></i>
                    </div>
                    <span className="fw-medium">Subir archivos PIC & Social</span>
                    <Badge bg="secondary" className="mt-2">Proximamente</Badge>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-0">
                  <Button 
                    variant="light" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0"
                    onClick={() => navigate('/admin/uploads')}
                  >
                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle mb-3">
                      <i className="bi bi-clock-history fs-3 text-warning"></i>
                    </div>
                    <span className="fw-medium">Historial de cargas</span>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-0">
                  <Button 
                    variant="light" 
                    className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0"
                    onClick={() => navigate('/admin/logs')}
                  >
                    <div className="bg-dark bg-opacity-10 p-3 rounded-circle mb-3">
                      <i className="bi bi-journal-text fs-3 text-dark"></i>
                    </div>
                    <span className="fw-medium">Bitácora del sistema</span>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminPanel;