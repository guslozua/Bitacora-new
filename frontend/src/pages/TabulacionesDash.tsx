import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, PieChart, Pie, Cell, 
  LabelList
} from 'recharts';

interface TabulacionesStats {
  total: number;
  porFechaFinal: { fecha: string; cantidad: number }[];
  porMes: { mes: number; cantidad: number }[];
  completadoPor: { usuario: string; cantidad: number }[];
  creadoPor: { usuario: string; cantidad: number }[];
  rankingTab: { arbol: string; cantidad: number }[];
  diagnostico?: {
    sin_fecha_finalizacion: number;
    sin_completado_por: number;
    sin_creado_por: number;
    sin_nombre_tarea: number;
    total_registros: number;
  };
}

const TabulacionesDash = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [data, setData] = useState<TabulacionesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const query = `year=${selectedYear}&month=${selectedMonth}`;
      const res = await axios.get(`http://localhost:5000/api/tabulaciones/stats?${query}`);
      
      // Procesamiento de datos para asegurar que no haya valores nulos
      const processedData: TabulacionesStats = {
        total: res.data.total || 0,
        
        // Filtrar fechas nulas y ordenar cronológicamente
        porFechaFinal: (res.data.porFechaFinal || [])
          .filter((item: any) => item && item.fecha)
          .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
        
        // Datos agrupados por mes (si existe, sino crear array vacío)
        porMes: res.data.porMes || [],
        
        // Filtrar usuarios nulos y limitar a top 10 para mejor visualización
        completadoPor: (res.data.completadoPor || [])
          .filter((item: any) => item && item.usuario)
          .slice(0, 7),
        
        // Filtrar usuarios nulos y limitar a top 10
        creadoPor: (res.data.creadoPor || [])
          .filter((item: any) => item && item.usuario)
          .slice(0, 7),
        
        // Filtrar árboles nulos y limitar a top 10
        rankingTab: (res.data.rankingTab || [])
          .filter((item: any) => item && item.arbol)
          .slice(0, 7),
          
        // Información de diagnóstico
        diagnostico: res.data.diagnostico
      };
      
      setData(processedData);
    } catch (err) {
      setError('Error al obtener estadísticas');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedYear, selectedMonth]);

  // Paleta de colores igual a la de ItrackerDash
  const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c'];
  const pieColors = ['#3498db', '#2ecc71', '#f1c40f'];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const agruparPorMes = (items: { fecha: string; cantidad: number }[]) => {
    const meses = Array(12).fill(0);
  
    items.forEach((item) => {
      const fecha = new Date(item.fecha);
      const mes = fecha.getMonth(); // 0 = Enero
      meses[mes] += item.cantidad;
    });
  
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
    return meses.map((cantidad, index) => ({
      mes: (index + 1).toString(),
      nombre: nombresMeses[index],
      cantidad,
    }));
  };
  

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0"><strong>{label}</strong></p>
          <p className="mb-0 text-primary">{`${payload[0].name}: ${formatNumber(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
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
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Dashboard Tabulaciones</h2>
            <div className="d-flex gap-2">
              <select
                className="form-select shadow-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">Todos los años</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
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
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : data ? (
            <>
              {/* KPIs con estilo moderno */}
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Total Tareas</h6>
                          <h2 className="fw-bold mb-0">{formatNumber(data.total)}</h2>
                        </div>
                        <div className="bg-light p-3 rounded-circle">
                          <i className="bi bi-collection fs-3 text-dark" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                {data.diagnostico && (
                  <>
                    <Col md={3}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Tareas Finalizadas</h6>
                              <h2 className="fw-bold mb-0 text-primary">
                                {formatNumber(data.diagnostico.total_registros - data.diagnostico.sin_fecha_finalizacion)}
                              </h2>
                            </div>
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                              <i className="bi bi-check-circle fs-3 text-primary" />
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
                              <h2 className="fw-bold mb-0 text-warning">
                                {formatNumber(data.diagnostico.sin_fecha_finalizacion)}
                              </h2>
                            </div>
                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                              <i className="bi bi-clock-history fs-3 text-warning" />
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
                              <h6 className="text-muted mb-1">Sin Usuario</h6>
                              <h2 className="fw-bold mb-0 text-danger">
                                {formatNumber(data.diagnostico.sin_completado_por)}
                              </h2>
                            </div>
                            <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                              <i className="bi bi-exclamation-triangle fs-3 text-danger" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </>
                )}
              </Row>

              {/* Alertas de calidad de datos */}
              {data.diagnostico && data.diagnostico.sin_fecha_finalizacion > 0 && (
                <Alert variant="warning" className="mb-4">
                  <Alert.Heading>Datos incompletos detectados</Alert.Heading>
                  <p>
                    Se detectaron registros con datos incompletos que pueden afectar las estadísticas:
                  </p>
                  <ul>
                    {data.diagnostico.sin_fecha_finalizacion > 0 && (
                      <li>{data.diagnostico.sin_fecha_finalizacion} tareas sin fecha de finalización</li>
                    )}
                    {data.diagnostico.sin_completado_por > 0 && (
                      <li>{data.diagnostico.sin_completado_por} tareas sin información de quién las completó</li>
                    )}
                    {data.diagnostico.sin_creado_por > 0 && (
                      <li>{data.diagnostico.sin_creado_por} tareas sin información de quién las creó</li>
                    )}
                  </ul>
                </Alert>
              )}

              {/* Gráficas reordenadas según solicitud */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Tareas por Mes</h5>
                      <ResponsiveContainer width="100%" height={250}>
                      <LineChart 
  data={data.porFechaFinal?.length > 0 
    ? agruparPorMes(data.porFechaFinal)
    : Array.from({ length: 12 }, (_, i) => ({
        mes: (i + 1).toString(),
        nombre: '',
        cantidad: 0
      }))
  }
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="nombre" />
                           
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="cantidad" 
                            name="Tareas"
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

                {/* Estado de tareas */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Estado de Tareas</h5>
                      {data.diagnostico ? (
                        <div className="d-flex justify-content-center">
                          <ResponsiveContainer width="80%" height={250}>
                            <PieChart>
                              <Pie 
                                data={[
                                  { 
                                    tipo: 'Finalizadas', 
                                    value: data.diagnostico.total_registros - data.diagnostico.sin_fecha_finalizacion 
                                  },
                                  { 
                                    tipo: 'Pendientes', 
                                    value: data.diagnostico.sin_fecha_finalizacion
                                  }
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
                                <Cell fill={pieColors[0]} />
                                <Cell fill={pieColors[1]} />
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
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <p>No hay datos de estado disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                {/* Tareas completadas por usuario */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Tareas Completadas por Usuario</h5>
                      {data.completadoPor && data.completadoPor.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart 
                            data={data.completadoPor} 
                            layout="vertical"
                            margin={{ left: 120 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="usuario" 
                              type="category" 
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="cantidad" 
                              name="Tareas"
                              fill={colors[2]} 
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <p>No hay datos de tareas completadas disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Tareas creadas por usuario */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Ranking Usuarios solicitantes</h5>
                      {data.creadoPor && data.creadoPor.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart 
                            data={data.creadoPor} 
                            layout="vertical"
                            margin={{ left: 120 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="usuario" 
                              type="category" 
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="cantidad" 
                              name="Tareas"
                              fill={colors[3]} 
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <p>No hay datos de creación de tareas disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Ranking de árboles */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Ranking Árboles de Tabulación</h5>
                      {data.rankingTab && data.rankingTab.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart 
                            data={data.rankingTab} 
                            layout="vertical"
                            margin={{ left: 120 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="arbol" 
                              type="category" 
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="cantidad" 
                              name="Tabulaciones"
                              fill={colors[1]} 
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5 text-muted">
                          <p>No hay datos de árboles de tabulación disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : null}
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default TabulacionesDash;