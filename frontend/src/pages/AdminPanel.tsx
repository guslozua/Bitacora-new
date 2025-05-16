import React, { useState, useEffect, useRef } from 'react';
import { Card, Container, Row, Col, Form, Button, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSidebarVisibility } from '../services/SidebarVisibilityContext';
import LightFooter from '../components/LightFooter';
import axios from 'axios';
import Swal from 'sweetalert2';

// Importamos el componente modal que acabamos de crear
import AbmUploadModal from '../components/AbmUploadModal';

// Definir interfaces para mejorar el tipado
interface SidebarVisibility {
  [key: string]: boolean;
}

interface DashboardItem {
  id: string;
  label: string;
  visible: boolean;
}

interface SidebarItemMeta {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface AdminStat {
  title: string;
  value: number;
  icon: string;
  color: string;
}
const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { visibility, setVisibility } = useSidebarVisibility() as {
    visibility: SidebarVisibility;
    setVisibility: (visibility: SidebarVisibility) => void;
  };

  // Referencias para los formularios
  const itrackerFormRef = useRef<HTMLFormElement>(null);
  const tabulacionesFormRef = useRef<HTMLFormElement>(null);

  // Mantener una copia local del estado para aplicar cambios solo cuando se guarda
  const [localVisibility, setLocalVisibility] = useState<SidebarVisibility>({ ...visibility });
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Estados para modales
  const [showItrackerModal, setShowItrackerModal] = useState<boolean>(false);
  const [showTabulacionesModal, setShowTabulacionesModal] = useState<boolean>(false);
  const [showAbmUploadModal, setShowAbmUploadModal] = useState<boolean>(false);
  
  // Estados para carga de archivos
  const [itrackerFile, setItrackerFile] = useState<File | null>(null);
  const [tabulacionesFile, setTabulacionesFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const toggleSidebarItem = (id: string): void => {
    const newState: SidebarVisibility = {
      ...localVisibility,
      [id]: !localVisibility[id],
    };
    setLocalVisibility(newState);
    setIsDirty(true);
  };

  const saveChanges = (): void => {
    setVisibility(localVisibility);
    setIsDirty(false);
    
    // Mostrar SweetAlert en lugar de alert
    Swal.fire({
      title: '¡Cambios guardados!',
      text: 'La configuración ha sido actualizada correctamente',
      icon: 'success',
      iconColor: '#339fff',
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Reset changes if user cancels
  const cancelChanges = (): void => {
    setLocalVisibility({ ...visibility });
    setIsDirty(false);
  };

  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([
    { id: 'resumenProyectos', label: 'Resumen de Proyectos', visible: true },
    { id: 'tareasPendientes', label: 'Tareas Pendientes', visible: true },
    { id: 'ultimasCargas', label: 'Últimos archivos cargados', visible: true },
  ]);

  const toggleDashboardItem = (id: string): void => {
    setDashboardItems(items =>
      items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)
    );
    setIsDirty(true);
  };
  const sidebarItemsMeta: SidebarItemMeta[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-clipboard-data-fill', color: '#3498db' },
    { id: 'proyectos', label: 'Proyectos', icon: 'bi-diagram-3-fill', color: '#2ecc71' },
    { id: 'placas', label: 'Placas', icon: 'bi-clipboard', color: '#f1c40f' },
    { id: 'usuarios', label: 'ABM Usuarios', icon: 'bi-people-fill', color: '#e74c3c' },
    { id: 'bitacora', label: 'Bitácora', icon: 'bi-journal-text', color: '#9b59b6' },
    { id: 'hitos', label: 'Hitos', icon: 'bi-flag-fill', color: '#1abc9c' },
    { id: 'itracker', label: 'iTracker', icon: 'bi-circle', color: '#3498db' },
    { id: 'tabulaciones', label: 'Tabulaciones', icon: 'bi-table', color: '#2ecc71' },
    { id: 'incidencias', label: 'Inc. en Guardia', icon: 'bi-shield-exclamation', color: '#f1c40f' },
    { id: 'stats', label: 'Estadísticas', icon: 'bi-graph-up', color: '#e74c3c' },
    { id: 'admin', label: 'Configuración', icon: 'bi-gear-fill', color: '#9b59b6' },
    { id: 'reports', label: 'Informes', icon: 'bi-file-earmark-text', color: '#1abc9c' },
    { id: 'calendar', label: 'Calendario', icon: 'bi-calendar-date', color: '#3498db' },
    { id: 'messages', label: 'Mensajes', icon: 'bi-chat-dots-fill', color: '#2ecc71' },
    { id: 'notifications', label: 'Notificaciones', icon: 'bi-bell-fill', color: '#f1c40f' },
    { id: 'links', label: 'Links', icon: 'bi-link-45deg', color: '#e67e22' },  // Nuevo ítem Links
    { id: 'glosario', label: 'Glosario', icon: 'bi-book', color: '#8e44ad' },  // Nuevo ítem Glosario
  ];

  // Estadísticas simuladas para el panel de administración
  const adminStats: AdminStat[] = [
    { title: 'Usuarios Activos', value: 148, icon: 'bi-people-fill', color: '#3498db' },
    { title: 'Proyectos', value: 42, icon: 'bi-diagram-3-fill', color: '#2ecc71' },
    { title: 'Tareas Abiertas', value: 63, icon: 'bi-list-task', color: '#f1c40f' },
    { title: 'Archivos Cargados', value: 257, icon: 'bi-cloud-upload-fill', color: '#e74c3c' },
  ];
  // Función para manejar subida de archivos iTracker
  const handleItrackerUpload = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!itrackerFile) {
      setUploadError('Por favor seleccioná un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', itrackerFile);

    try {
      setUploading(true);
      setUploadError('');
      setUploadMessage('');

      console.log("👉 Enviando archivo al backend...");

      const res = await axios.post('http://localhost:5000/api/itracker/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = res.data?.data || res.data;
      const { total_insertados, total_duplicados } = responseData;

      setUploadMessage(`✔ Registros nuevos: ${total_insertados} | Repetidos: ${total_duplicados}`);
      
      // SweetAlert después de subir con éxito
      Swal.fire({
        title: '¡Archivo subido!',
        text: `Se procesaron ${total_insertados} registros nuevos y ${total_duplicados} repetidos.`,
        icon: 'success',
        iconColor: '#339fff',
        confirmButtonText: 'Entendido'
      });
    } catch (err) {
      setUploadError('Error al subir el archivo. Verificá que sea un .xlsx válido.');
      console.error('Error de carga:', err);
      
      // SweetAlert para errores
      Swal.fire({
        title: 'Error',
        text: 'Error al subir el archivo. Verificá que sea un .xlsx válido.',
        icon: 'error',
        confirmButtonText: 'Intentar nuevamente',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setUploading(false);
    }
  };

  // Función para manejar subida de archivos Tabulaciones
  const handleTabulacionesUpload = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!tabulacionesFile) {
      setUploadError('Por favor seleccioná un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', tabulacionesFile);

    try {
      setUploading(true);
      setUploadError('');
      setUploadMessage('');

      const res = await axios.post('http://localhost:5000/api/tabulaciones/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = res.data?.data || res.data;
      const { total_insertados, total_duplicados } = responseData;

      setUploadMessage(`✔ Registros nuevos: ${total_insertados} | Repetidos: ${total_duplicados}`);
      
      // SweetAlert después de subir con éxito
      Swal.fire({
        title: '¡Archivo subido!',
        text: `Se procesaron ${total_insertados} registros nuevos y ${total_duplicados} repetidos.`,
        icon: 'success',
        iconColor: '#339fff',
        confirmButtonText: 'Entendido'
      });
    } catch (err) {
      setUploadError('Error al subir el archivo. Verificá que sea un .xlsx válido.');
      console.error('Error de carga:', err);
      
      // SweetAlert para errores
      Swal.fire({
        title: 'Error',
        text: 'Error al subir el archivo. Verificá que sea un .xlsx válido.',
        icon: 'error',
        confirmButtonText: 'Intentar nuevamente',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setUploading(false);
    }
  };
  // Limpiar estados al cerrar los modales
  const resetItrackerModal = () => {
    setShowItrackerModal(false);
    setItrackerFile(null);
    setUploadMessage('');
    setUploadError('');
  };

  const resetTabulacionesModal = () => {
    setShowTabulacionesModal(false);
    setTabulacionesFile(null);
    setUploadMessage('');
    setUploadError('');
  };

  // Manejar el éxito de la carga de archivos ABM
  const handleAbmUploadSuccess = () => {
    // Aquí podrías realizar alguna acción adicional después de una carga exitosa
    // Por ejemplo, actualizar contadores o estadísticas
    console.log('Carga de archivo ABM exitosa');
  };
  return (
    <Container fluid className="py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <img
              src="logoxside22.png"
              alt="icono"
              style={{ width: '32px', height: '32px', marginRight: '10px' }}
            />
            <h2 className="mb-0 fw-bold">Panel de Administración</h2>
          </div>
          <p className="text-muted mb-0">
            Configura el comportamiento y apariencia del sistema
          </p>
        </div>

        <div className="d-flex">
          {/* Botón para ir al dashboard */}
          <Button 
            variant="outline-primary" 
            className="me-2 shadow-sm" 
            onClick={() => navigate('/dashboard')}
          >
            <i className="bi bi-house-door me-1"></i> Dashboard Principal
          </Button>
          
          {isDirty && (
            <>
              <Button variant="success" className="me-2 shadow-sm" onClick={saveChanges}>
                <i className="bi bi-check-circle me-1"></i> Guardar cambios
              </Button>
              <Button variant="light" className="shadow-sm" onClick={cancelChanges}>
                <i className="bi bi-x-circle me-1"></i> Cancelar
              </Button>
            </>
          )}
        </div>
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
                  <div className="rounded-circle d-flex align-items-center justify-content-center" 
                    style={{ 
                      backgroundColor: `${stat.color}20`,
                      width: '3.5rem',      // Ancho fijo
                      height: '3.5rem',     // Alto igual al ancho
                      padding: 0            // Quita el padding que causa la deformación
                    }}>
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
                            <div 
                              className="rounded-circle me-3 d-flex align-items-center justify-content-center" 
                              style={{ 
                                backgroundColor: `${item.color}20`,
                                width: '2.5rem',      // Ancho fijo
                                height: '2.5rem',     // Alto igual al ancho
                                padding: 0            // Quita el padding que causa la deformación
                              }}
                            >
                              <i 
                                className={`bi ${item.icon}`} 
                                style={{ color: item.color, fontSize: '1rem' }}
                              ></i>
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
                        <div className="rounded-circle me-3 d-flex align-items-center justify-content-center" 
                          style={{ 
                            backgroundColor: '#f8f9fa',
                            width: '2.5rem',
                            height: '2.5rem',
                            padding: 0
                          }}>
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
                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                      style={{ 
                        width: '3.5rem', 
                        height: '3.5rem',
                        padding: 0
                      }}>
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
                    onClick={() => setShowItrackerModal(true)}
                  >
                    <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                      style={{ 
                        width: '3.5rem', 
                        height: '3.5rem',
                        padding: 0
                      }}>
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
                    onClick={() => setShowTabulacionesModal(true)}
                  >
                    <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                      style={{ 
                        width: '3.5rem', 
                        height: '3.5rem',
                        padding: 0
                      }}>
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
                    onClick={() => setShowAbmUploadModal(true)}
                  >
                    <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                      style={{ 
                        width: '3.5rem', 
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className="bi bi-cloud-upload-fill fs-3 text-danger"></i>
                    </div>
                    <span className="fw-medium">Subir archivos PIC & Social</span>
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
                    <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                      style={{ 
                        width: '3.5rem', 
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className="bi bi-clock-history fs-3 text-warning"></i>
                    </div>
                    <span className="fw-medium">Historial de cargas</span>
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
                    disabled
                  >
                    <div className="bg-dark bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                      style={{ 
                        width: '3.5rem', 
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className="bi bi-journal-text fs-3 text-dark"></i>
                    </div>
                    <span className="fw-medium">Bitácora del sistema</span>
                    <Badge bg="secondary" className="mt-2">Proximamente</Badge>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      {/* Modal para subir archivos iTracker */}
      <Modal
        show={showItrackerModal}
        onHide={resetItrackerModal}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" 
              style={{ 
                width: '2.5rem', 
                height: '2.5rem',
                padding: 0
              }}>
              <i className="bi bi-file-earmark-excel text-success"></i>
            </div>
            Carga reporte iTracker
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form ref={itrackerFormRef} onSubmit={handleItrackerUpload}>
            <Form.Group controlId="formItrackerFile" className="mb-3">
              <Form.Label>Archivo Excel (.xlsx)</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const files = e.target.files;
                  setItrackerFile(files?.[0] || null);
                  setUploadMessage('');
                  setUploadError('');
                }}
              />
              <Form.Text className="text-muted">
                Selecciona el archivo de reporte iTracker para procesar.
              </Form.Text>
            </Form.Group>

            {uploadMessage && <Alert variant="success" className="mt-3">{uploadMessage}</Alert>}
            {uploadError && <Alert variant="danger" className="mt-3">{uploadError}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="secondary" 
            onClick={resetItrackerModal}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (itrackerFormRef.current) {
                itrackerFormRef.current.dispatchEvent(
                  new Event('submit', { cancelable: true, bubbles: true })
                );
              }
            }}
            disabled={uploading || !itrackerFile}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" /> Procesando...
              </>
            ) : "Subir archivo"}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal para subir archivos Tabulaciones */}
      <Modal
        show={showTabulacionesModal}
        onHide={resetTabulacionesModal}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" 
              style={{ 
                width: '2.5rem', 
                height: '2.5rem',
                padding: 0
              }}>
              <i className="bi bi-table text-info"></i>
            </div>
            Carga de Tabulaciones
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form ref={tabulacionesFormRef} onSubmit={handleTabulacionesUpload}>
            <Form.Group controlId="formTabulacionesFile" className="mb-3">
              <Form.Label>Archivo Excel (.xlsx) con la hoja "Tareas"</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const files = e.target.files;
                  setTabulacionesFile(files?.[0] || null);
                  setUploadMessage('');
                  setUploadError('');
                }}
              />
              <Form.Text className="text-muted">
                Selecciona el archivo de tabulaciones para procesar.
              </Form.Text>
            </Form.Group>

            {uploadMessage && <Alert variant="success" className="mt-3">{uploadMessage}</Alert>}
            {uploadError && <Alert variant="danger" className="mt-3">{uploadError}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="secondary" 
            onClick={resetTabulacionesModal}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (tabulacionesFormRef.current) {
                tabulacionesFormRef.current.dispatchEvent(
                  new Event('submit', { cancelable: true, bubbles: true })
                );
              }
            }} 
            disabled={uploading || !tabulacionesFile}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" /> Procesando...
              </>
            ) : "Subir archivo"}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal para subir archivos PIC y Social */}
      <AbmUploadModal 
        show={showAbmUploadModal} 
        onHide={() => setShowAbmUploadModal(false)}
        onSuccess={handleAbmUploadSuccess}
      />
      <LightFooter />
    </Container>
  );
};

export default AdminPanel;