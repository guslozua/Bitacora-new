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
import ThemeToggleButton from '../components/ThemeToggleButton'; // 🔥 Toggle elegante
import RefreshIconButton from '../components/RefreshIconButton'; // 🔥 NUEVO: Ícono de refresh
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import StatsCard from '../components/StatsCard'; // 🔥 NUEVO: Importar StatsCard
import AnnouncementsCarousel from '../components/AnnouncementsCarousel/AnnouncementsCarousel'; // 🔥 NUEVO: Importar carrusel de anuncios
import { fetchEvents } from '../services/EventService';
import { Event } from '../models/Event';
import CampanillaNot from '../components/notificaciones/CampanillaNot';
import { useTheme } from '../context/ThemeContext';
import KpiRow from '../components/KpiRow';
import { useDashboardKpiVisibility } from '../services/DashboardKpiVisibilityContext';
import { useDashboardSectionVisibility } from '../services/DashboardSectionVisibilityContext';

// Importamos funciones del servicio de autenticación
import { getUserName, logout, getToken } from '../services/authService';

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

  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [tareas, setTareas] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<Array<{texto: string, fecha: Date, tiempoRelativo: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 🔥 NUEVO: Estado para el ícono de refresh
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
  const { isSectionVisible } = useDashboardSectionVisibility();

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
      const response = await axios.get('http://localhost:5000/api/users/profile', config);
      console.log("Respuesta de perfil de usuario:", response.data);

      if (response.data && response.data.success && response.data.data) {
        const userData = response.data.data;
        if (userData.nombre) {
          console.log("Actualizando nombre de usuario a:", userData.nombre);
          // Actualizar estado con el nombre del usuario
          setNombreUsuario(userData.nombre);
          // También guardar toda la información del perfil
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
      // Primero intentar con la ruta protegida regular
      const usersResponse = await axios.get('http://localhost:5000/api/users', config);
      console.log("Respuesta exitosa de /api/users:", usersResponse.data);

      // Verificar si la respuesta tiene el formato esperado
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

      // Si hay error, intentar con API de conteo
      try {
        console.log("Intentando obtener conteo con ruta alternativa...");
        // Intenta obtener solo el conteo (si existe esta ruta)
        const countResponse = await axios.get('http://localhost:5000/api/users/count', config);
        console.log("Respuesta exitosa de /api/users/count:", countResponse.data);
        return {
          success: true,
          data: null,
          count: countResponse.data.count || 0,
          method: "count_api"
        };
      } catch (secondError: any) {
        // Si tampoco funciona, mostrar mensaje de error detallado
        console.error("Error también con ruta alternativa:", secondError.response || secondError);

        // Usar valor predeterminado
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
    // Cargar el perfil del usuario
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

        // Función para obtener datos de forma segura
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

        // Obtener datos de tareas y proyectos
        const [tasksRes, projectsRes] = await Promise.all([
          fetchSafely('http://localhost:5000/api/tasks', 'tareas'),
          fetchSafely('http://localhost:5000/api/projects', 'proyectos'),
        ]);

        // Obtener conteo de usuarios con método especial
        const usersRes = await fetchUserCount(config);
        console.log("Resultado final de conteo de usuarios:", usersRes);

        // Guardar las respuestas para inspección
        setApiResponses({
          users: usersRes,
          tasks: tasksRes.data,
          projects: projectsRes.data,
          profile: profileInfo
        });

        // Procesar datos de usuarios
        let userCount = usersRes.count || 0;
        console.log("Estableciendo conteo de usuarios:", userCount);
        setUsuarios(userCount);

        // Procesar datos de tareas de forma robusta
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

        // Procesar datos de proyectos de forma robusta
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

        // Construir actividad reciente con timestamps reales
        const actividad: Array<{texto: string, fecha: Date}> = [];

        // Añadir proyectos recientes con sus fechas reales
        const proyectosRecientes = projectData.slice(-3).reverse();
        console.log('🔍 Estructura completa de un proyecto:', JSON.stringify(proyectosRecientes[0], null, 2));
        proyectosRecientes.forEach((p: any) => {
          if (p && p.nombre) {
            // Usar fecha_inicio como fecha de creación del proyecto
            const fechaCreacion = p.fecha_inicio || new Date();
            console.log('📁 Proyecto:', p.nombre, 'Fecha inicio real:', fechaCreacion);
            actividad.push({
              texto: `📁 Nuevo proyecto creado: ${p.nombre}`,
              fecha: new Date(fechaCreacion)
            });
          }
        });

        // Añadir tareas recientes con sus fechas reales
        const tareasRecientes = taskData.slice(-3).reverse();
        console.log('🔍 Estructura completa de una tarea:', JSON.stringify(tareasRecientes[0], null, 2));
        tareasRecientes.forEach((t: any) => {
          if (t && t.titulo) {
            // Usar fecha_inicio como fecha de creación de la tarea
            const fechaCreacion = t.fecha_inicio || new Date();
            console.log('📝 Tarea:', t.titulo, 'Fecha inicio real:', fechaCreacion);
            actividad.push({
              texto: `📝 Nueva tarea: ${t.titulo}`,
              fecha: new Date(fechaCreacion)
            });
          } else if (t && t.nombre) {
            // Alternativa si se usa nombre en lugar de titulo
            const fechaCreacion = t.fecha_inicio || new Date();
            console.log('📝 Tarea:', t.nombre, 'Fecha inicio real:', fechaCreacion);
            actividad.push({
              texto: `📝 Nueva tarea: ${t.nombre}`,
              fecha: new Date(fechaCreacion)
            });
          }
        });

        // Añadir eventos recientes del calendario con sus fechas (solo eventos de trabajo real)
        const eventosRecientes = calendarEvents
          .filter(e => {
            // Filtrar solo eventos que representen actividad real del sistema
            // Excluir feriados, cumpleaños, guardias, conectividad, vacaciones y eventos futuros
            const esFeriado = e.type === 'holiday' || e.title.toLowerCase().includes('feriado');
            const esCumple = e.type === 'birthday' || e.title.toLowerCase().includes('cumple');
            const esGuardia = e.type === 'guardia' || e.title.toLowerCase().includes('guardia');
            const esConectividad = e.type === 'gconect' || e.title.toLowerCase().includes('conectividad');
            const esVacaciones = e.type === 'vacation' || e.title.toLowerCase().includes('vacacion');
            const esFuturo = new Date(e.start) > new Date();
            
            console.log(`📅 Evaluando evento: ${e.title}, Tipo: ${e.type}, Es feriado: ${esFeriado}, Es cumpleaños: ${esCumple}, Es guardia: ${esGuardia}, Es conectividad: ${esConectividad}, Es vacaciones: ${esVacaciones}, Es futuro: ${esFuturo}`);
            
            // Solo incluir eventos que NO sean ninguno de los tipos excluidos
            return !esFeriado && !esCumple && !esGuardia && !esConectividad && !esVacaciones && !esFuturo;
          })
          .slice(-3).reverse();
          
        eventosRecientes.forEach((e: Event) => {
          if (e && e.title) {
            const tipoEvento = e.type === 'task' ? '📝 Tarea' : '📅 Evento';
            const fechaEvento = e.start ? new Date(e.start) : new Date();
            console.log('📅 Evento válido:', e.title, 'Fecha real:', fechaEvento);
            actividad.push({
              texto: `${tipoEvento}: ${e.title}`,
              fecha: fechaEvento
            });
          }
        });

        // Ordenar por fecha (más reciente primero) y convertir a formato string con timestamp
        const actividadOrdenada = actividad
          .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
          .map(item => {
            const tiempoRelativo = getTimeAgo(item.fecha);
            console.log('⚙️ Calculando tiempo para:', item.texto, 'Fecha:', item.fecha, 'Resultado:', tiempoRelativo);
            return {
              texto: item.texto,
              fecha: item.fecha,
              tiempoRelativo: tiempoRelativo
            };
          });

        console.log('📋 Actividad final ordenada:', actividadOrdenada);

        // Si no hay actividad, mostrar mensaje por defecto
        if (actividadOrdenada.length === 0 && (projectCount > 0 || taskCount > 0)) {
          actividadOrdenada.push({
            texto: 'No se pudieron cargar detalles de actividad reciente',
            fecha: new Date(),
            tiempoRelativo: 'Ahora'
          });
          // Había datos pero no pudimos extraer actividad específica
          console.warn('No se pudieron extraer detalles de actividad reciente');
        }

        setActividadReciente(actividadOrdenada);

        // Si no hay datos en general
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
        return 'text-white'; // Los colores personalizados se aplicarán con el estilo
    }
  };

  // Función para obtener el estilo según el tipo de evento
  const getStyleForEventType = (type: string): React.CSSProperties => {
    switch (type) {
      case 'holiday':
      case 'task':
      case 'event':
        return {}; // No se necesita estilo adicional para estos que usan clases de Bootstrap
      case 'birthday':
        return { backgroundColor: '#ff9800' }; // Naranja para cumpleaños
      case 'dayoff':
        return { backgroundColor: '#4caf50' }; // Verde claro para días a favor
      case 'gconect':
        return { backgroundColor: '#00bcd4' }; // Azul celeste para G. Conectividad
      case 'vacation':
        return { backgroundColor: '#9e9e9e' }; // Gris para Vacaciones
      case 'guardia':
        return { backgroundColor: '#9c27b0' }; // Púrpura para Guardia
      default:
        return { backgroundColor: '#6c757d' }; // Gris oscuro para tipos desconocidos
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

  // Usar la función de logout del servicio de autenticación
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

  // 🔥 ACTUALIZADA: Función para forzar recarga de datos con animación
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    
    // Trigger refresh de KPIs
    setKpiRefreshTrigger(prev => prev + 1);
    
    // Simular un pequeño retraso para que se vea la animación
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

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
          {/* 🔥 ACTUALIZADO: Header con nuevo toggle y refresh icon */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              {/* <ThemedLogo width="50px" height="50px" className="me-2" />*/}
              <h2 className="mb-0 fw-bold">Bienvenido, {nombreUsuario}</h2>
              <CampanillaNot
                userId={profileInfo?.id || 3}
                refreshInterval={30000}
              />
            </div>
            <div className="d-flex gap-3 align-items-center">
              {/* 🔥 NUEVO: Toggle elegante */}
              <ThemeToggleButton size="md" />
              
              {/* 🔥 NUEVO: Ícono de refresh */}
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
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando datos del dashboard...</p>
            </div>
          ) : (
            <>
              {/* 🔥 SECCIÓN Única: TODOS LOS KPIS CONFIGURABLES */}
              <div className="mb-4">
                <KpiRow 
                  title="Indicadores del Sistema"
                  subtitle="Métricas clave y estadísticas del sistema"
                  refreshTrigger={kpiRefreshTrigger}
                  onRefreshComplete={() => console.log('KPIs refreshed')}
                />
              </div>

              {/* 🔥 2. SECCIÓN: Actividad Reciente | Calendario */}
              {(isSectionVisible('actividad-reciente') || isSectionVisible('calendario')) && (
                <Row className="g-4 mb-4">
                  {isSectionVisible('actividad-reciente') && (
                    <Col md={6}>
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
                </Col>
                  )}

                {isSectionVisible('calendario') && (
                <Col md={6}>
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
                </Col>
                )}
              </Row>
              )}

              {/* 🔥 3. SECCIÓN: Anuncios (Carrusel) - MOVIDA AQUÍ */}
              {isSectionVisible('anuncios') && (
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <AnnouncementsCarousel />
                </Col>
              </Row>
              )}

              {/* 🔥 4. SECCIÓN: Reportes Rápidos | Próximos Eventos */}
              {(isSectionVisible('reportes-rapidos') || isSectionVisible('proximos-eventos')) && (
              <Row className="g-4 mb-4">
                {isSectionVisible('reportes-rapidos') && (
                <Col md={6}>
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
                </Col>
                )}

                {isSectionVisible('proximos-eventos') && (
                <Col md={6}>
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
                                  <div className="text-end">
                                    <small className="text-muted">
                                      {new Date(event.start).toLocaleTimeString('es-AR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </small>
                                  </div>
                                </div>
                              </ListGroup.Item>
                            ))
                        )}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
                )}
              </Row>
              )}

              {/* 🔥 5. SECCIÓN: Acciones Rápidas | Resumen del Sistema */}
              {(isSectionVisible('acciones-rapidas') || isSectionVisible('resumen-sistema')) && (
              <Row className="g-4 mb-4">
                {isSectionVisible('acciones-rapidas') && (
                <Col md={4}>
                  <Card className="shadow-sm h-100 border-0 themed-card">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Acciones Rápidas</h5>
                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary" 
                          className="d-flex align-items-center justify-content-start"
                          onClick={() => navigate('/projects/new')}
                        >
                          <i className="bi bi-plus-circle me-2"></i>
                          Nuevo Proyecto
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          className="d-flex align-items-center justify-content-start"
                          onClick={() => navigate('/tasks/new')}
                        >
                          <i className="bi bi-check2-square me-2"></i>
                          Nueva Tarea
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          className="d-flex align-items-center justify-content-start"
                          onClick={() => navigate('/calendar/new')}
                        >
                          <i className="bi bi-calendar-plus me-2"></i>
                          Agendar Evento
                        </Button>
                        <Button 
                          variant="outline-info" 
                          className="d-flex align-items-center justify-content-start"
                          onClick={() => navigate('/reports')}
                        >
                          <i className="bi bi-graph-up me-2"></i>
                          Ver Reportes
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                )}
                {isSectionVisible('resumen-sistema') && (
                <Col md={8}>
                  <Card className="shadow-sm h-100 border-0 themed-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">Resumen del Sistema</h5>
                        <div className="d-flex gap-2">
                          <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-download me-1"></i>
                            Exportar PDF
                          </Button>
                          <Button variant="outline-primary" size="sm">
                            <i className="bi bi-share me-1"></i>
                            Compartir
                          </Button>
                        </div>
                      </div>
                      
                      {/* Información de sistema en formato de tabla */}
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-diagram-3 text-primary me-2"></i>
                              <strong>Gestión de Proyectos</strong>
                            </div>
                            <p className="text-muted mb-2 small">
                              Total de proyectos activos en el sistema
                            </p>
                            <h3 className="text-primary mb-0" style={{fontFamily: 'monospace'}}>
                              {proyectos?.toLocaleString() ?? 0}
                            </h3>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-list-task text-warning me-2"></i>
                              <strong>Tareas Pendientes</strong>
                            </div>
                            <p className="text-muted mb-2 small">
                              Tareas que requieren atención
                            </p>
                            <h3 className="text-warning mb-0" style={{fontFamily: 'monospace'}}>
                              {tareas?.toLocaleString() ?? 0}
                            </h3>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-people text-success me-2"></i>
                              <strong>Usuarios del Sistema</strong>
                            </div>
                            <p className="text-muted mb-2 small">
                              Usuarios registrados y activos
                            </p>
                            <h3 className="text-success mb-0" style={{fontFamily: 'monospace'}}>
                              {usuarios?.toLocaleString() ?? 0}
                            </h3>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-calendar-event text-info me-2"></i>
                              <strong>Eventos de Hoy</strong>
                            </div>
                            <p className="text-muted mb-2 small">
                              Eventos programados para hoy
                            </p>
                            <h3 className="text-info mb-0" style={{fontFamily: 'monospace'}}>
                              {calendarEvents.filter(e => 
                                new Date(e.start).toDateString() === new Date().toDateString()
                              ).length.toLocaleString()}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                )}
              </Row>
              )}

              {/* 🔥 6. SECCIÓN: Cronograma de Proyectos (Gantt) */}
              {isSectionVisible('cronograma-proyectos') && (
              <Card className="shadow-sm mb-4 border-0 themed-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Cronograma de Proyectos</h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate('/projects/gantt')}
                    >
                      Ver detalle
                    </Button>
                  </div>
                  <GanttChart />
                </Card.Body>
              </Card>
              )}
            </>
          )}
        </Container>

        {/* 🔥 CAMBIO: Footer temático que cambia según el tema */}
        <ThemedFooter />
      </div>
    </div>
  );
};

export default Dashboard;