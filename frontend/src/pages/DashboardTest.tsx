// src/pages/DashboardTest.tsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert, Badge } from 'react-bootstrap';
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
  LineChart,
  Line,
  PieChart,
  Pie,
} from 'recharts';

import GanttChart from '../components/GanttChart';
import Sidebar from '../components/Sidebar';
import ThemedFooter from '../components/ThemedFooter';
import ThemedLogo from '../components/ThemedLogo';
import ThemeToggleButton from '../components/ThemeToggleButton';
import RefreshIconButton from '../components/RefreshIconButton';
import MiniCalendar from '../components/MiniCalendar/MiniCalendar';
import { fetchEvents } from '../services/EventService';
import { Event } from '../models/Event';
import CampanillaNot from '../components/notificaciones/CampanillaNot';
import { useTheme } from '../context/ThemeContext';
import StatsCard from '../components/StatsCard'; // 🔥 NUEVO componente

// Importamos funciones del servicio de autenticación
import { getUserName, logout, getToken } from '../services/authService';

const DashboardTest = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [tareas, setTareas] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<string[]>([]);
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

  // 🔥 NUEVO: Estados para datos adicionales del dashboard
  const [statsHistory, setStatsHistory] = useState<any[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<any[]>([]);

  const token = getToken();
  const [nombreUsuario, setNombreUsuario] = useState<string>(getUserName());

  // 🔥 NUEVO: Función para generar datos de ejemplo para gráficos adicionales
  const generateMockData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const baseUsers = usuarios || 10; // Valor por defecto si usuarios es null
    const history = months.map(month => ({
      mes: month,
      proyectos: Math.floor(Math.random() * 20) + 5,
      tareas: Math.floor(Math.random() * 50) + 10,
      usuarios: Math.floor(Math.random() * 10) + baseUsers,
    }));
    setStatsHistory(history);

    const statusData = [
      { nombre: 'Pendientes', valor: Math.floor(Math.random() * 20) + 5, color: '#ffc107' },
      { nombre: 'En Progreso', valor: Math.floor(Math.random() * 15) + 3, color: '#0d6efd' },
      { nombre: 'Completadas', valor: Math.floor(Math.random() * 25) + 10, color: '#198754' },
      { nombre: 'Canceladas', valor: Math.floor(Math.random() * 5) + 1, color: '#dc3545' },
    ];
    setTasksByStatus(statusData);
  };

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

  const handleDateClick = (date: Date) => {
    navigate(`/calendar?date=${date.toISOString()}`);
  };

  const handleEventClick = (event: Event) => {
    navigate(`/calendar/event/${event.id}`);
  };

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

  const fetchUserCount = async (config: any) => {
    try {
      console.log("Intentando obtener conteo de usuarios con ruta principal...");
      const usersResponse = await axios.get('http://localhost:5000/api/users', config);
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
        const countResponse = await axios.get('http://localhost:5000/api/users/count', config);
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
          fetchSafely('http://localhost:5000/api/tasks', 'tareas'),
          fetchSafely('http://localhost:5000/api/projects', 'proyectos'),
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

        const actividad: string[] = [];

        const proyectosRecientes = projectData.slice(-3).reverse();
        proyectosRecientes.forEach((p: any) => {
          if (p && p.nombre) {
            actividad.push(`📁 Nuevo proyecto creado: ${p.nombre}`);
          }
        });

        const tareasRecientes = taskData.slice(-3).reverse();
        tareasRecientes.forEach((t: any) => {
          if (t && t.titulo) {
            actividad.push(`📝 Nueva tarea: ${t.titulo}`);
          } else if (t && t.nombre) {
            actividad.push(`📝 Nueva tarea: ${t.nombre}`);
          }
        });

        const eventosRecientes = calendarEvents.slice(-3).reverse();
        eventosRecientes.forEach((e: Event) => {
          if (e && e.title) {
            const tipoEvento = e.type === 'holiday' ? '🏖️ Feriado' : (e.type === 'task' ? '📝 Tarea' : '📅 Evento');
            actividad.push(`${tipoEvento}: ${e.title}`);
          }
        });

        if (actividad.length === 0 && (projectCount > 0 || taskCount > 0)) {
          actividad.push('No se pudieron cargar detalles de actividad reciente');
          console.warn('No se pudieron extraer detalles de actividad reciente');
        }

        setActividadReciente(actividad);

        if (userCount === 0 && taskCount === 0 && projectCount === 0) {
          setError('No se encontraron datos para mostrar. Puede ser un problema de permisos o conexión.');
        }

      } catch (error: any) {
        console.error('Error cargando datos del dashboard:', error);
        setError(`Error cargando datos: ${error.message || 'Error desconocido'}`);
      } finally {
        setLoading(false);
        // 🔥 MOVIDO: Generar datos adicionales después de cargar los datos reales
        generateMockData();
      }
    };

    fetchData();
  }, [token, calendarEvents]);

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
          {/* 🔥 MEJORADO: Header con badge de "versión de prueba" */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <h2 className="mb-0 fw-bold">Bienvenido, {nombreUsuario}</h2>
              <Badge bg="info" className="fs-6">Versión de Prueba</Badge>
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
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver al Original
              </Button>
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
              {/* 🔥 NUEVO: Cards usando el componente StatsCard */}
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <StatsCard
                    title="Proyectos Activos"
                    value={proyectos}
                    icon="bi bi-diagram-3-fill"
                    color="primary"
                    loading={loading}
                    onClick={() => navigate('/projects')}
                    subtitle="Total de proyectos"
                    trend={{ value: 12, isPositive: true }}
                  />
                </Col>
                <Col md={3}>
                  <StatsCard
                    title="Tareas Pendientes"
                    value={tareas}
                    icon="bi bi-list-task"
                    color="warning"
                    loading={loading}
                    onClick={() => navigate('/tasks')}
                    subtitle="Requieren atención"
                    trend={{ value: 3, isPositive: false }}
                  />
                </Col>
                <Col md={3}>
                  <StatsCard
                    title="Usuarios Activos"
                    value={usuarios}
                    icon="bi bi-people-fill"
                    color="success"
                    loading={loading}
                    onClick={() => navigate('/admin/users')}
                    subtitle="En el sistema"
                  />
                </Col>
                <Col md={3}>
                  <StatsCard
                    title="Eventos Hoy"
                    value={calendarEvents.filter(e => 
                      new Date(e.start).toDateString() === new Date().toDateString()
                    ).length}
                    icon="bi bi-calendar-event"
                    color="info"
                    loading={calendarLoading}
                    onClick={() => navigate('/calendar')}
                    subtitle="Programados"
                  />
                </Col>
              </Row>

              {/* 🔥 NUEVO: Sección de gráficos mejorada */}
              <Row className="g-4 mb-4">
                <Col md={8}>
                  <Card className="shadow-sm h-100 border-0 themed-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">Tendencia de los últimos 6 meses</h5>
                        <div className="d-flex gap-2">
                          <Button variant="outline-secondary" size="sm">
                            <i className="bi bi-download me-1"></i>
                            Exportar
                          </Button>
                        </div>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={statsHistory}>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={isDarkMode ? "#495057" : "#f0f0f0"} 
                          />
                          <XAxis 
                            dataKey="mes"
                            tick={{ fill: isDarkMode ? '#ffffff' : '#212529' }}
                          />
                          <YAxis 
                            tick={{ fill: isDarkMode ? '#ffffff' : '#212529' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
                              border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
                              color: isDarkMode ? '#ffffff' : '#212529',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="proyectos" 
                            stroke="#667eea" 
                            strokeWidth={3}
                            name="Proyectos"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="tareas" 
                            stroke="#764ba2" 
                            strokeWidth={3}
                            name="Tareas"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="shadow-sm h-100 border-0 themed-card">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Estado de Tareas</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={tasksByStatus}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="valor"
                            label={({ nombre, valor }) => `${nombre}: ${valor}`}
                          >
                            {tasksByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Segunda fila de contenido */}
              <Row className="g-4 mb-4">
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
                        {actividadReciente.length === 0 ? (
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
                                  <i className={`${item.includes('proyecto') ? 'bi bi-folder' : 'bi bi-check-circle'} text-primary`}></i>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-medium">{item}</div>
                                <small className="text-muted">Hace {Math.floor(Math.random() * 60)} minutos</small>
                              </div>
                            </ListGroup.Item>
                          ))
                        )}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>

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
              </Row>

              {/* 🔥 NUEVA: Sección de acciones rápidas y próximos eventos */}
              <Row className="g-4 mb-4">
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

                <Col md={8}>
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
              </Row>

              {/* 🔥 MEJORADO: Resumen de métricas con barras horizontales */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="shadow-sm border-0 themed-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">Resumen General del Sistema</h5>
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
                      
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          layout="vertical"
                          data={[
                            { nombre: 'Usuarios', cantidad: usuarios ?? 0, color: '#198754' },
                            { nombre: 'Tareas', cantidad: tareas ?? 0, color: '#ffc107' },
                            { nombre: 'Proyectos', cantidad: proyectos ?? 0, color: '#0d6efd' },
                            { nombre: 'Eventos', cantidad: calendarEvents.length, color: '#6f42c1' }
                          ]}
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
                              color: isDarkMode ? '#ffffff' : '#212529',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value, name) => [`${value} elementos`, name]}
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
                          <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                            {[
                              { nombre: 'Usuarios', cantidad: usuarios ?? 0, color: '#198754' },
                              { nombre: 'Tareas', cantidad: tareas ?? 0, color: '#ffc107' },
                              { nombre: 'Proyectos', cantidad: proyectos ?? 0, color: '#0d6efd' },
                              { nombre: 'Eventos', cantidad: calendarEvents.length, color: '#6f42c1' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Gráfico Gantt original */}
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

              {/* 🔥 NUEVA: Comparación de mejoras */}
              <Alert variant="info" className="mb-4">
                <Alert.Heading className="d-flex align-items-center">
                  <i className="bi bi-lightbulb me-2"></i>
                  Mejoras en esta versión de prueba
                </Alert.Heading>
                <Row className="mt-3">
                  <Col md={6}>
                    <h6>✨ Nuevas características:</h6>
                    <ul className="mb-0">
                      <li>Cards estadísticas con efectos hover</li>
                      <li>Gráfico de tendencias temporal</li>
                      <li>Gráfico circular de estado de tareas</li>
                      <li>Sección de acciones rápidas</li>
                      <li>Skeleton loaders durante carga</li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h6>🚀 Mejoras de UX:</h6>
                    <ul className="mb-0">
                      <li>Formato numérico con separadores</li>
                      <li>Indicadores de tendencia</li>
                      <li>Timestamps en actividad reciente</li>
                      <li>Mejor organización visual</li>
                      <li>Tooltips mejorados en gráficos</li>
                    </ul>
                  </Col>
                </Row>
                <hr />
                <div className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => alert('¡Genial! Podemos implementar estas mejoras en tu dashboard original.')}
                  >
                    <i className="bi bi-check-circle me-1"></i>
                    Me gusta, implementar
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                  >
                    <i className="bi bi-arrow-left me-1"></i>
                    Volver al original
                  </Button>
                </div>
              </Alert>
            </>
          )}
        </Container>

        <ThemedFooter />
      </div>
    </div>
  );
};

export default DashboardTest;