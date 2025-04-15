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
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import AdvancedGanttChart from '../components/AdvancedGanttChart';
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
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  // Estados para los KPIs
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
        
        // 1. Proyectos activos
        const activos = proyectos.length;
        setProyectosActivos(activos);
        
        // 2. Tareas pendientes
        const pendientes = tareas.filter((tarea: any) => 
          tarea.estado !== 'completada' && tarea.estado !== 'finalizada'
        ).length;
        setTareasPendientes(pendientes);
        
        // 3. Porcentaje completado (tareas completadas / total de tareas)
        const completadas = tareas.filter((tarea: any) => 
          tarea.estado === 'completada' || tarea.estado === 'finalizada'
        ).length;
        
        const totalTareas = tareas.length;
        const porcentaje = totalTareas > 0 
          ? Math.round((completadas / totalTareas) * 100) 
          : 0;
        
        setPorcentajeCompletado(porcentaje);
        
        // 4. Proyectos próximos a vencer (en los próximos 7 días)
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
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Proyectos Activos</h6>
                          <h2 className="fw-bold mb-0">{proyectosActivos}</h2>
                        </div>
                        <div className="bg-light p-3 rounded-circle">
                          <i className="bi bi-kanban fs-3 text-dark" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Tareas Pendientes</h6>
                          <h2 className="fw-bold mb-0 text-primary">{tareasPendientes}</h2>
                        </div>
                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                          <i className="bi bi-check2-square fs-3 text-primary" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Completados</h6>
                          <h2 className="fw-bold mb-0 text-success">{porcentajeCompletado}%</h2>
                        </div>
                        <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                          <i className="bi bi-graph-up fs-3 text-success" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Próximos a Vencer</h6>
                          <h2 className="fw-bold mb-0 text-warning">{proximosVencer}</h2>
                        </div>
                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                          <i className="bi bi-clock-history fs-3 text-warning" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Diagrama de Gantt después de los KPIs */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm mb-4">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Diagrama de Gantt</h5>
                      <AdvancedGanttChart />
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