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
import Footer from '../components/Footer';
// Importamos funciones del servicio de autenticación
import { getUserName, logout, getToken } from '../services/authService';

const Dashboard = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [tareas, setTareas] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [apiResponses, setApiResponses] = useState<any>({});
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Obtenemos el token usando el servicio de autenticación
  const token = getToken();

  // Nombre a mostrar en el saludo (valor inicial desde el servicio de autenticación)
  const [nombreUsuario, setNombreUsuario] = useState<string>(getUserName());

  useEffect(() => {
    // Log para depuración
    console.log("Estado actual de nombreUsuario:", nombreUsuario);
  }, [nombreUsuario]);

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

        // Construir actividad reciente
        const actividad: string[] = [];

        // Añadir proyectos recientes
        const proyectosRecientes = projectData.slice(-3).reverse();
        proyectosRecientes.forEach((p: any) => {
          if (p && p.nombre) {
            actividad.push(`📁 Nuevo proyecto creado: ${p.nombre}`);
          }
        });

        // Añadir tareas recientes
        const tareasRecientes = taskData.slice(-3).reverse();
        tareasRecientes.forEach((t: any) => {
          if (t && t.titulo) {
            actividad.push(`📝 Nueva tarea: ${t.titulo}`);
          } else if (t && t.nombre) {
            // Alternativa si se usa nombre en lugar de titulo
            actividad.push(`📝 Nueva tarea: ${t.nombre}`);
          }
        });

        // Si no hay actividad, mostrar mensaje por defecto
        if (actividad.length === 0 && (projectCount > 0 || taskCount > 0)) {
          actividad.push('No se pudieron cargar detalles de actividad reciente');
          // Había datos pero no pudimos extraer actividad específica
          console.warn('No se pudieron extraer detalles de actividad reciente');
        }

        setActividadReciente(actividad);

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
  }, [token]);

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

  // Función para forzar recarga de datos
  const handleRefresh = () => {
    setLoading(true);
    fetchUserProfile();
    // Simular un pequeño retraso para que se vea el spinner
    setTimeout(() => {
      window.location.reload();
    }, 500);
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Bienvenido, {nombreUsuario}</h2>
            <div className="d-flex gap-2">
              <Button variant="outline-info" className="me-2" onClick={handleRefresh}>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Recargar
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/projects')}>
                <i className="bi bi-plus me-2"></i>
                Nuevo Proyecto
              </Button>
              <Button variant="outline-primary">
                <i className="bi bi-plus me-2"></i>
                Nueva Tarea
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
              <Row className="g-4 mb-4">
                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Proyectos Activos</h6>
                          <h2 className="fw-bold mb-0">{proyectos ?? 0}</h2>
                        </div>
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-diagram-3-fill fs-3 text-primary" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Tareas Pendientes</h6>
                          <h2 className="fw-bold mb-0">{tareas ?? 0}</h2>
                        </div>
                        <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-list-task fs-3 text-warning" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Usuarios</h6>
                          <h2 className="fw-bold mb-0">{usuarios ?? 0}</h2>
                        </div>
                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-people-fill fs-3 text-success" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="shadow-sm h-100 border-0">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Actividad Reciente</h5>
                      <ListGroup variant="flush">
                        {actividadReciente.length === 0 ? (
                          <ListGroup.Item>No hay actividad reciente</ListGroup.Item>
                        ) : (
                          actividadReciente.map((item, idx) => (
                            <ListGroup.Item key={idx}>{item}</ListGroup.Item>
                          ))
                        )}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="shadow-sm h-100 border-0">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Reportes Rápidos</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          layout="vertical"
                          data={chartData}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          barCategoryGap={20}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <Tooltip />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="nombre"
                            type="category"
                            width={100}
                            tick={{ fontWeight: 'bold' }}
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
              </Row>

              <Card className="shadow-sm mb-4 border-0">
                <Card.Body>
                  <GanttChart />
                </Card.Body>
              </Card>
            </>
          )}
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;