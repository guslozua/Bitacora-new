import React, { useEffect, useState } from 'react';
import { Container, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import PlacasTable from '../components/PlacasTable';
import PlacaFormModal from '../components/PlacaFormModal';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

interface PlacasStats {
  total: number;
  por_impacto: {
    bajo: number;
    medio: number;
    alto: number;
  };
  por_clase: Array<{  // Nuevo
    clase: string;
    cantidad: number;
  }>;
  por_sistema: Array<{  // Nuevo
    sistema: string;
    cantidad: number;
  }>;
  por_mes: Array<{
    mes: number;
    cantidad: number;
  }>;
  duracion_promedio: number;
  estado: {
    resueltas: number;
    pendientes: number;
  };
  top_usuarios: Array<{
    cerrado_por: string;
    cantidad: number;
  }>;
  duracion_por_impacto: Array<{
    impacto: string;
    promedio: number;
  }>;
}

const PlacasDash = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [stats, setStats] = useState<PlacasStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const query = `year=${selectedYear}&month=${selectedMonth}`;
        const res = await axios.get(`http://localhost:5000/api/placas/stats?${query}`);
        setStats(res.data);
      } catch (err) {
        setError('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedYear, selectedMonth, refreshData]);

  // Función para manejar la actualización después de crear/editar una placa
  const handlePlacaChange = () => {
    setRefreshData(prev => prev + 1);
  };

  // Paleta de colores moderna
  const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c'];
  const impactColors = {
    bajo: '#2ecc71',   // Verde
    medio: '#f1c40f',  // Amarillo
    alto: '#e74c3c'    // Rojo
  };
  
  const claseColors = {
    'Incidente': '#e74c3c',      // Rojo
    'Comunicado': '#3498db',     // Azul
    'Mantenimiento': '#9b59b6'   // Morado
  };

  const months = [
    { label: 'Todos', value: 'all' },
    { label: 'Enero', value: '1' },
    { label: 'Febrero', value: '2' },
    { label: 'Marzo', value: '3' },
    { label: 'Abril', value: '4' },
    { label: 'Mayo', value: '5' },
    { label: 'Junio', value: '6' },
    { label: 'Julio', value: '7' },
    { label: 'Agosto', value: '8' },
    { label: 'Septiembre', value: '9' },
    { label: 'Octubre', value: '10' },
    { label: 'Noviembre', value: '11' },
    { label: 'Diciembre', value: '12' }
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Helper para convertir minutos en formato horas:minutos
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0"><strong>{label}</strong></p>
          <p className="mb-0 text-primary">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Dashboard Placas y Novedades</h2>
            <div className="d-flex gap-2">
              <select
                className="form-select shadow-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">Todos los años</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <select
                className="form-select shadow-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <button
                className="btn btn-primary shadow-sm"
                onClick={() => setShowModal(true)}
              >
                <i className="bi bi-plus-circle me-1"></i> Nueva Placa
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : stats ? (
            <>
              {/* KPIs */}
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Total Placas</h6>
                          <h2 className="fw-bold mb-0">{formatNumber(stats.total)}</h2>
                        </div>
                        <div className="bg-light p-3 rounded-circle">
                          <i className="bi bi-clipboard-data fs-3 text-dark" />
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
                          <h6 className="text-muted mb-1">Impacto Alto</h6>
                          <h2 className="fw-bold mb-0 text-danger">{formatNumber(stats.por_impacto.alto)}</h2>
                        </div>
                        <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                          <i className="bi bi-exclamation-triangle fs-3 text-danger" />
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
                          <h6 className="text-muted mb-1">Duración Promedio</h6>
                          <h2 className="fw-bold mb-0 text-info">{formatDuration(stats.duracion_promedio)}</h2>
                        </div>
                        <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                          <i className="bi bi-hourglass-split fs-3 text-info" />
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
                          <h6 className="text-muted mb-1">Pendientes</h6>
                          <h2 className="fw-bold mb-0 text-warning">{formatNumber(stats.estado.pendientes)}</h2>
                        </div>
                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                          <i className="bi bi-clock-history fs-3 text-warning" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Gráficas */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Placas por Mes</h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={stats.por_mes.map(d => ({ mes: d.mes.toString(), cantidad: d.cantidad }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="mes"
                            tickFormatter={(mes) => {
                              const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                              return nombres[parseInt(mes) - 1] || mes;
                            }} 
                          />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="cantidad" 
                            name="Placas"
                            stroke={colors[0]} 
                            strokeWidth={2}
                            dot={{ r: 5, strokeWidth: 1 }}
                            activeDot={{ r: 7, stroke: colors[0] }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Distribución por Impacto */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Distribución por Impacto</h5>
                      <div className="d-flex justify-content-center">
                        <ResponsiveContainer width="80%" height={250}>
                          <PieChart>
                            <Pie 
                              data={[
                                { tipo: 'Bajo', value: stats.por_impacto.bajo }, 
                                { tipo: 'Medio', value: stats.por_impacto.medio },
                                { tipo: 'Alto', value: stats.por_impacto.alto }
                              ]} 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={100} 
                              innerRadius={60}
                              dataKey="value" 
                              nameKey="tipo"
                              label={({ tipo, percent }) => `${tipo}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              <Cell fill={impactColors.bajo} />
                              <Cell fill={impactColors.medio} />
                              <Cell fill={impactColors.alto} />
                            </Pie>
                            <Tooltip />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Nuevas gráficas por clase y sistema */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Distribución por Clase</h5>
                      <div className="d-flex justify-content-center">
                        <ResponsiveContainer width="80%" height={250}>
                          <PieChart>
                            <Pie 
                              data={stats.por_clase} 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={100} 
                              innerRadius={60}
                              dataKey="cantidad" 
                              nameKey="clase"
                              label={({ clase, percent }) => `${clase}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {stats.por_clase.map((entry) => (
                                <Cell 
                                  key={entry.clase} 
                                  fill={claseColors[entry.clase as keyof typeof claseColors] || colors[0]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Top Sistemas Afectados</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={stats.por_sistema} 
                          layout="vertical"
                          margin={{ left: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="sistema" 
                            type="category" 
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="cantidad" 
                            name="Placas"
                            fill={colors[4]} 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Duración Promedio por Impacto</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={stats.duracion_por_impacto} 
                          layout="vertical"
                          margin={{ left: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                          <XAxis 
                            type="number" 
                            label={{ value: 'Minutos', position: 'bottom' }}
                          />
                          <YAxis 
                            dataKey="impacto" 
                            type="category" 
                            tick={{ fontSize: 10 }}
                            tickFormatter={(impacto) => impacto.charAt(0).toUpperCase() + impacto.slice(1)}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${value} min (${formatDuration(value)})`, 'Duración Promedio']}
                          />
                          <Bar 
                            dataKey="promedio" 
                            name="Duración"
                            fill={colors[2]} 
                            radius={[0, 4, 4, 0]}
                          >
                            {stats.duracion_por_impacto.map((entry) => (
                              <Cell 
                                key={entry.impacto} 
                                fill={impactColors[entry.impacto as keyof typeof impactColors]} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Top Usuarios de Cierre</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart 
                          data={stats.top_usuarios} 
                          layout="vertical"
                          margin={{ left: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="cerrado_por" 
                            type="category" 
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="cantidad" 
                            name="Placas Cerradas"
                            fill={colors[3]} 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Estado: Resueltas vs Pendientes */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Estado de Placas</h5>
                      <div className="d-flex justify-content-center">
                        <ResponsiveContainer width="80%" height={250}>
                          <PieChart>
                            <Pie 
                              data={[
                                { estado: 'Resueltas', value: stats.estado.resueltas }, 
                                { estado: 'Pendientes', value: stats.estado.pendientes }
                              ]} 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={100} 
                              innerRadius={60}
                              dataKey="value" 
                              nameKey="estado"
                              label={({ estado, percent }) => `${estado}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              <Cell fill="#2ecc71" /> {/* Verde para resueltas */}
                              <Cell fill="#f1c40f" /> {/* Amarillo para pendientes */}
                            </Pie>
                            <Tooltip />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Componente de tabla */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <PlacasTable 
                    year={selectedYear} 
                    month={selectedMonth}
                    onPlacaChange={handlePlacaChange}
                  />
                </Col>
              </Row>
            </>
          ) : null}
        </Container>

        {/* Modal para añadir/editar placas */}
        <PlacaFormModal 
          show={showModal} 
          onHide={() => setShowModal(false)}
          onSave={handlePlacaChange}
        />

        <Footer />
      </div>
    </div>
  );
};

export default PlacasDash;