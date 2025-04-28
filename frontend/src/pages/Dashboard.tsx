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
  CartesianGrid,
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
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Bienvenido, {nombre}</h2>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary">
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
              <Row className="g-4 mb-4">
                <Col md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Proyectos Activos</h6>
                          <h2 className="fw-bold mb-0">{proyectos ?? 0}</h2>
                        </div>
                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
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
                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
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
                        <div className="bg-success bg-opacity-10 p-3 rounded-circle">
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
