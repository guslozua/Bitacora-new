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

const Dashboard = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<number | null>(null);
  const [tareas, setTareas] = useState<number | null>(null);
  const [proyectos, setProyectos] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // Sidebar colapsado por defecto
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

  // Estilos para el sidebar y el contenido principal
  const sidebarStyle = {
    minHeight: '100vh',
    width: sidebarCollapsed ? '80px' : '250px',
    position: 'fixed' as 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    transition: 'all 0.3s',
    backgroundColor: '#343a40',
    color: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  const menuItemStyle = {
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '5px',
  };

  const iconStyle = {
    fontSize: '1.5rem',
    marginRight: sidebarCollapsed ? '0' : '10px',
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div className="p-3 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!sidebarCollapsed && (
            <div className="d-flex align-items-center">
              <img
                src="/logoxside.png"
                alt="Logo"
                style={{ width: '60px', height: '60px', marginRight: '10px' }}
              />
              <h5 className="mb-0">TASK manager</h5>
            </div>
          )}
          {sidebarCollapsed && (
            <img
              src="/logoxside.png"
              alt="Logo"
              style={{ width: '40px', height: '40px', margin: '0 auto' }}
            />
          )}
          <Button 
            variant="link" 
            className="text-white p-0" 
            onClick={toggleSidebar}
            style={{ marginLeft: sidebarCollapsed ? '0' : 'auto' }}
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </Button>
        </div>

        <div className="pt-3">
          <div 
            style={menuItemStyle} 
            className="sidebar-item"
            onClick={() => navigate('/dashboard')}
          >
            <i className="bi bi-speedometer2" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>
          <div 
            style={menuItemStyle} 
            className="sidebar-item"
            onClick={() => navigate('/projects')}
          >
            <i className="bi bi-diagram-3-fill" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Proyectos</span>}
          </div>
          <div 
            style={menuItemStyle} 
            className="sidebar-item"
            onClick={() => navigate('/tasks')}
          >
            <i className="bi bi-list-task" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Tareas</span>}
          </div>
          <div 
            style={menuItemStyle} 
            className="sidebar-item"
            onClick={() => navigate('/users')}
          >
            <i className="bi bi-people-fill" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Usuarios</span>}
          </div>
          
          {/* Nuevo elemento: Bitácora */}
          <div 
            style={menuItemStyle} 
            className="sidebar-item"
            onClick={() => navigate('/bitacora')}
          >
            <i className="bi bi-journal-text" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Bitácora</span>}
          </div>
          
          {/* Nuevo elemento: Hitos */}
          <div 
            style={menuItemStyle} 
            className="sidebar-item"
            onClick={() => navigate('/hitos')}
          >
            <i className="bi bi-flag-fill" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Hitos</span>}
          </div>
          
          {/* Separador antes del botón de cerrar sesión */}
          <div style={{ 
            height: '1px', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            margin: '10px 15px' 
          }}></div>
          
          <div 
            style={menuItemStyle} 
            className="sidebar-item"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right" style={iconStyle}></i>
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
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

              {/* GANTT */}
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <GanttChart />
                </Card.Body>
              </Card>
            </>
          )}
        </Container>
        
        {/* Footer */}
        <footer style={{
          backgroundColor: '#343a40',
          color: 'white',
          padding: '10px 0',
          textAlign: 'center',
          width: '100%',
          marginTop: 'auto'
        }}>
          <div className="d-flex justify-content-center align-items-center">
            
            <span>Desarrollado por <img 
              src="/logoxside.png" 
              alt="ATPC Logo" 
              style={{ 
                height: '40px', 
                marginRight: '10px',
                objectFit: 'contain'
              }} 
            /> </span>
            <small>- AseguramientoTecnicoydePlataformasdeContacto@teco.com.ar</small>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;