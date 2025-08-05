import React, { useState, useEffect, useRef } from 'react';
import { Card, Container, Row, Col, Form, Button, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSidebarVisibility } from '../services/SidebarVisibilityContext';
import { useTheme } from '../context/ThemeContext';
import ThemedFooter from '../components/ThemedFooter';
import axios from 'axios';
import Swal from 'sweetalert2';
import AbmUploadModal from '../components/AbmUploadModal';
import { useDashboardSectionVisibility } from '../services/DashboardSectionVisibilityContext';
import KpiAdminSection from '../components/KpiAdminSection';
import SectionOrderManager from '../components/SectionOrderManager';
import GlobalConfigurationPanel from '../components/GlobalConfigurationPanel';
import { API_BASE_URL } from '../services/apiConfig';

// 🔐 NUEVOS IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { SYSTEM_PERMISSIONS, USER_PERMISSIONS } from '../utils/permissions';


interface SidebarVisibility {
  [key: string]: boolean;
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
  const { isDarkMode } = useTheme();
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermissions();

  const { visibility, setVisibility } = useSidebarVisibility() as {
    visibility: SidebarVisibility;
    setVisibility: (visibility: SidebarVisibility) => void;
  };

  // Usar el contexto de secciones del Dashboard - solo necesitamos resetToDefaults
  const { resetToDefaults: resetSectionsToDefaults } = useDashboardSectionVisibility();

  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        background: '#212529',
        cardBackground: '#343a40',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        textMuted: '#6c757d',
        border: '#495057',
        sidebarBg: '#2c3e50',
        sidebarText: '#ffffff'
      };
    }
    return {
      background: '#f8f9fa',
      cardBackground: '#ffffff',
      textPrimary: '#212529',
      textSecondary: '#495057',
      textMuted: '#6c757d',
      border: '#dee2e6',
      sidebarBg: '#2c3e50',
      sidebarText: '#ffffff'
    };
  };

  const themeColors = getThemeColors();

  const itrackerFormRef = useRef<HTMLFormElement>(null);
  const tabulacionesFormRef = useRef<HTMLFormElement>(null);

  const [localVisibility, setLocalVisibility] = useState<SidebarVisibility>({ ...visibility });
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const [showItrackerModal, setShowItrackerModal] = useState<boolean>(false);
  const [showTabulacionesModal, setShowTabulacionesModal] = useState<boolean>(false);
  const [showAbmUploadModal, setShowAbmUploadModal] = useState<boolean>(false);

  const [itrackerFile, setItrackerFile] = useState<File | null>(null);
  const [tabulacionesFile, setTabulacionesFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  // 🔧 NUEVOS ESTADOS PARA DATOS REALES
  const [realAdminStats, setRealAdminStats] = useState<AdminStat[]>([
    { title: 'Usuarios Activos', value: 0, icon: 'bi-people-fill', color: '#3498db' },
    { title: 'Proyectos Totales', value: 0, icon: 'bi-diagram-3-fill', color: '#2ecc71' },
    { title: 'Hitos Registrados', value: 0, icon: 'bi-flag-fill', color: '#f39c12' },
    { title: 'Tareas Pendientes', value: 0, icon: 'bi-list-task', color: '#e74c3c' },
    { title: 'Registros Cargados', value: 0, icon: 'bi-cloud-upload-fill', color: '#9b59b6' },
  ]);

  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // 🆕 ACTUALIZADO: Array completo de elementos del sidebar incluyendo monitoreo aternity y análisis de sesiones
  const sidebarItemsMeta: SidebarItemMeta[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-clipboard-data-fill', color: '#3498db' },
    { id: 'proyectos', label: 'Proyectos', icon: 'bi-diagram-3-fill', color: '#2ecc71' },
    { id: 'hitos', label: 'Hitos', icon: 'bi-flag-fill', color: '#1abc9c' },
    { id: 'placas', label: 'Placas', icon: 'bi-clipboard', color: '#f1c40f' },
    { id: 'usuarios', label: 'ABM Usuarios', icon: 'bi-people-fill', color: '#e74c3c' },
    { id: 'itracker', label: 'iTracker', icon: 'bi-circle', color: '#3498db' },
    { id: 'tabulaciones', label: 'Tabulaciones', icon: 'bi-grid-3x3-gap', color: '#2ecc71' },
    { id: 'sessionanalysis', label: 'Análisis de Sesiones', icon: 'bi-graph-up-arrow', color: '#ff6b6b' },
    { id: 'aternity', label: 'Monitoreo Aternity', icon: 'bi-speedometer2', color: '#17a2b8' },
    { id: 'contactos', label: 'Agenda de Contactos', icon: 'bi-telephone-fill', color: '#c30b4e' },
    { id: 'calendar', label: 'Calendario', icon: 'bi-calendar-date', color: '#3498db' },
    { id: 'messages', label: 'Mensajes', icon: 'bi-chat-dots-fill', color: '#2ecc71' },
    { id: 'notifications', label: 'Notificaciones', icon: 'bi-bell-fill', color: '#f1c40f' },
    { id: 'links', label: 'Links', icon: 'bi-link-45deg', color: '#e67e22' },
    { id: 'glosario', label: 'Glosario', icon: 'bi-book', color: '#8e44ad' },
    { id: 'bitacora', label: 'Bitácora', icon: 'bi-journal-text', color: '#9b59b6' },
    { id: 'stats', label: 'Estadísticas', icon: 'bi-graph-up', color: '#e74c3c' },
    { id: 'reports', label: 'Informes', icon: 'bi-file-earmark-text', color: '#1abc9c' },
    { id: 'admin', label: 'Configuración', icon: 'bi-gear-fill', color: '#9b59b6' },
  ];

  // 🎯 FUNCIÓN NUEVA: Cargar estadísticas reales del sistema
  const fetchAdminStats = async (): Promise<void> => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }

      const config = {
        headers: { 'x-auth-token': token },
      };

      // 🔄 OBTENER DATOS DE MÚLTIPLES ENDPOINTS
      const [
        usersRes,
        projectsRes, 
        hitosRes,
        tasksRes,
        itrackerRes,
        tabulacionesRes
      ] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/users`, config),
        axios.get(`${API_BASE_URL}/projects`, config),
        axios.get(`${API_BASE_URL}/hitos`, config),
        axios.get(`${API_BASE_URL}/tasks`, config),
        axios.get(`${API_BASE_URL}/itracker/stats`, config).catch(() => ({ data: { count: 0 } })),
        axios.get(`${API_BASE_URL}/tabulaciones/stats`, config).catch(() => ({ data: { count: 0 } }))
      ]);

      // 📊 PROCESAR DATOS Y CALCULAR ESTADÍSTICAS
      let usuariosActivos = 0;
      let proyectosTotales = 0;
      let hitosRegistrados = 0;
      let tareasPendientes = 0;
      let archivosCargados = 0;

      // Usuarios Activos
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.data) {
        usuariosActivos = usersRes.value.data.data.length;
      }

      // Proyectos Totales
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data?.data) {
        proyectosTotales = projectsRes.value.data.data.length;
      }

      // Hitos Registrados
      if (hitosRes.status === 'fulfilled' && hitosRes.value.data?.data) {
        hitosRegistrados = hitosRes.value.data.data.length;
      }

      // Tareas Pendientes (no completadas)
      if (tasksRes.status === 'fulfilled' && tasksRes.value.data?.data) {
        const todasTareas = tasksRes.value.data.data;
        tareasPendientes = todasTareas.filter((tarea: any) => 
          tarea.estado !== 'completada' && tarea.estado !== 'completado'
        ).length;
      }

      // Archivos Cargados (iTracker + Tabulaciones + ABM estimado)
      let conteoItracker = 0;
      let conteoTabulaciones = 0;
      
      if (itrackerRes.status === 'fulfilled' && itrackerRes.value.data?.count) {
        conteoItracker = itrackerRes.value.data.count;
      }
      
      if (tabulacionesRes.status === 'fulfilled' && tabulacionesRes.value.data?.count) {
        conteoTabulaciones = tabulacionesRes.value.data.count;
      }
      
      // Estimación conservadora para archivos ABM
      const estimacionABM = Math.floor(conteoItracker * 0.3);
      archivosCargados = conteoItracker + conteoTabulaciones + estimacionABM;

      // 🎯 ACTUALIZAR ESTADO CON DATOS REALES
      setRealAdminStats([
        { 
          title: 'Usuarios Activos', 
          value: usuariosActivos, 
          icon: 'bi-people-fill', 
          color: '#3498db' 
        },
        { 
          title: 'Proyectos Totales', 
          value: proyectosTotales, 
          icon: 'bi-diagram-3-fill', 
          color: '#2ecc71' 
        },
        { 
          title: 'Hitos Registrados', 
          value: hitosRegistrados, 
          icon: 'bi-flag-fill', 
          color: '#f39c12' 
        },
        { 
          title: 'Tareas Pendientes', 
          value: tareasPendientes, 
          icon: 'bi-list-task', 
          color: '#e74c3c' 
        },
        { 
          title: 'Registros Cargados', 
          value: archivosCargados, 
          icon: 'bi-cloud-upload-fill', 
          color: '#9b59b6' 
        }
      ]);

      console.log('📊 Estadísticas administrativas cargadas:', {
        usuariosActivos,
        proyectosTotales,
        hitosRegistrados,
        tareasPendientes,
        archivosCargados
      });

    } catch (error) {
      console.error('Error cargando estadísticas administrativas:', error);
      
      // En caso de error, mantener valores por defecto
      setRealAdminStats([
        { title: 'Usuarios Activos', value: 0, icon: 'bi-people-fill', color: '#3498db' },
        { title: 'Proyectos Totales', value: 0, icon: 'bi-diagram-3-fill', color: '#2ecc71' },
        { title: 'Hitos Registrados', value: 0, icon: 'bi-flag-fill', color: '#f39c12' },
        { title: 'Tareas Pendientes', value: 0, icon: 'bi-list-task', color: '#e74c3c' },
        { title: 'Registros Cargados', value: 0, icon: 'bi-cloud-upload-fill', color: '#9b59b6' },
      ]);
    } finally {
      setLoadingStats(false);
    }
  };

  // 🔄 useEffect para cargar datos al montar el componente
  useEffect(() => {
    fetchAdminStats();
  }, []);

  // 🔄 Función para refrescar estadísticas
  const refreshStats = async (): Promise<void> => {
    await fetchAdminStats();
    
    Swal.fire({
      title: '¡Estadísticas actualizadas!',
      text: 'Los datos han sido recargados desde el servidor',
      icon: 'success',
      iconColor: '#339fff',
      timer: 1500,
      showConfirmButton: false,
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    });
  };

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

    Swal.fire({
      title: '¡Cambios guardados!',
      text: 'La configuración ha sido actualizada correctamente',
      icon: 'success',
      iconColor: '#339fff',
      timer: 1500,
      showConfirmButton: false,
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    });
  };

  const cancelChanges = (): void => {
    setLocalVisibility({ ...visibility });
    setIsDirty(false);
  };

  // Las funciones de dashboard ahora están en el componente SectionOrderManager
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

      const res = await axios.post(`${API_BASE_URL}/itracker/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = res.data?.data || res.data;
      const { total_insertados, total_duplicados } = responseData;

      setUploadMessage(`✔ Registros nuevos: ${total_insertados} | Repetidos: ${total_duplicados}`);

      // 🔄 Refrescar estadísticas después de subir archivo
      await fetchAdminStats();

      Swal.fire({
        title: '¡Archivo subido!',
        text: `Se procesaron ${total_insertados} registros nuevos y ${total_duplicados} repetidos.`,
        icon: 'success',
        iconColor: '#339fff',
        confirmButtonText: 'Entendido',
        background: isDarkMode ? '#343a40' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#212529'
      });
    } catch (err) {
      setUploadError('Error al subir el archivo. Verificá que sea un .xlsx válido.');
      console.error('Error de carga:', err);

      Swal.fire({
        title: 'Error',
        text: 'Error al subir el archivo. Verificá que sea un .xlsx válido.',
        icon: 'error',
        confirmButtonText: 'Intentar nuevamente',
        confirmButtonColor: '#3085d6',
        background: isDarkMode ? '#343a40' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#212529'
      });
    } finally {
      setUploading(false);
    }
  };

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

      const res = await axios.post(`${API_BASE_URL}/tabulaciones/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseData = res.data?.data || res.data;
      const { total_insertados, total_duplicados } = responseData;

      setUploadMessage(`✔ Registros nuevos: ${total_insertados} | Repetidos: ${total_duplicados}`);

      // 🔄 Refrescar estadísticas después de subir archivo
      await fetchAdminStats();

      Swal.fire({
        title: '¡Archivo subido!',
        text: `Se procesaron ${total_insertados} registros nuevos y ${total_duplicados} repetidos.`,
        icon: 'success',
        iconColor: '#339fff',
        confirmButtonText: 'Entendido',
        background: isDarkMode ? '#343a40' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#212529'
      });
    } catch (err) {
      setUploadError('Error al subir el archivo. Verificá que sea un .xlsx válido.');
      console.error('Error de carga:', err);

      Swal.fire({
        title: 'Error',
        text: 'Error al subir el archivo. Verificá que sea un .xlsx válido.',
        icon: 'error',
        confirmButtonText: 'Intentar nuevamente',
        confirmButtonColor: '#3085d6',
        background: isDarkMode ? '#343a40' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#212529'
      });
    } finally {
      setUploading(false);
    }
  };

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

  const handleAbmUploadSuccess = () => {
    console.log('Carga de archivo ABM exitosa');
    // 🔄 Refrescar estadísticas después de subir archivo ABM
    fetchAdminStats();
  };

  return (
    <div
      className="d-flex flex-column"
      style={{
        minHeight: '100vh',
        backgroundColor: themeColors.background,
        color: themeColors.textPrimary
      }}
    >
      <Container fluid className="py-4 px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center mb-1">
              <img
                src={isDarkMode ? "logoxside.png" : "logoxside22.png"}
                alt="icono"
                style={{ width: '32px', height: '32px', marginRight: '10px' }}
              />
              <h2 className="mb-0 fw-bold" style={{ color: themeColors.textPrimary }}>
                Panel de Administración
              </h2>
            </div>
            <p className="mb-0" style={{ color: themeColors.textMuted }}>
              Configura el comportamiento y apariencia del sistema
            </p>
          </div>

          <div className="d-flex">
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

        {/* 🎯 SECCIÓN DE KPIs CON DATOS REALES */}
        <Row className="g-4 mb-4">
          {/* 🔄 Botón para refrescar estadísticas */}
          <Col xs={12} className="mb-2">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0" style={{ color: themeColors.textMuted }}>
                Estadísticas del Sistema
              </h6>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={refreshStats}
                disabled={loadingStats}
                className="shadow-sm"
              >
                {loadingStats ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Actualizar
                  </>
                )}
              </Button>
            </div>
          </Col>
          
          {realAdminStats.map((stat, index) => (
            <Col md={6} lg={Math.floor(12 / realAdminStats.length)} key={index}>
              <Card 
                className="border-0 shadow-sm h-100"
                style={{ backgroundColor: themeColors.cardBackground }}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1" style={{ color: themeColors.textMuted }}>
                        {stat.title}
                      </h6>
                      <h2 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
                        {loadingStats ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          stat.value.toLocaleString()
                        )}
                      </h2>
                    </div>
                    <div className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: `${stat.color}20`,
                        width: '3.5rem',
                        height: '3.5rem',
                        padding: 0
                      }}>
                      <i className={`bi ${stat.icon} fs-3`} style={{ color: stat.color }} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Card 
          className="mb-4 border-0 shadow-sm"
          style={{ backgroundColor: themeColors.cardBackground }}
        >
          <Card.Header 
            className="py-3"
            style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
          >
            <h5 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
              <i className="bi bi-layout-sidebar me-2 text-primary"></i>
              Menú lateral (Sidebar)
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <div className="pb-2 d-flex align-items-center">
                  <h6 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
                    <i className="bi bi-eye me-2 text-primary"></i>
                    Vista previa
                  </h6>
                </div>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <div 
                      className="sidebar-preview" 
                      style={{ 
                        backgroundColor: themeColors.sidebarBg,
                        borderRadius: '8px', 
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        className="sidebar-header p-3 d-flex align-items-center" 
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div className="d-flex align-items-center">
                          <img src="/logoxside.png" alt="Logo" height="24" className="me-2" />
                          <h6 className="mb-0" style={{ color: themeColors.sidebarText }}>
                            TASK manager
                          </h6>
                        </div>
                        <Button variant="link" className="ms-auto p-0" style={{ color: themeColors.sidebarText }}>
                          <i className="bi bi-chevron-left"></i>
                        </Button>
                      </div>
                      <div className="sidebar-body py-2" style={{ fontSize: '0.85rem' }}>
                        {sidebarItemsMeta.map(item => (
                          localVisibility[item.id] !== false && (
                            <div 
                              key={item.id} 
                              className="sidebar-item d-flex align-items-center px-3 py-1"
                              style={{ color: themeColors.sidebarText }}
                            >
                              <i className={`bi ${item.icon} me-2`}></i>
                              <span>{item.label}</span>
                            </div>
                          )
                        ))}
                        <div className="mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <div 
                            className="sidebar-item d-flex align-items-center px-3 py-1 mt-2"
                            style={{ color: themeColors.sidebarText }}
                          >
                            <i className="bi bi-box-arrow-right me-2"></i>
                            <span>Cerrar sesión</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-3">
                      <small style={{ color: themeColors.textMuted }}>
                        {isDirty ?
                          "Las modificaciones solo se aplicarán al guardar los cambios" :
                          "El sidebar se muestra como está actualmente configurado"}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={9}>
                <div className="pb-2 d-flex align-items-center">
                  <h6 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
                    <i className="bi bi-toggles me-2 text-primary"></i>
                    Opciones de visibilidad
                  </h6>
                </div>
                <Row>
                  {sidebarItemsMeta.map(item => (
                    <Col xs={12} md={6} lg={4} key={item.id} className="mb-3">
                      <Card 
                        className="border shadow-sm h-100"
                        style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                style={{
                                  backgroundColor: `${item.color}20`,
                                  width: '2.5rem',
                                  height: '2.5rem',
                                  padding: 0
                                }}
                              >
                                <i
                                  className={`bi ${item.icon}`}
                                  style={{ color: item.color, fontSize: '1rem' }}
                                ></i>
                              </div>
                              <span className="fw-medium" style={{ color: themeColors.textPrimary }}>
                                {item.label}
                              </span>
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

        {/* 🆕 NUEVO COMPONENTE: Panel de Configuraciones Globales */}
        <GlobalConfigurationPanel isDarkMode={isDarkMode} />

        {/* 🆕 NUEVO COMPONENTE: Gestor de Orden y Visibilidad de Secciones */}
        <SectionOrderManager isDarkMode={isDarkMode} />

        {/* 🆕 NUEVA SECCIÓN: Configuración de KPIs del Dashboard */}
        <KpiAdminSection isDarkMode={isDarkMode} />

        <Card 
          className="mb-4 border-0 shadow-sm"
          style={{ backgroundColor: themeColors.cardBackground }}
        >
          <Card.Header 
            className="py-3"
            style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
          >
            <h5 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
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
                      style={{
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
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
                      onClick={() => navigate('/admin/roles')}
                      style={{
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-shield-check fs-3 text-warning"></i>
                      </div>
                      <span className="fw-medium">Gestión de Roles</span>
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              
              {/* 🔑 NUEVAS TARJETAS PARA GESTIÓN DE PERMISOS */}
              <Col md={4} className="mb-3">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <Button
                      variant="light"
                      className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0"
                      onClick={() => navigate('/admin/permissions')}
                      style={{
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-key-fill fs-3 text-info"></i>
                      </div>
                      <span className="fw-medium">Gestión de Permisos</span>
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
                      onClick={() => navigate('/admin/permissions/matrix')}
                      style={{
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-grid-3x3-gap-fill fs-3 text-success"></i>
                      </div>
                      <span className="fw-medium">Matriz de Permisos</span>
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
                      style={{
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
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
                      style={{
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-grid-3x3-gap fs-3 text-info"></i>
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
                      style={{
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-cloud-upload-fill fs-3 text-danger"></i>
                      </div>
                      <span className="fw-medium">Subir archivos ABM PIC & Social</span>
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} className="mb-3">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <Button
                      variant="light"
                      className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0 position-relative"
                      onClick={() => navigate('/admin/gestion-guardias')}
                      style={{
                        borderLeft: '4px solid #0d6efd',
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          backgroundColor: '#0d6efd20',
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-shield-check fs-3" style={{ color: '#0d6efd' }}></i>
                      </div>
                      <span className="fw-medium" style={{ color: '000' }}>Gestión Integral de Guardias</span>
                      <Badge
                        className="mt-2"
                        style={{
                          backgroundColor: '#0d6efd',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      >
                        <i className="bi bi-star-fill me-1"></i>
                        Nuevo Sistema Unificado
                      </Badge>
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge
                          className="rounded-pill"
                          style={{
                            backgroundColor: '#198754',
                            color: 'white'
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>
                        </Badge>
                      </div>
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4} className="mb-3">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <Button
                      variant="light"
                      className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0 position-relative"
                      onClick={() => navigate('/admin/announcements')}
                      style={{
                        borderLeft: '4px solid #ff6b35',
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          backgroundColor: '#ff6b3520',
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-megaphone-fill fs-3" style={{ color: '#ff6b35' }}></i>
                      </div>
                      <span className="fw-medium" style={{ color: '000' }}>Gestión de Anuncios</span>
                      <Badge
                        className="mt-2"
                        style={{
                          backgroundColor: '#ff6b35',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      >
                        <i className="bi bi-broadcast me-1"></i>
                        Sistema Dinámico
                      </Badge>
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge
                          className="rounded-pill"
                          style={{
                            backgroundColor: '#20c997',
                            color: 'white'
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>
                        </Badge>
                      </div>
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4} className="mb-3">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <Button
                      variant="light"
                      className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-4 border-0 position-relative"
                      onClick={() => navigate('/admin/diagnostics')}
                      style={{
                        borderLeft: '4px solid #28a745',
                        backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
                        color: themeColors.textPrimary
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          backgroundColor: '#28a74520',
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i className="bi bi-activity fs-3" style={{ color: '#28a745' }}></i>
                      </div>
                      <span className="fw-medium" style={{ color: '000' }}>Panel de Diagnósticos</span>
                      <Badge
                        className="mt-2"
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      >
                        <i className="bi bi-shield-check me-1"></i>
                        Sistema de Monitoreo
                      </Badge>
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge
                          className="rounded-pill"
                          style={{
                            backgroundColor: '#17a2b8',
                            color: 'white'
                          }}
                        >
                          <i className="bi bi-gear-fill"></i>
                        </Badge>
                      </div>
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
                      style={{
                        backgroundColor: isDarkMode ? '#343a40' : '#f8f9fa',
                        color: isDarkMode ? '#6c757d' : '#495057'
                      }}
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
                      style={{
                        backgroundColor: isDarkMode ? '#343a40' : '#f8f9fa',
                        color: isDarkMode ? '#6c757d' : '#495057'
                      }}
                    >
                      <div className="bg-dark bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '3.5rem',
                          height: '3.5rem',
                          padding: 0
                        }}>
                        <i 
                          className="bi bi-journal-text fs-3" 
                          style={{ color: isDarkMode ? '#adb5bd' : '#495057' }}
                        ></i>
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
        
        {/* MODALES */}
        <Modal
          show={showItrackerModal}
          onHide={resetItrackerModal}
          centered
        >
          <Modal.Header 
            closeButton 
            className="border-0 pb-0"
            style={{ 
              backgroundColor: themeColors.cardBackground,
              color: themeColors.textPrimary
            }}
          >
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
          <Modal.Body style={{ backgroundColor: themeColors.cardBackground }}>
            <Form ref={itrackerFormRef} onSubmit={handleItrackerUpload}>
              <Form.Group controlId="formItrackerFile" className="mb-3">
                <Form.Label style={{ color: themeColors.textPrimary }}>
                  Archivo Excel (.xlsx)
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".xlsx"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = e.target.files;
                    setItrackerFile(files?.[0] || null);
                    setUploadMessage('');
                    setUploadError('');
                  }}
                  style={{
                    backgroundColor: isDarkMode ? '#495057' : '#ffffff',
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary
                  }}
                />
                <Form.Text style={{ color: themeColors.textMuted }}>
                  Selecciona el archivo de reporte iTracker para procesar.
                </Form.Text>
              </Form.Group>

              {uploadMessage && <Alert variant="success" className="mt-3">{uploadMessage}</Alert>}
              {uploadError && <Alert variant="danger" className="mt-3">{uploadError}</Alert>}
            </Form>
          </Modal.Body>
          <Modal.Footer 
            className="border-0 pt-0"
            style={{ backgroundColor: themeColors.cardBackground }}
          >
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

        <Modal
          show={showTabulacionesModal}
          onHide={resetTabulacionesModal}
          centered
        >
          <Modal.Header 
            closeButton 
            className="border-0 pb-0"
            style={{ 
              backgroundColor: themeColors.cardBackground,
              color: themeColors.textPrimary
            }}
          >
            <Modal.Title className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  padding: 0
                }}>
                <i className="bi bi-grid-3x3-gap text-info"></i>
              </div>
              Carga de Tabulaciones
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: themeColors.cardBackground }}>
            <Form ref={tabulacionesFormRef} onSubmit={handleTabulacionesUpload}>
              <Form.Group controlId="formTabulacionesFile" className="mb-3">
                <Form.Label style={{ color: themeColors.textPrimary }}>
                  Archivo Excel (.xlsx) con la hoja "Tareas"
                </Form.Label>
                <Form.Control
                  type="file"
                  accept=".xlsx"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = e.target.files;
                    setTabulacionesFile(files?.[0] || null);
                    setUploadMessage('');
                    setUploadError('');
                  }}
                  style={{
                    backgroundColor: isDarkMode ? '#495057' : '#ffffff',
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary
                  }}
                />
                <Form.Text style={{ color: themeColors.textMuted }}>
                  Selecciona el archivo de tabulaciones para procesar.
                </Form.Text>
              </Form.Group>

              {uploadMessage && <Alert variant="success" className="mt-3">{uploadMessage}</Alert>}
              {uploadError && <Alert variant="danger" className="mt-3">{uploadError}</Alert>}
            </Form>
          </Modal.Body>
          <Modal.Footer 
            className="border-0 pt-0"
            style={{ backgroundColor: themeColors.cardBackground }}
          >
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

        <AbmUploadModal
          show={showAbmUploadModal}
          onHide={() => setShowAbmUploadModal(false)}
          onSuccess={handleAbmUploadSuccess}
        />

        <ThemedFooter />
      </Container>
    </div>
  );
};

export default AdminPanel;