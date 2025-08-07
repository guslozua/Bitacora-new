// src/pages/AnnouncementsAdminPage.tsx
// 🔐 COMPONENTE CON CONTROL DE PERMISOS APLICADO
// - Ver dashboard: ANNOUNCEMENT_PERMISSIONS.VIEW_ANNOUNCEMENTS
// - Crear anuncio: ANNOUNCEMENT_PERMISSIONS.CREATE_ANNOUNCEMENTS
// - Ver estadísticas: ANNOUNCEMENT_PERMISSIONS.MANAGE_ANNOUNCEMENT_STATS

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import ThemedFooter from '../components/ThemedFooter';
import ThemeToggleButton from '../components/ThemeToggleButton';
import RefreshIconButton from '../components/RefreshIconButton';
import AnnouncementsList from '../components/AnnouncementsAdmin/AnnouncementsList';
import AnnouncementForm from '../components/AnnouncementsAdmin/AnnouncementForm';
import AnnouncementsStats from '../components/AnnouncementsAdmin/AnnouncementsStats';
import AnnouncementPreview from '../components/AnnouncementsAdmin/AnnouncementPreview';
import announcementsService, { Announcement } from '../services/announcementsService';
import { getUserName, logout } from '../services/authService';

// 🔐 NUEVOS IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { ANNOUNCEMENT_PERMISSIONS } from '../utils/permissions';

// Tipos para las estadísticas - deben coincidir con el componente AnnouncementsStats
interface AnnouncementStatsData {
  general: {
    total_announcements: number;
    active_announcements: number;
    inactive_announcements: number;
    scheduled_announcements: number;
    expired_announcements: number;
    total_views: number;
    total_clicks: number;
    avg_views_per_announcement: number;
    last_created_at: string | null;
  };
  byType: Array<{
    type: string;
    total: number;
    active: number;
    total_views: number;
    total_clicks: number;
    avg_views: number;
  }>;
}

const AnnouncementsAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  // Estados para datos
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStatsData | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Configuración de layout
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  // 🔐 TODOS LOS HOOKS AL INICIO (evitar llamadas condicionales)
  
  // Cargar datos inicial
  useEffect(() => {
    if (hasPermission(ANNOUNCEMENT_PERMISSIONS.VIEW_ANNOUNCEMENTS)) {
      loadData();
    }
  }, [hasPermission]);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // 🔐 VERIFICAR ACCESO AL DASHBOARD DE ANUNCIOS
  if (!permissionsLoading && !hasPermission(ANNOUNCEMENT_PERMISSIONS.VIEW_ANNOUNCEMENTS)) {
    return (
      <div className="d-flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          toggle={toggleSidebar}
          onLogout={() => logout()}
        />
        
        <div style={contentStyle}>
          <Container className="py-4">
            <Alert variant="danger" className="text-center">
              <div className="py-5">
                <i className="bi bi-megaphone-fill display-1 text-danger mb-3 d-block"></i>
                <h3>Acceso Denegado</h3>
                <p className="mb-0">No tienes permisos para acceder al módulo de anuncios.</p>
                <p className="small text-muted">Contacta al administrador si necesitas acceso a esta funcionalidad.</p>
              </div>
            </Alert>
          </Container>
          <ThemedFooter />
        </div>
      </div>
    );
  }

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar anuncios y estadísticas en paralelo
      const [announcementsResponse, statsResponse] = await Promise.all([
        announcementsService.getAllAnnouncements({ limit: 50 }),
        announcementsService.getStatistics()
      ]);
      
      if (announcementsResponse.success && announcementsResponse.data) {
        setAnnouncements(announcementsResponse.data);
      }
      
      if (statsResponse.success && statsResponse.data) {
        // Asegurar que los datos tengan la estructura correcta
        const responseData = statsResponse.data as any; // Usar any temporalmente para acceder a las propiedades
        const statsData: AnnouncementStatsData = {
          general: responseData.general || {
            total_announcements: 0,
            active_announcements: 0,
            inactive_announcements: 0,
            scheduled_announcements: 0,
            expired_announcements: 0,
            total_views: 0,
            total_clicks: 0,
            avg_views_per_announcement: 0,
            last_created_at: null
          },
          byType: responseData.byType || []
        };
        setStats(statsData);
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error al cargar datos');
      
      // Mostrar error con SweetAlert2 solo si es crítico
      Swal.fire({
        title: 'Error al cargar datos',
        text: err.message || 'Ocurrió un error al cargar los anuncios. Por favor, intente nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateNew = () => {
    setEditingAnnouncement(null);
    setSelectedAnnouncement(null);
    setShowForm(true);
    setActiveTab('form');
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setSelectedAnnouncement(announcement);
    setShowForm(true);
    setActiveTab('form');
  };

  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setActiveTab('preview');
  };

  const handleDelete = async (id: number) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;

    // Confirmar eliminación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Eliminar anuncio?',
      html: `
        <div class="text-start">
          <p><strong>Título:</strong> ${announcement.title}</p>
          <p><strong>Tipo:</strong> ${announcement.type}</p>
          <p class="text-danger mt-3"><i class="bi bi-exclamation-triangle me-2"></i><strong>Esta acción no se puede deshacer.</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await announcementsService.deleteAnnouncement(id);
      
      if (response.success) {
        // Mostrar éxito con SweetAlert2
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El anuncio ha sido eliminado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        await loadData();
        
        // Si estamos editando el anuncio eliminado, limpiar formulario
        if (editingAnnouncement?.id === id) {
          setEditingAnnouncement(null);
          setShowForm(false);
          setActiveTab('list');
        }
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Error al eliminar el anuncio',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, active: boolean) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;

    const actionText = active ? 'activar' : 'desactivar';
    const statusText = active ? 'activo' : 'inactivo';

    // Confirmar cambio de estado con SweetAlert2
    const result = await Swal.fire({
      title: `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} anuncio?`,
      html: `
        <div class="text-start">
          <p><strong>Título:</strong> ${announcement.title}</p>
          <p><strong>Estado actual:</strong> 
            <span class="badge bg-${announcement.active ? 'success' : 'secondary'}">${announcement.active ? 'Activo' : 'Inactivo'}</span>
          </p>
          <p><strong>Nuevo estado:</strong> 
            <span class="badge bg-${active ? 'success' : 'secondary'}">${active ? 'Activo' : 'Inactivo'}</span>
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: active ? '#28a745' : '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await announcementsService.toggleAnnouncementStatus(id, active);
      
      if (response.success) {
        // Mostrar éxito con SweetAlert2
        Swal.fire({
          title: '¡Actualizado!',
          text: `Anuncio ${statusText} correctamente`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        await loadData();
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Error al cambiar el estado del anuncio',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleDuplicate = async (id: number) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;

    // Confirmar duplicación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Duplicar anuncio?',
      html: `
        <div class="text-start">
          <p><strong>Título original:</strong> ${announcement.title}</p>
          <p><strong>Nuevo título:</strong> ${announcement.title} (Copia)</p>
          <p class="text-info mt-3"><i class="bi bi-info-circle me-2"></i>El anuncio duplicado se creará como <strong>inactivo</strong>.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, duplicar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await announcementsService.duplicateAnnouncement(id);
      
      if (response.success) {
        // Mostrar éxito con SweetAlert2
        Swal.fire({
          title: '¡Duplicado!',
          text: 'El anuncio ha sido duplicado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        await loadData();
      }
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'Error al duplicar el anuncio',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = async (message: string) => {
    // Mostrar éxito con SweetAlert2
    Swal.fire({
      title: '¡Éxito!',
      text: message,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });

    setShowForm(false);
    setEditingAnnouncement(null);
    setActiveTab('list');
    await loadData();
  };

  const handleFormCancel = async () => {
    // Solo confirmar si estamos editando y puede haber cambios
    if (editingAnnouncement) {
      const result = await Swal.fire({
        title: '¿Descartar cambios?',
        text: '¿Está seguro que desea salir sin guardar los cambios?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Continuar editando'
      });

      if (!result.isConfirmed) return;
    }

    setShowForm(false);
    setEditingAnnouncement(null);
    setActiveTab('list');
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Está seguro que desea cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container className="py-4 px-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <h2 className="mb-0 fw-bold">
                <i className="bi bi-megaphone me-2 text-primary"></i>
                Gestión de Anuncios
              </h2>
            </div>
            <div className="d-flex gap-3 align-items-center">
              <ThemeToggleButton size="md" />
              <RefreshIconButton 
                onClick={handleRefresh}
                loading={refreshing}
                size="md"
              />
              
              {/* 🔐 BOTÓN NUEVO ANUNCIO - Solo con permiso de crear */}
              <PermissionGate 
                permission={ANNOUNCEMENT_PERMISSIONS.CREATE_ANNOUNCEMENTS}
                fallback={
                  <Button 
                    variant="outline-secondary" 
                    disabled
                    title="No tienes permisos para crear anuncios"
                  >
                    <i className="bi bi-lock me-2"></i>
                    Sin permisos
                  </Button>
                }
              >
                <Button 
                  variant="primary" 
                  onClick={handleCreateNew}
                  disabled={loading || permissionsLoading}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nuevo Anuncio
                </Button>
              </PermissionGate>
            </div>
          </div>

          {/* Alertas - Mantener para compatibilidad, pero SweetAlert2 será la principal */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              <Alert.Heading>Éxito</Alert.Heading>
              <p>{success}</p>
            </Alert>
          )}

          {/* 🔐 ESTADÍSTICAS RÁPIDAS - Solo con permiso de ver estadísticas */}
          <PermissionGate permission={ANNOUNCEMENT_PERMISSIONS.MANAGE_ANNOUNCEMENT_STATS}>
            {stats && (
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <Card className="shadow-sm border-0 themed-card h-100">
                    <Card.Body className="text-center">
                      <div className="text-primary mb-2">
                        <i className="bi bi-megaphone fs-1"></i>
                      </div>
                      <h3 className="fw-bold">{stats.general.total_announcements}</h3>
                      <p className="text-muted mb-0">Total Anuncios</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm border-0 themed-card h-100">
                    <Card.Body className="text-center">
                      <div className="text-success mb-2">
                        <i className="bi bi-check-circle fs-1"></i>
                      </div>
                      <h3 className="fw-bold">{stats.general.active_announcements}</h3>
                      <p className="text-muted mb-0">Activos</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm border-0 themed-card h-100">
                    <Card.Body className="text-center">
                      <div className="text-info mb-2">
                        <i className="bi bi-eye fs-1"></i>
                      </div>
                      <h3 className="fw-bold">{stats.general.total_views}</h3>
                      <p className="text-muted mb-0">Visualizaciones</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm border-0 themed-card h-100">
                    <Card.Body className="text-center">
                      <div className="text-warning mb-2">
                        <i className="bi bi-hand-index fs-1"></i>
                      </div>
                      <h3 className="fw-bold">{stats.general.total_clicks}</h3>
                      <p className="text-muted mb-0">Clics</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </PermissionGate>

          {/* Contenido principal con pestañas */}
          <Card className="shadow-sm border-0 themed-card">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'list')}
                className="mb-4"
              >
                <Tab eventKey="list" title={
                  <span>
                    <i className="bi bi-list-ul me-2"></i>
                    Lista de Anuncios
                  </span>
                }>
                  <AnnouncementsList
                    announcements={announcements}
                    loading={loading}
                    onEdit={handleEdit}
                    onView={handleView}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onDuplicate={handleDuplicate}
                    onRefresh={handleRefresh}
                  />
                </Tab>

                {showForm && (
                  <Tab eventKey="form" title={
                    <span>
                      <i className="bi bi-pencil-square me-2"></i>
                      {editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
                    </span>
                  }>
                    <AnnouncementForm
                      announcement={editingAnnouncement}
                      onSuccess={handleFormSuccess}
                      onCancel={handleFormCancel}
                    />
                  </Tab>
                )}

                {selectedAnnouncement && (
                  <Tab eventKey="preview" title={
                    <span>
                      <i className="bi bi-eye me-2"></i>
                      Vista Previa
                    </span>
                  }>
                    <AnnouncementPreview announcement={selectedAnnouncement} />
                  </Tab>
                )}

                {/* 🔐 PESTAÑA ESTADÍSTICAS - Solo con permiso */}
                {hasPermission(ANNOUNCEMENT_PERMISSIONS.MANAGE_ANNOUNCEMENT_STATS) && (
                  <Tab eventKey="stats" title={
                    <span>
                      <i className="bi bi-graph-up me-2"></i>
                      Estadísticas
                    </span>
                  }>
                    <AnnouncementsStats stats={stats} />
                  </Tab>
                )}
              </Tabs>
            </Card.Body>
          </Card>
        </Container>

        <ThemedFooter />
      </div>
    </div>
  );
};

export default AnnouncementsAdminPage;