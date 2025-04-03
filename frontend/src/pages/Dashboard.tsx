import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Spinner } from 'react-bootstrap';
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
} from 'recharts';

import GanttChart from '../components/GanttChart';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const Dashboard = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [tareas, setTareas] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const token = localStorage.getItem('token');

  let user = {};
  try {
    const raw = localStorage.getItem('user');
    user = raw ? JSON.parse(raw) : {};
  } catch {
    user = {};
  }

  const nombre = (user as any)?.nombre || 'Usuario';

  const chartData = [
    { nombre: 'Usuarios', cantidad: usuarios ?? 0 },
    { nombre: 'Tareas', cantidad: tareas ?? 0 },
    { nombre: 'Proyectos', cantidad: proyectos ?? 0 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
          },
        };

        const [usersRes, tasksRes, projectsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users', config),
          axios.get('http://localhost:5000/api/tasks', config),
          axios.get('http://localhost:5000/api/projects', config),
        ]);

        setUsuarios(usersRes.data.length);
        setTareas(tasksRes.data?.data?.length || 0);
        setProyectos(projectsRes.data?.data?.length || 0);

        const proyectosRecientes = projectsRes.data.data.slice(-3).reverse();
        const tareasRecientes = tasksRes.data.data.slice(-3).reverse();

        const actividad: string[] = [];

        proyectosRecientes.forEach((p: any) => {
          actividad.push(`📁 Nuevo proyecto creado: ${p.nombre}`);
        });

        tareasRecientes.forEach((t: any) => {
          actividad.push(`📝 Nueva tarea: ${t.titulo}`);
        });

        setActividadReciente(actividad);
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
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
      <Sidebar
        collapsed={sidebarCollapsed}
        toggle={toggleSidebar}
        onLogout={handleLogout}
      />

      <div style={contentStyle}>
        <Container className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center" style={{ flex: 1 }}>
              <div style={{ flexGrow: 1 }}>
                <h2 className="mb-0">Bienvenido, {nombre}</h2>
              </div>
            </div>
            <div>
              <Button variant="outline-secondary" className="me-2">
                <i className="bi bi-plus me-2"></i>
                Nueva Proyecto
              </Button>
              <Button variant="outline-primary">
                <i className="bi bi-plus me-2"></i>
                Nueva Tarea
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="text-center shadow-sm">
                    <Card.Body>
                      <i className="bi bi-diagram-3-fill mb-2 text-primary" style={{ fontSize: '1.8rem' }}></i>
                      <Card.Title>Proyectos Activos</Card.Title>
                      <h3>{proyectos ?? 0}</h3>
                      <small>+info</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center shadow-sm">
                    <Card.Body>
                      <i className="bi bi-list-task mb-2 text-warning" style={{ fontSize: '1.8rem' }}></i>
                      <Card.Title>Tareas Pendientes</Card.Title>
                      <h3>{tareas ?? 0}</h3>
                      <small>+info</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center shadow-sm">
                    <Card.Body>
                      <i className="bi bi-people-fill mb-2 text-success" style={{ fontSize: '1.8rem' }}></i>
                      <Card.Title>Usuarios</Card.Title>
                      <h3>{usuarios ?? 0}</h3>
                      <small>En el sistema</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <Card.Title>Actividad Reciente</Card.Title>
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
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <Card.Title>Reportes Rápidos</Card.Title>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          layout="vertical"
                          data={chartData}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          barCategoryGap={20}
                        >
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

              <Card className="shadow-sm mb-4">
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
