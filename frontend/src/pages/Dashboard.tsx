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

import GanttView from '../components/GanttView'; // Asegurate de que el path coincida con tu estructura

const Dashboard = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [tareas, setTareas] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center" style={{ flex: 1 }}>
          <img
            src="/logox.png"
            alt="Logo"
            style={{ width: '80px', height: '80px', marginRight: '20px' }}
          />
          <div style={{ flexGrow: 1, textAlign: 'center' }}>
            <h2 className="mb-0">Bienvenido, {nombre}</h2>
          </div>
        </div>
        <div>
          <Button variant="outline-secondary" className="me-2">
            <i className="bi bi-plus me-2"></i>
            Nueva Tarea
          </Button>
          <Button variant="outline-primary">
            <i className="bi bi-plus me-2"></i>
            Nuevo Proyecto
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
                        <Cell fill="#FA8072" /> {/* Usuarios */}
                        <Cell fill="#7B8EFA" /> {/* Tareas */}
                        <Cell fill="#ff0080" /> {/* Proyectos */}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* NUEVA SECCIÓN: GANTT */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <GanttView />
            </Card.Body>
          </Card>

          {/* BOTONES */}
          <Row className="mb-4 text-center">
            <Col md={4}>
              <Button variant="primary" className="w-100" onClick={() => navigate('/users')}>
                <i className="bi bi-people-fill me-2"></i>
                Usuarios
              </Button>
            </Col>
            <Col md={4}>
              <Button variant="success" className="w-100" onClick={() => navigate('/projects')}>
                <i className="bi bi-diagram-3-fill me-2"></i>
                Proyectos
              </Button>
            </Col>
            <Col md={4}>
              <Button variant="warning" className="w-100" onClick={() => navigate('/tasks')}>
                <i className="bi bi-list-task me-2"></i>
                Tareas
              </Button>
            </Col>
          </Row>

          <div className="text-center">
            <Button variant="outline-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar sesión
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
