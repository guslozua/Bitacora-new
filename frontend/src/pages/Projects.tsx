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
} from 'react-bootstrap';
import { Tabs, Tab } from 'react-bootstrap';
import KanbanBoard from '../components/KanbanBoard';
import { ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import AdvancedGanttChart from '../components/AdvancedGanttChart';
import '../styles/kanban.css';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

interface ProjectData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

const Projects = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [activeView, setActiveView] = useState<'gantt' | 'kanban'>('gantt');
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

  useEffect(() => {
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
        const proyectos = projectsRes.data?.data || [];
        const tareas = tasksRes.data?.data || [];

        // Calculamos los KPIs

        // 1. Proyectos totales (nuevo)
        setProyectosTotales(proyectos.length);

        // 2. Proyectos activos (corregido: solo los no completados)
        const activos = proyectos.filter((proyecto: any) =>
          proyecto.estado !== 'completado' && proyecto.estado !== 'finalizado'
        ).length;
        setProyectosActivos(activos);

        // 3. Tareas pendientes
        const pendientes = tareas.filter((tarea: any) =>
          tarea.estado !== 'completada' && tarea.estado !== 'finalizada'
        ).length;
        setTareasPendientes(pendientes);

        // 4. Porcentaje completado (proyectos completados / total de proyectos)
        const proyectosCompletados = proyectos.filter((proyecto: any) =>
          proyecto.estado === 'completado' || proyecto.estado === 'finalizado'
        ).length;

        const porcentaje = proyectos.length > 0
          ? Math.round((proyectosCompletados / proyectos.length) * 100)
          : 0;

        setPorcentajeCompletado(porcentaje);

        // 5. Proyectos próximos a vencer (en los próximos 7 días)
        const hoy = new Date();
        const enUnaSemana = new Date();
        enUnaSemana.setDate(hoy.getDate() + 7);

        const proximos = proyectos.filter((proyecto: any) => {
          const fechaFin = new Date(proyecto.fecha_fin);
          return fechaFin >= hoy && fechaFin <= enUnaSemana;
        }).length;

        setProximosVencer(proximos);

      } catch (error) {
        console.error('Error cargando datos del proyecto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        alert('✅ Proyecto creado con éxito');
        setShowOffcanvas(false);
        setProjectData({ name: '', description: '', startDate: '', endDate: '' });
        window.location.reload();
      } else {
        alert('❌ La API respondió pero sin éxito');
        console.log(response.data);
      }
    } catch (error: any) {
      console.error('❌ Error al crear proyecto:', error.response?.data || error.message);
      alert('Error al crear el proyecto. Revisá la consola.');
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

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* KPIs conectados a datos reales */}
              <Row className="g-4 mb-4">
                {/* Nueva tarjeta de Proyectos Totales */}
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
                          <i className="bi bi-folder fs-3 text-info" />
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

                <Col md={3} lg={true}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Próximos a Vencer</h6>
                          <h2 className="fw-bold mb-0 text-warning">{proximosVencer}</h2>
                        </div>
                        <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-clock-history fs-3 text-warning" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Vistas de proyectos (Gantt/Kanban) */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0">Gestión Visual de Proyectos</h5>
                        <div>
                          <ButtonGroup>
                            <Button
                              variant={activeView === 'gantt' ? 'primary' : 'outline-primary'}
                              onClick={() => setActiveView('gantt')}
                            >
                              <i className="bi bi-bar-chart-line me-1"></i> Gantt
                            </Button>
                            <Button
                              variant={activeView === 'kanban' ? 'primary' : 'outline-primary'}
                              onClick={() => setActiveView('kanban')}
                            >
                              <i className="bi bi-kanban me-1"></i> Kanban
                            </Button>
                          </ButtonGroup>
                        </div>
                      </div>

                      {activeView === 'gantt' ? (
                        <AdvancedGanttChart />
                      ) : (
                        <KanbanBoard />
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