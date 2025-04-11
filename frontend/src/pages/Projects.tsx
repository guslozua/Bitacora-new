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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: { 'x-auth-token': token || '' },
        };
        await axios.get('http://localhost:5000/api/projects', config);
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
        <Container className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Gestión de Proyectos</h2>
            <Button variant="outline-primary" onClick={() => setShowOffcanvas(true)}>
              <i className="bi bi-plus me-2"></i>
              Nuevo Proyecto
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Row className="mb-4">
              <Col md={12}>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <AdvancedGanttChart />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>

        <Footer />
      </div>

      <Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Nuevo Proyecto</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group controlId="formProjectName" className="mb-3">
              <Form.Label>Nombre del Proyecto</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={projectData.name}
                onChange={handleInputChange}
                placeholder="Ej. Plataforma Genesys"
              />
            </Form.Group>

            <Form.Group controlId="formProjectDescription" className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={projectData.description}
                onChange={handleInputChange}
                placeholder="Breve descripción del proyecto"
              />
            </Form.Group>

            <Form.Group controlId="formProjectStartDate" className="mb-3">
              <Form.Label>Fecha de Inicio</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={projectData.startDate}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="formProjectEndDate" className="mb-3">
              <Form.Label>Fecha de Fin</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={projectData.endDate}
                min={projectData.startDate || undefined}
                onChange={handleInputChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowOffcanvas(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCreateProject}>
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
