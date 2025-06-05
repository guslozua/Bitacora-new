import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Offcanvas,
  Form,
  Table,
  Badge,
  OverlayTrigger,
  Tooltip,
  Alert
} from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';
import KanbanBoard from '../components/KanbanBoard';
import { ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import AdvancedGanttChart from '../components/AdvancedGanttChart';
import ConvertToHito from '../components/Hitos/ConvertToHito';
import '../styles/kanban.css';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

interface ProjectData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface Proyecto {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: 'activo' | 'completado' | 'pausado' | 'cancelado' | 'finalizado' | 'en progreso';
  fecha_inicio?: string;
  fecha_fin?: string;
  progreso?: number;
  total_tareas?: number;
  tareas_completadas?: number;
}

const Projects = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [activeView, setActiveView] = useState<'gantt' | 'kanban' | 'lista'>('kanban');
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  // Estados para los KPIs
  const [proyectosTotales, setProyectosTotales] = useState(0);
  const [proyectosActivos, setProyectosActivos] = useState(0);
  const [tareasPendientes, setTareasPendientes] = useState(0);
  const [porcentajeCompletado, setPorcentajeCompletado] = useState(0);
  const [proximosVencer, setProximosVencer] = useState(0);

  // 🎯 NUEVOS ESTADOS PARA LA FUNCIONALIDAD DE CONVERSIÓN
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyectosConvertibles, setProyectosConvertibles] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info', text: string } | null>(null);

  // 🔧 FUNCIÓN PARA VALIDAR SI UN PROYECTO PUEDE CONVERTIRSE A HITO
  const puedeConvertirseAHito = (proyecto: Proyecto): boolean => {
    // Verificar que el proyecto esté completado
    const estaCompletado = proyecto.estado === 'completado' || proyecto.estado === 'finalizado';

    // Si no hay información de tareas, consideramos que puede convertirse si está completado
    if (!proyecto.total_tareas || proyecto.total_tareas === 0) {
      return estaCompletado;
    }

    // Si hay tareas, verificar que todas estén completadas
    const todasTareasCompletas = proyecto.tareas_completadas === proyecto.total_tareas;

    return estaCompletado && todasTareasCompletas;
  };

  // 🔄 CALLBACK PARA MANEJAR LA CONVERSIÓN EXITOSA
  const handleConversionComplete = () => {
    setMessage({
      type: 'success',
      text: '¡Proyecto convertido a hito exitosamente!'
    });

    // Recargar datos después de la conversión
    fetchData();

    // Auto-ocultar mensaje después de 5 segundos
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  // 🔄 CALLBACK PARA MANEJAR ERRORES EN LA CONVERSIÓN
  const handleConversionError = (error: string) => {
    setMessage({
      type: 'danger',
      text: `Error al convertir proyecto a hito: ${error}`
    });

    // Auto-ocultar mensaje después de 10 segundos para errores
    setTimeout(() => {
      setMessage(null);
    }, 10000);
  };

  const fetchData = async () => {
    try {
      const config = {
        headers: { 'x-auth-token': token || '' },
      };

      // Obtenemos datos de proyectos
      const projectsRes = await axios.get('http://localhost:5000/api/projects', config);

      // Obtenemos datos de tareas
      const tasksRes = await axios.get('http://localhost:5000/api/tasks', config);

      // Extraemos los datos relevantes
      const proyectosData = projectsRes.data?.data || [];
      const tareas = tasksRes.data?.data || [];

      // 🔧 ENRIQUECER DATOS DE PROYECTOS CON INFORMACIÓN DE TAREAS
      const proyectosEnriquecidos = proyectosData.map((proyecto: any) => {
        // Calcular tareas del proyecto
        const tareasDelProyecto = tareas.filter((tarea: any) => tarea.id_proyecto === proyecto.id);
        const totalTareas = tareasDelProyecto.length;
        const tareasCompletadas = tareasDelProyecto.filter((tarea: any) =>
          tarea.estado === 'completada' || tarea.estado === 'completado'
        ).length;

        // Calcular progreso basado en estado o tareas
        let progreso = 0;
        if (totalTareas > 0) {
          progreso = Math.round((tareasCompletadas / totalTareas) * 100);
        } else {
          // Si no hay tareas, basarse en el estado del proyecto
          switch (proyecto.estado?.toLowerCase()) {
            case 'completado':
            case 'finalizado':
              progreso = 100;
              break;
            case 'en progreso':
              progreso = 50;
              break;
            case 'pausado':
              progreso = 25;
              break;
            default:
              progreso = 0;
          }
        }

        return {
          ...proyecto,
          total_tareas: totalTareas,
          tareas_completadas: tareasCompletadas,
          progreso: progreso
        };
      });

      // 🎯 GUARDAMOS LOS PROYECTOS ENRIQUECIDOS EN EL ESTADO
      setProyectos(proyectosEnriquecidos);

      // Calculamos los KPIs
      setProyectosTotales(proyectosEnriquecidos.length);

      const activos = proyectosEnriquecidos.filter((proyecto: any) =>
        proyecto.estado !== 'completado' && proyecto.estado !== 'finalizado'
      ).length;
      setProyectosActivos(activos);

      const pendientes = tareas.filter((tarea: any) =>
        tarea.estado !== 'completada' && tarea.estado !== 'finalizada'
      ).length;
      setTareasPendientes(pendientes);

      const proyectosCompletados = proyectosEnriquecidos.filter((proyecto: any) =>
        proyecto.estado === 'completado' || proyecto.estado === 'finalizado'
      ).length;

      const porcentaje = proyectosEnriquecidos.length > 0
        ? Math.round((proyectosCompletados / proyectosEnriquecidos.length) * 100)
        : 0;
      setPorcentajeCompletado(porcentaje);

      const hoy = new Date();
      const enUnaSemana = new Date();
      enUnaSemana.setDate(hoy.getDate() + 7);

      const proximos = proyectosEnriquecidos.filter((proyecto: any) => {
        const fechaFin = new Date(proyecto.fecha_fin);
        return fechaFin >= hoy && fechaFin <= enUnaSemana;
      }).length;
      setProximosVencer(proximos);

      // 🎯 CALCULAR PROYECTOS CONVERTIBLES A HITOS
      const convertibles = proyectosEnriquecidos.filter((proyecto: any) => {
        const puedeConvertir = puedeConvertirseAHito(proyecto);

        // Debug para entender por qué algunos proyectos no son convertibles
        console.log(`Proyecto "${proyecto.nombre}":`, {
          estado: proyecto.estado,
          total_tareas: proyecto.total_tareas,
          tareas_completadas: proyecto.tareas_completadas,
          progreso: proyecto.progreso,
          puede_convertir: puedeConvertir
        });

        return puedeConvertir;
      }).length;
      setProyectosConvertibles(convertibles);

    } catch (error) {
      console.error('Error cargando datos del proyecto:', error);
      setMessage({
        type: 'danger',
        text: 'Error al cargar los datos del proyecto'
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };

    loadData();
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async () => {
    const start = new Date(projectData.startDate);
    const end = new Date(projectData.endDate);

    if (end < start) {
      alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    console.log('🔍 Enviando a la API:', projectData);

    try {
      const config = {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json',
        },
      };

      const newProject = {
        nombre: projectData.name.trim(),
        descripcion: projectData.description.trim(),
        fecha_inicio: projectData.startDate,
        fecha_fin: projectData.endDate,
      };

      const response = await axios.post('http://localhost:5000/api/projects', newProject, config);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '✅ Proyecto creado con éxito'
        });
        setShowOffcanvas(false);
        setProjectData({ name: '', description: '', startDate: '', endDate: '' });
        await fetchData(); // Recargar datos en lugar de window.location.reload()
      } else {
        setMessage({
          type: 'danger',
          text: '❌ Error al crear el proyecto'
        });
        console.log(response.data);
      }
    } catch (error: any) {
      console.error('❌ Error al crear proyecto:', error.response?.data || error.message);
      setMessage({
        type: 'danger',
        text: 'Error al crear el proyecto. Inténtalo de nuevo.'
      });
    }
  };

  // 🎨 FUNCIÓN PARA OBTENER EL COLOR DEL BADGE SEGÚN EL ESTADO
  const getEstadoBadgeVariant = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'completado':
      case 'finalizado':
        return 'success';
      case 'activo':
      case 'en progreso':
        return 'primary';
      case 'pausado':
        return 'warning';
      case 'cancelado':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // 📅 FUNCIÓN PARA FORMATEAR FECHAS
  const formatearFecha = (fecha?: string): string => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // 🔧 FUNCIONES PARA MANEJAR ACCIONES DE PROYECTOS
  const handleViewProject = (proyecto: Proyecto) => {
    // Aquí puedes implementar la navegación a la vista detallada del proyecto
    console.log('Ver detalles del proyecto:', proyecto);
    // Ejemplo: navigate(`/proyecto/${proyecto.id}`);
    setMessage({
      type: 'info',
      text: `Ver detalles del proyecto: ${proyecto.nombre}`
    });
  };

  const handleEditProject = (proyecto: Proyecto) => {
    // Aquí puedes implementar la navegación al formulario de edición
    console.log('Editar proyecto:', proyecto);
    // Ejemplo: navigate(`/proyecto/${proyecto.id}/editar`);
    setMessage({
      type: 'info',
      text: `Editar proyecto: ${proyecto.nombre}`
    });
  };

  const handleDeleteProject = async (proyecto: Proyecto) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el proyecto "${proyecto.nombre}"?`)) {
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
            'Content-Type': 'application/json',
          },
        };

        const response = await axios.delete(`http://localhost:5000/api/projects/${proyecto.id}`, config);

        if (response.data.success) {
          setMessage({
            type: 'success',
            text: `Proyecto "${proyecto.nombre}" eliminado correctamente`
          });
          await fetchData(); // Recargar datos
        } else {
          setMessage({
            type: 'danger',
            text: 'Error al eliminar el proyecto'
          });
        }
      } catch (error: any) {
        console.error('Error al eliminar proyecto:', error);
        setMessage({
          type: 'danger',
          text: `Error al eliminar el proyecto: ${error.response?.data?.message || error.message}`
        });
      }
    }
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    minHeight: '100vh',
  };

  return (
    <div className="d-flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggle={toggleSidebar}
        onLogout={handleLogout}
      />

      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Gestión de Proyectos</h2>
            <Button
              variant="primary"
              className="shadow-sm"
              onClick={() => setShowOffcanvas(true)}
            >
              <i className="bi bi-plus me-2"></i>
              Nuevo Proyecto
            </Button>
          </div>

          {/* 🎯 MENSAJES DE ESTADO */}
          {message && (
            <Alert
              variant={message.type}
              dismissible
              onClose={() => setMessage(null)}
              className="mb-3"
            >
              {message.text}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* KPIs conectados a datos reales */}
              <Row className="g-4 mb-4">
                <Col md={3} lg={true}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Proyectos Totales</h6>
                          <h2 className="fw-bold mb-0">{proyectosTotales}</h2>
                        </div>
                        <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-diagram-3-fill fs-3 text-info" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={3} lg={true}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Proyectos Activos</h6>
                          <h2 className="fw-bold mb-0">{proyectosActivos}</h2>
                        </div>
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-kanban fs-3 text-dark" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={3} lg={true}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Tareas Asociadas</h6>
                          <h2 className="fw-bold mb-0 text-primary">{tareasPendientes}</h2>
                        </div>
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-check2-square fs-3 text-primary" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={3} lg={true}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Completados</h6>
                          <h2 className="fw-bold mb-0 text-success">{porcentajeCompletado}%</h2>
                        </div>
                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-graph-up fs-3 text-success" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* 🎯 NUEVA TARJETA: PROYECTOS CONVERTIBLES A HITOS */}
                <Col md={3} lg={true}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Listos para Hitos</h6>
                          <h2 className="fw-bold mb-0 text-warning">{proyectosConvertibles}</h2>
                        </div>
                        <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-star-fill fs-3 text-warning" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Pestañas para diferentes vistas */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">Gestión Visual de Proyectos</h5>
                        <div>
                          <ButtonGroup>
                            <Button
                              variant={activeView === 'kanban' ? 'primary' : 'outline-primary'}
                              onClick={() => setActiveView('kanban')}
                            >
                              <i className="bi bi-kanban me-1"></i> Kanban
                            </Button>
                            <Button
                              variant={activeView === 'gantt' ? 'primary' : 'outline-primary'}
                              onClick={() => setActiveView('gantt')}
                            >
                              <i className="bi bi-bar-chart-line me-1"></i> Gantt
                            </Button>
                            <Button
                              variant={activeView === 'lista' ? 'primary' : 'outline-primary'}
                              onClick={() => setActiveView('lista')}
                            >
                              <i className="bi bi-list-ul me-1"></i> Lista
                            </Button>
                          </ButtonGroup>
                        </div>
                      </div>

                      {activeView === 'gantt' && <AdvancedGanttChart />}
                      {activeView === 'kanban' && <KanbanBoard />}

                      {/* 🎯 NUEVA VISTA: LISTA DE PROYECTOS CON FUNCIONALIDAD DE CONVERSIÓN */}
                      {activeView === 'lista' && (
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Lista de Proyectos</h6>
                            {proyectosConvertibles > 0 && (
                              <Badge bg="warning" className="fs-6">
                                {proyectosConvertibles} proyecto{proyectosConvertibles !== 1 ? 's' : ''}
                                {proyectosConvertibles !== 1 ? ' listos' : ' listo'} para conversión
                              </Badge>
                            )}
                          </div>

                          <Table responsive hover>
                            <thead className="table-dark">
                              <tr>
                                <th>Proyecto</th>
                                <th>Estado</th>
                                <th>Progreso</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Fin</th>
                                <th>Tareas</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {proyectos.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="text-center py-4">
                                    No se encontraron proyectos
                                  </td>
                                </tr>
                              ) : (
                                proyectos.map((proyecto) => (
                                  <tr key={proyecto.id}>
                                    <td>
                                      <div>
                                        <strong>{proyecto.nombre}</strong>
                                        {proyecto.descripcion && (
                                          <div className="text-muted small">
                                            {proyecto.descripcion}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <Badge bg={getEstadoBadgeVariant(proyecto.estado)}>
                                        {proyecto.estado}
                                      </Badge>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                          <div
                                            className={`progress-bar ${(proyecto.progreso || 0) === 100 ? 'bg-success' :
                                                (proyecto.progreso || 0) >= 50 ? 'bg-primary' :
                                                  (proyecto.progreso || 0) >= 25 ? 'bg-warning' : 'bg-secondary'
                                              }`}
                                            style={{ width: `${proyecto.progreso || 0}%` }}
                                          ></div>
                                        </div>
                                        <small className="text-nowrap">{proyecto.progreso || 0}%</small>
                                      </div>
                                    </td>
                                    <td>{formatearFecha(proyecto.fecha_inicio)}</td>
                                    <td>{formatearFecha(proyecto.fecha_fin)}</td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <span className="text-muted me-2">
                                          {proyecto.tareas_completadas || 0} / {proyecto.total_tareas || 0}
                                        </span>
                                        {(proyecto.total_tareas || 0) === 0 ? (
                                          <Badge bg="light" text="dark" className="small">Sin tareas</Badge>
                                        ) : (proyecto.tareas_completadas || 0) === (proyecto.total_tareas || 0) ? (
                                          <Badge bg="success" className="small">Todas completadas</Badge>
                                        ) : (
                                          <Badge bg="primary" className="small">
                                            {Math.round(((proyecto.tareas_completadas || 0) / (proyecto.total_tareas || 1)) * 100)}% completo
                                          </Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-1">
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>Ver detalles del proyecto</Tooltip>}
                                        >
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleViewProject(proyecto)}
                                          >
                                            <i className="bi bi-eye"></i>
                                          </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>Editar proyecto</Tooltip>}
                                        >
                                          <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => handleEditProject(proyecto)}
                                          >
                                            <i className="bi bi-pencil"></i>
                                          </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>Eliminar proyecto</Tooltip>}
                                        >
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeleteProject(proyecto)}
                                          >
                                            <i className="bi bi-trash"></i>
                                          </Button>
                                        </OverlayTrigger>

                                        {/* 🎯 BOTÓN DE CONVERSIÓN A HITO */}
                                        {puedeConvertirseAHito(proyecto) ? (
                                          <ConvertToHito
                                            projectId={proyecto.id}
                                            projectName={proyecto.nombre}
                                            onConversionComplete={handleConversionComplete}
                                          />
                                        ) : (
                                          <OverlayTrigger
                                            placement="top"
                                            overlay={
                                              <Tooltip>
                                                {proyecto.estado !== 'completado' && proyecto.estado !== 'finalizado'
                                                  ? 'El proyecto debe estar completado para convertir a hito'
                                                  : proyecto.total_tareas && proyecto.total_tareas > 0 &&
                                                    proyecto.tareas_completadas !== proyecto.total_tareas
                                                    ? 'Todas las tareas deben estar completadas'
                                                    : 'Este proyecto no es elegible para conversión'
                                                }
                                              </Tooltip>
                                            }
                                          >
                                            <span className="d-inline-block">
                                              <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                disabled
                                                style={{ pointerEvents: 'none' }}
                                              >
                                                <i className="bi bi-star"></i>
                                              </Button>
                                            </span>
                                          </OverlayTrigger>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>

        <Footer />
      </div>

      <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold">Nuevo Proyecto</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group controlId="formProjectName" className="mb-3">
              <Form.Label className="fw-semibold">Nombre del Proyecto</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={projectData.name}
                onChange={handleInputChange}
                placeholder="Ej. Plataforma Genesys"
                className="shadow-sm"
              />
            </Form.Group>

            <Form.Group controlId="formProjectDescription" className="mb-3">
              <Form.Label className="fw-semibold">Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={projectData.description}
                onChange={handleInputChange}
                placeholder="Breve descripción del proyecto"
                className="shadow-sm"
              />
            </Form.Group>

            <Form.Group controlId="formProjectStartDate" className="mb-3">
              <Form.Label className="fw-semibold">Fecha de Inicio</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={projectData.startDate}
                onChange={handleInputChange}
                className="shadow-sm"
              />
            </Form.Group>

            <Form.Group controlId="formProjectEndDate" className="mb-3">
              <Form.Label className="fw-semibold">Fecha de Fin</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={projectData.endDate}
                min={projectData.startDate || undefined}
                onChange={handleInputChange}
                className="shadow-sm"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="outline-secondary" onClick={() => setShowOffcanvas(false)}>
                Cancelar
              </Button>
              <Button variant="primary" className="shadow-sm" onClick={handleCreateProject}>
                Crear Proyecto
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default Projects;