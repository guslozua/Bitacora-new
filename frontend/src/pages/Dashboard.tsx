import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

import GanttChart from '../components/GanttChart';
import Sidebar from '../components/Sidebar';
import ThemedFooter from '../components/ThemedFooter';
import ThemedLogo from '../components/ThemedLogo';
import ThemeToggleButton from '../components/ThemeToggleButton';
import RefreshIconButton from '../components/RefreshIconButton';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import StatsCard from '../components/StatsCard';
import AnnouncementsCarousel from '../components/AnnouncementsCarousel/AnnouncementsCarousel';
import { fetchEvents } from '../services/EventService';
import { Event } from '../models/Event';
import CampanillaNot from '../components/notificaciones/CampanillaNot';
import { useTheme } from '../context/ThemeContext';
import KpiRow from '../components/KpiRow';
import { useDashboardKpiVisibility } from '../services/DashboardKpiVisibilityContext';
import { useDashboardSectionVisibility } from '../services/DashboardSectionVisibilityContext';
import { API_BASE_URL } from '../services/apiConfig';

// Importamos funciones del servicio de autenticación
import { getUserName, logout, getToken } from '../services/authService';

// 🔐 NUEVOS IMPORTS PARA EL SISTEMA DE PERMISOS
// NOTA: Implementamos permisos en CAPA ADICIONAL al sistema de visibilidad existente
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { 
  SYSTEM_PERMISSIONS, 
  PROJECT_PERMISSIONS, 
  TASK_PERMISSIONS, 
  REPORT_PERMISSIONS, 
  USER_PERMISSIONS 
} from '../utils/permissions';

// Función para calcular tiempo relativo en español
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  console.log('🕒 getTimeAgo - Ahora:', now, 'Fecha actividad:', date, 'Diferencia ms:', diffMs, 'Diferencia segundos:', diffSeconds);
  
  // Si la fecha es futura o muy reciente (menos de 5 segundos)
  if (diffMs < 5000) {
    return 'Ahora';
  } else if (diffSeconds < 60) {
    return `Hace ${diffSeconds} segundos`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? 'Hace 1 minuto' : `Hace ${diffMinutes} minutos`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // 🔐 HOOK PARA VERIFICAR PERMISOS (en capa adicional al sistema de visibilidad)
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [tareas, setTareas] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<Array<{texto: string, fecha: Date, tiempoRelativo: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [apiResponses, setApiResponses] = useState<any>({});
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [kpiRefreshTrigger, setKpiRefreshTrigger] = useState(0);

  // Obtenemos el token usando el servicio de autenticación
  const token = getToken();

  // Hook para KPIs
  const { getVisibleKpis } = useDashboardKpiVisibility();

  // Hook para secciones del Dashboard
  const { isSectionVisible, getSectionsInOrder } = useDashboardSectionVisibility();

  // Nombre a mostrar en el saludo (valor inicial desde el servicio de autenticación)
  const [nombreUsuario, setNombreUsuario] = useState<string>(getUserName());

  useEffect(() => {
    // Log para depuración
    console.log("Estado actual de nombreUsuario:", nombreUsuario);
  }, [nombreUsuario]);

  // Cargar eventos del calendario
  useEffect(() => {
    const loadCalendarEvents = async () => {
      try {
        setCalendarLoading(true);
        const events = await fetchEvents();
        setCalendarEvents(events);
      } catch (error) {
        console.error('Error al cargar eventos del calendario:', error);
      } finally {
        setCalendarLoading(false);
      }
    };

    loadCalendarEvents();
  }, []);

  // Manejar clic en fecha del calendario
  const handleDateClick = (date: Date) => {
    navigate(`/calendar?date=${date.toISOString()}`);
  };

  // Manejar clic en evento del calendario
  const handleEventClick = (event: Event) => {
    navigate(`/calendar/event/${event.id}`);
  };

  const chartData = [
    { nombre: 'Usuarios', cantidad: usuarios ?? 0 },
    { nombre: 'Tareas', cantidad: tareas ?? 0 },
    { nombre: 'Proyectos', cantidad: proyectos ?? 0 },
  ];

  // Nueva función para obtener el perfil del usuario con mejor manejo de errores
  const fetchUserProfile = async () => {
    if (!token) {
      console.log("No hay token, saltando fetchUserProfile");
      return;
    }

    setProfileError(null);

    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      console.log("Obteniendo perfil de usuario...");
      const response = await axios.get(`${API_BASE_URL}/users/profile`, config);
      console.log("Respuesta de perfil de usuario:", response.data);

      if (response.data && response.data.success && response.data.data) {
        const userData = response.data.data;
        if (userData.nombre) {
          console.log("Actualizando nombre de usuario a:", userData.nombre);
          setNombreUsuario(userData.nombre);
          setProfileInfo(userData);
        } else {
          console.warn("La respuesta no contiene el campo 'nombre':", userData);
          setProfileError("El perfil recibido no contiene nombre de usuario");
        }
      } else {
        console.warn("Respuesta vacía o con formato incorrecto del servidor:", response.data);
        setProfileError("Respuesta con formato inesperado del servidor");
      }
    } catch (error: any) {
      console.error("Error obteniendo perfil de usuario:", error.response || error);
      setProfileError(`Error obteniendo perfil: ${error.message}`);
    }
  };

  // Función para contar usuarios utilizando una API alternativa
  const fetchUserCount = async (config: any) => {
    try {
      console.log("Intentando obtener conteo de usuarios con ruta principal...");
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, config);
      console.log("Respuesta exitosa de /api/users:", usersResponse.data);

      if (usersResponse.data && usersResponse.data.success && Array.isArray(usersResponse.data.data)) {
        return {
          success: true,
          data: usersResponse.data.data,
          count: usersResponse.data.data.length,
          method: "users_list"
        };
      } else if (Array.isArray(usersResponse.data)) {
        return {
          success: true,
          data: usersResponse.data,
          count: usersResponse.data.length,
          method: "users_list_array"
        };
      } else {
        console.warn("Formato de respuesta inesperado:", usersResponse.data);
        return {
          success: true,
          data: usersResponse.data,
          count: 0,
          method: "unknown_format"
        };
      }
    } catch (error: any) {
      console.log("Error con ruta principal:", error.response?.status || error.message);

      try {
        console.log("Intentando obtener conteo con ruta alternativa...");
        const countResponse = await axios.get(`${API_BASE_URL}/users/count`, config);
        console.log("Respuesta exitosa de /api/users/count:", countResponse.data);
        return {
          success: true,
          data: null,
          count: countResponse.data.count || 0,
          method: "count_api"
        };
      } catch (secondError: any) {
        console.error("Error también con ruta alternativa:", secondError.response || secondError);
        console.warn("Usando valor predeterminado para conteo de usuarios");
        return {
          success: false,
          data: null,
          count: 0,
          error: secondError,
          method: "fallback"
        };
      }
    }
  };

  useEffect(() => {
    console.log("Iniciando carga de perfil de usuario y datos del dashboard");
    fetchUserProfile();

    const fetchData = async () => {
      setError(null);

      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
          },
        };

        const fetchSafely = async (url: string, label: string) => {
          try {
            const response = await axios.get(url, config);
            console.log(`Respuesta de ${label}:`, response.data);
            return response;
          } catch (err: any) {
            console.error(`Error obteniendo ${label}:`, err.response || err);
            return { data: null, error: err };
          }
        };

        const [tasksRes, projectsRes] = await Promise.all([
          fetchSafely(`${API_BASE_URL}/tasks`, 'tareas'),
          fetchSafely(`${API_BASE_URL}/projects`, 'proyectos'),
        ]);

        const usersRes = await fetchUserCount(config);
        console.log("Resultado final de conteo de usuarios:", usersRes);

        setApiResponses({
          users: usersRes,
          tasks: tasksRes.data,
          projects: projectsRes.data,
          profile: profileInfo
        });

        let userCount = usersRes.count || 0;
        console.log("Estableciendo conteo de usuarios:", userCount);
        setUsuarios(userCount);

        let taskCount = 0;
        let taskData: any[] = [];
        if (tasksRes.data) {
          if (Array.isArray(tasksRes.data)) {
            taskCount = tasksRes.data.length;
            taskData = tasksRes.data;
          } else if (tasksRes.data.data && Array.isArray(tasksRes.data.data)) {
            taskCount = tasksRes.data.data.length;
            taskData = tasksRes.data.data;
          } else if (tasksRes.data.success && tasksRes.data.data && Array.isArray(tasksRes.data.data)) {
            taskCount = tasksRes.data.data.length;
            taskData = tasksRes.data.data;
          }
        }
        setTareas(taskCount);

        let projectCount = 0;
        let projectData: any[] = [];
        if (projectsRes.data) {
          if (Array.isArray(projectsRes.data)) {
            projectCount = projectsRes.data.length;
            projectData = projectsRes.data;
          } else if (projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
            projectCount = projectsRes.data.data.length;
            projectData = projectsRes.data.data;
          } else if (projectsRes.data.success && projectsRes.data.data && Array.isArray(projectsRes.data.data)) {
            projectCount = projectsRes.data.data.length;
            projectData = projectsRes.data.data;
          }
        }
        setProyectos(projectCount);

        const actividad: Array<{texto: string, fecha: Date}> = [];

        const proyectosRecientes = projectData.slice(-3).reverse();
        proyectosRecientes.forEach((p: any) => {
          if (p && p.nombre) {
            const fechaCreacion = p.fecha_inicio || new Date();
            actividad.push({
              texto: `📁 Nuevo proyecto creado: ${p.nombre}`,
              fecha: new Date(fechaCreacion)
            });
          }
        });

        const tareasRecientes = taskData.slice(-3).reverse();
        tareasRecientes.forEach((t: any) => {
          if (t && t.titulo) {
            const fechaCreacion = t.fecha_inicio || new Date();
            actividad.push({
              texto: `📝 Nueva tarea: ${t.titulo}`,
              fecha: new Date(fechaCreacion)
            });
          } else if (t && t.nombre) {
            const fechaCreacion = t.fecha_inicio || new Date();
            actividad.push({
              texto: `📝 Nueva tarea: ${t.nombre}`,
              fecha: new Date(fechaCreacion)
            });
          }
        });

        const eventosRecientes = calendarEvents
          .filter(e => {
            const esFeriado = e.type === 'holiday' || e.title.toLowerCase().includes('feriado');
            const esCumple = e.type === 'birthday' || e.title.toLowerCase().includes('cumple');
            const esGuardia = e.type === 'guardia' || e.title.toLowerCase().includes('guardia');
            const esConectividad = e.type === 'gconect' || e.title.toLowerCase().includes('conectividad');
            const esVacaciones = e.type === 'vacation' || e.title.toLowerCase().includes('vacacion');
            const esFuturo = new Date(e.start) > new Date();
            
            return !esFeriado && !esCumple && !esGuardia && !esConectividad && !esVacaciones && !esFuturo;
          })
          .slice(-3).reverse();
          
        eventosRecientes.forEach((e: Event) => {
          if (e && e.title) {
            const tipoEvento = e.type === 'task' ? '📝 Tarea' : '📅 Evento';
            const fechaEvento = e.start ? new Date(e.start) : new Date();
            actividad.push({
              texto: `${tipoEvento}: ${e.title}`,
              fecha: fechaEvento
            });
          }
        });

        const actividadOrdenada = actividad
          .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
          .map(item => {
            const tiempoRelativo = getTimeAgo(item.fecha);
            return {
              texto: item.texto,
              fecha: item.fecha,
              tiempoRelativo: tiempoRelativo
            };
          });

        if (actividadOrdenada.length === 0 && (projectCount > 0 || taskCount > 0)) {
          actividadOrdenada.push({
            texto: 'No se pudieron cargar detalles de actividad reciente',
            fecha: new Date(),
            tiempoRelativo: 'Ahora'
          });
        }

        setActividadReciente(actividadOrdenada);

        if (userCount === 0 && taskCount === 0 && projectCount === 0) {
          setError('No se encontraron datos para mostrar. Puede ser un problema de permisos o conexión.');
        }

      } catch (error: any) {
        console.error('Error cargando datos del dashboard:', error);
        setError(`Error cargando datos: ${error.message || 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, calendarEvents]);

  // Función para obtener la clase básica según el tipo de evento
  const getBadgeClassForEventType = (type: string): string => {
    switch (type) {
      case 'holiday':
        return 'bg-danger';
      case 'task':
        return 'bg-primary';
      case 'event':
        return 'bg-success';
      default:
        return 'text-white';
    }
  };

  // Función para obtener el estilo según el tipo de evento
  const getStyleForEventType = (type: string): React.CSSProperties => {
    switch (type) {
      case 'holiday':
      case 'task':
      case 'event':
        return {};
      case 'birthday':
        return { backgroundColor: '#ff9800' };
      case 'dayoff':
        return { backgroundColor: '#4caf50' };
      case 'gconect':
        return { backgroundColor: '#00bcd4' };
      case 'vacation':
        return { backgroundColor: '#9e9e9e' };
      case 'guardia':
        return { backgroundColor: '#9c27b0' };
      default:
        return { backgroundColor: '#6c757d' };
    }
  };

  // Función para obtener el texto del tipo de evento
  const getEventTypeText = (type: string): string => {
    switch (type) {
      case 'holiday':
        return 'Feriado';
      case 'task':
        return 'Tarea';
      case 'event':
        return 'Evento';
      case 'birthday':
        return 'Cumpleaños';
      case 'dayoff':
        return 'Día a Favor';
      case 'gconect':
        return 'G. Conectividad';
      case 'vacation':
        return 'Vacaciones';
      case 'guardia':
        return 'Guardia';
      default:
        return type;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleDataInfo = () => {
    setShowDataInfo(!showDataInfo);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setKpiRefreshTrigger(prev => prev + 1);
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // 🔐 FUNCIÓN AUXILIAR: Verificar permisos por sección (CAPA ADICIONAL)
  // RESPETA el sistema de visibilidad existente - solo agrega permisos como filtro adicional
  const hasPermissionForSection = (sectionId: string): boolean => {
    switch (sectionId) {
      case 'kpis-sistema':
        return hasPermission(REPORT_PERMISSIONS.VIEW_REPORTS);
      case 'actividad-reciente':
        return hasPermission(REPORT_PERMISSIONS.VIEW_REPORTS);
      case 'reportes-rapidos':
        return hasPermission(REPORT_PERMISSIONS.VIEW_REPORTS);
      case 'resumen-sistema':
        return hasPermission(USER_PERMISSIONS.VIEW_USERS);
      case 'cronograma-proyectos':
        return hasPermission(PROJECT_PERMISSIONS.VIEW_ALL_PROJECTS);
      case 'acciones-rapidas':
        // Esta sección tiene botones individuales con permisos propios
        return true;
      // Secciones sin restricciones de permisos (accesibles para todos)
      case 'calendario':
      case 'anuncios':
      case 'proximos-eventos':
        return true;
      default:
        return true;
    }
  };

  // FUNCIÓN AUXILIAR: Renderizar componente de sección individual
  const renderSectionComponent = (sectionId: string): JSX.Element | null => {
    switch (sectionId) {
      case 'kpis-sistema':
        return (
          <PermissionGate 
            permission={REPORT_PERMISSIONS.VIEW_REPORTS}
            fallback={
              <Card className="shadow-sm border-0 themed-card">
                <Card.Body className="text-center py-4">
                  <i className="bi bi-bar-chart fs-1 text-muted mb-3 d-block"></i>
                  <h6 className="text-muted">KPIs del Sistema</h6>
                  <p className="text-muted small">No tienes permisos para ver las estadísticas del sistema</p>
                </Card.Body>
              </Card>
            }
          >
            <div className="mb-4">
              <KpiRow 
                title="Indicadores del Sistema"
                subtitle="Métricas clave y estadísticas del sistema"
                refreshTrigger={kpiRefreshTrigger}
                onRefreshComplete={() => console.log('KPIs refreshed')}
              />
            </div>
          </PermissionGate>
        );

      case 'actividad-reciente':
        return (
          <PermissionGate 
            permission={REPORT_PERMISSIONS.VIEW_REPORTS}
            fallback={
              <Card className="shadow-sm h-100 border-0 themed-card">
                <Card.Body className="text-center py-4">
                  <i className="bi bi-activity fs-1 text-muted mb-3 d-block"></i>
                  <h6 className="text-muted">Actividad Reciente</h6>
                  <p className="text-muted small">No tienes permisos para ver la actividad del sistema</p>
                </Card.Body>
              </Card>
            }
          >
            <Card className="shadow-sm h-100 border-0 themed-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Actividad Reciente</h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate('/activity')}
                  >
                    Ver todo
                  </Button>
                </div>
                <ListGroup variant="flush">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <ListGroup.Item key={idx} className="themed-bg-secondary">
                        <div className="placeholder-glow">
                          <span className="placeholder col-8"></span>
                        </div>
                      </ListGroup.Item>
                    ))
                  ) : actividadReciente.length === 0 ? (
                    <ListGroup.Item className="themed-bg-secondary text-center py-4">
                      <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                      <span className="text-muted">No hay actividad reciente</span>
                    </ListGroup.Item>
                  ) : (
                    actividadReciente.slice(0, 5).map((item, idx) => (
                      <ListGroup.Item 
                        key={idx} 
                        className="themed-bg-secondary d-flex align-items-center"
                        action
                      >
                        <div className="me-3">
                          <div 
                            className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '2rem', height: '2rem' }}
                          >
                            <i className={`${item.texto.includes('proyecto') ? 'bi bi-folder' : 'bi bi-check-circle'} text-primary`}></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-medium">{item.texto}</div>
                          <small className="text-muted">{item.tiempoRelativo}</small>
                        </div>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </PermissionGate>
        );

      case 'calendario':
        return (
          <Card className="shadow-sm h-100 border-0 themed-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Calendario</h5>
                <Button
                  variant="link"
                  className="p-0 text-decoration-none"
                  onClick={() => navigate('/calendar')}
                >
                  Ver completo
                </Button>
              </div>
              {calendarLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                  <p className="text-muted mt-2 small">Cargando calendario...</p>
                </div>
              ) : (
                <MiniCalendar
                  events={calendarEvents}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                  showHeader={false}
                />
              )}
            </Card.Body>
          </Card>
        );

      case 'anuncios':
        return <AnnouncementsCarousel />;

      case 'reportes-rapidos':
        return (
          <PermissionGate 
            permission={REPORT_PERMISSIONS.VIEW_REPORTS}
            fallback={
              <Card className="shadow-sm h-100 border-0 themed-card">
                <Card.Body className="text-center py-4">
                  <i className="bi bi-graph-up fs-1 text-muted mb-3 d-block"></i>
                  <h6 className="text-muted">Reportes Rápidos</h6>
                  <p className="text-muted small">No tienes permisos para ver los reportes del sistema</p>
                </Card.Body>
              </Card>
            }
          >
            <Card className="shadow-sm h-100 border-0 themed-card">
              <Card.Body>
                <h5 className="fw-bold mb-3">Reportes Rápidos</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    barCategoryGap={20}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={isDarkMode ? "#495057" : "#f0f0f0"} 
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
                        border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
                        color: isDarkMode ? '#ffffff' : '#212529'
                      }}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="nombre"
                      type="category"
                      width={100}
                      tick={{ 
                        fontWeight: 'bold',
                        fill: isDarkMode ? '#ffffff' : '#212529'
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar dataKey="cantidad">
                      <Cell fill="#FA8072" />
                      <Cell fill="#7B8EFA" />
                      <Cell fill="#ff0080" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </PermissionGate>
        );

      case 'proximos-eventos':
        return (
          <Card className="shadow-sm h-100 border-0 themed-card">
            <Card.Body>
              <h5 className="fw-bold mb-3">Próximos Eventos</h5>
              <ListGroup variant="flush">
                {calendarEvents.length === 0 ? (
                  <ListGroup.Item className="themed-bg-secondary text-center py-4">
                    <i className="bi bi-calendar-x fs-1 text-muted d-block mb-2"></i>
                    <span className="text-muted">No hay eventos próximos</span>
                  </ListGroup.Item>
                ) : (
                  calendarEvents
                    .filter(event => new Date(event.start) >= new Date())
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .slice(0, 5)
                    .map((event, idx) => (
                      <ListGroup.Item
                        key={idx}
                        className="themed-bg-secondary"
                        action
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <span
                              className={`badge me-3 ${getBadgeClassForEventType(event.type)}`}
                              style={getStyleForEventType(event.type)}
                            >
                              {getEventTypeText(event.type)}
                            </span>
                            <div>
                              <div className="fw-medium">{event.title}</div>
                              <small className="text-muted">
                                {new Date(event.start).toLocaleDateString('es-AR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </small>
                            </div>
                          </div>
                          <i className="bi bi-chevron-right text-muted"></i>
                        </div>
                      </ListGroup.Item>
                    ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        );

      case 'acciones-rapidas':
        return (
          <Card className="shadow-sm h-100 border-0 themed-card">
            <Card.Body>
              <h5 className="fw-bold mb-3">Acciones Rápidas</h5>
              <div className="d-grid gap-2">
                {/* 🔐 NUEVO PROYECTO - Solo con permiso de crear proyectos */}
                <PermissionGate permission={PROJECT_PERMISSIONS.CREATE_PROJECT}>
                  <Button
                    variant="primary"
                    className="d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/projects')}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Nuevo Proyecto
                  </Button>
                </PermissionGate>
                
                {/* 🔐 NUEVA TAREA - Solo con permiso de crear tareas */}
                <PermissionGate permission={TASK_PERMISSIONS.CREATE_TASK}>
                  <Button
                    variant="success"
                    className="d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/projects')}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Nueva Tarea
                  </Button>
                </PermissionGate>
                
                {/* 🔐 NUEVO EVENTO - Disponible para todos los usuarios autenticados */}
                <Button
                  variant="info"
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => navigate('/calendar/admin')}
                >
                  <i className="bi bi-calendar-plus me-2"></i>
                  Nuevo Evento
                </Button>
              </div>
            </Card.Body>
          </Card>
        );

      case 'resumen-sistema':
        return (
          <PermissionGate 
            permission={USER_PERMISSIONS.VIEW_USERS}
            fallback={
              <Card className="shadow-sm h-100 border-0 themed-card">
                <Card.Body className="text-center py-4">
                  <i className="bi bi-pie-chart fs-1 text-muted mb-3 d-block"></i>
                  <h6 className="text-muted">Resumen del Sistema</h6>
                  <p className="text-muted small">No tienes permisos para ver las estadísticas del sistema</p>
                </Card.Body>
              </Card>
            }
          >
            <Card className="shadow-sm h-100 border-0 themed-card">
              <Card.Body>
                <h5 className="fw-bold mb-3">Resumen del Sistema</h5>
                <Row>
                  <Col md={4} className="text-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <i className="bi bi-people-fill fs-3 text-primary"></i>
                    </div>
                    <h4 className="fw-bold">{usuarios || 0}</h4>
                    <small className="text-muted">Usuarios</small>
                  </Col>
                  <Col md={4} className="text-center">
                    <div className="bg-success bg-opacity-10 rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <i className="bi bi-check-circle fs-3 text-success"></i>
                    </div>
                    <h4 className="fw-bold">{tareas || 0}</h4>
                    <small className="text-muted">Tareas</small>
                  </Col>
                  <Col md={4} className="text-center">
                    <div className="bg-warning bg-opacity-10 rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <i className="bi bi-diagram-3-fill fs-3 text-warning"></i>
                    </div>
                    <h4 className="fw-bold">{proyectos || 0}</h4>
                    <small className="text-muted">Proyectos</small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </PermissionGate>
        );

      case 'cronograma-proyectos':
        return (
          <PermissionGate 
            permission={PROJECT_PERMISSIONS.VIEW_ALL_PROJECTS}
            fallback={
              <Card className="shadow-sm h-100 border-0 themed-card">
                <Card.Body className="text-center py-4">
                  <i className="bi bi-kanban fs-1 text-muted mb-3 d-block"></i>
                  <h6 className="text-muted">Cronograma de Proyectos</h6>
                  <p className="text-muted small">No tienes permisos para ver el cronograma de todos los proyectos</p>
                </Card.Body>
              </Card>
            }
          >
            <Card className="shadow-sm h-100 border-0 themed-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Cronograma de Proyectos</h5>
                  <PermissionGate permission={PROJECT_PERMISSIONS.VIEW_ALL_PROJECTS}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate('/projects')}
                    >
                      Ver todos
                    </Button>
                  </PermissionGate>
                </div>
                <div style={{ height: '300px' }}>
                  <GanttChart />
                </div>
              </Card.Body>
            </Card>
          </PermissionGate>
        );

      default:
        return null;
    }
  };

  // FUNCIÓN: Renderizar secciones según orden configurado
  const renderSectionsByOrder = () => {
    const visibleSections = getSectionsInOrder().filter(section => section.visible);
    const rows: JSX.Element[] = [];
    let currentRow: JSX.Element[] = [];
    let rowIndex = 0;

    visibleSections.forEach((section, index) => {
      const sectionComponent = renderSectionComponent(section.id);
      
      if (!sectionComponent) return;

      // Determinar si la sección ocupa toda la fila o la mitad
      const isFullWidth = ['kpis-sistema', 'anuncios', 'cronograma-proyectos'].includes(section.id);
      
      if (isFullWidth) {
        // Si hay elementos en la fila actual, cerrarla primero
        if (currentRow.length > 0) {
          rows.push(
            <Row key={`row-${rowIndex}`} className="g-4 mb-4">
              {currentRow}
            </Row>
          );
          currentRow = [];
          rowIndex++;
        }
        
        // Agregar la sección de ancho completo
        rows.push(
          <Row key={`row-${rowIndex}`} className="g-4 mb-4">
            <Col md={12}>
              {sectionComponent}
            </Col>
          </Row>
        );
        rowIndex++;
      } else {
        // Sección de media fila
        currentRow.push(
          <Col md={6} key={section.id}>
            {sectionComponent}
          </Col>
        );
        
        // Si la fila está completa (2 elementos), agregarla
        if (currentRow.length === 2) {
          rows.push(
            <Row key={`row-${rowIndex}`} className="g-4 mb-4">
              {currentRow}
            </Row>
          );
          currentRow = [];
          rowIndex++;
        }
      }
    });

    // Si queda una fila incompleta, agregarla
    if (currentRow.length > 0) {
      rows.push(
        <Row key={`row-${rowIndex}`} className="g-4 mb-4">
          {currentRow}
        </Row>
      );
    }

    return rows;
  };

  // Estilos para el contenido
  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container className="py-4 px-4">
          {/* Header con toggle y refresh icon */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <h2 className="mb-0 fw-bold">Bienvenido, {nombreUsuario}</h2>
              <CampanillaNot
                userId={profileInfo?.id || 3}
                refreshInterval={30000}
              />
            </div>
            <div className="d-flex gap-3 align-items-center">
              <ThemeToggleButton size="md" />
              <RefreshIconButton 
                onClick={handleRefresh}
                loading={refreshing}
                size="md"
              />
            </div>
          </div>

          {profileError && (
            <Alert variant="info" className="mb-4">
              <small>
                <i className="bi bi-info-circle me-2"></i>
                {profileError}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 ms-2"
                  onClick={fetchUserProfile}
                >
                  Reintentar
                </Button>
              </small>
            </Alert>
          )}

          {error && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Atención</Alert.Heading>
              <p>{error}</p>
              
              {/* 🔐 INFORMACIÓN TÉCNICA - Solo para administradores */}
              <PermissionGate permission={SYSTEM_PERMISSIONS.ACCESS_ADMIN_PANEL}>
                <div className="d-flex justify-content-end">
                  <Button variant="outline-info" size="sm" onClick={toggleDataInfo}>
                    {showDataInfo ? 'Ocultar detalles' : 'Ver detalles técnicos'}
                  </Button>
                </div>

                {showDataInfo && (
                  <div className="mt-3 small">
                    <hr />
                    <h6>Información para desarrolladores:</h6>
                    <p>Respuestas API:</p>
                    <pre className="bg-light p-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                      {JSON.stringify(apiResponses, null, 2)}
                    </pre>
                  </div>
                )}
              </PermissionGate>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando datos del dashboard...</p>
            </div>
          ) : (
            <>
              {/* Renderizado dinámico de secciones según orden configurado */}
              {renderSectionsByOrder()}
            </>
          )}
        </Container>

        <ThemedFooter />
      </div>
    </div>
  );
};

export default Dashboard;