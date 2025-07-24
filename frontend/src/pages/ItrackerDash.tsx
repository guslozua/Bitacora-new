import React, { useEffect, useState } from 'react';
import { Container, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import Sidebar from '../components/Sidebar';
import ThemedFooter from '../components/ThemedFooter'; // 🔥 CAMBIO: Footer temático
import ItrackerTable from '../components/ItrackerTable'; // Importamos el componente de tabla
import { useTheme } from '../context/ThemeContext'; // 🔥 AGREGAR IMPORT

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

const ItrackerDash = () => {
  const { isDarkMode } = useTheme(); // 🔥 AGREGAR HOOK
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // 🎨 COLORES DINÁMICOS SEGÚN EL TEMA
  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        // Modo oscuro
        background: '#212529',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        textMuted: '#6c757d',
        gridColor: '#495057',
        tooltipBg: 'rgba(52, 58, 64, 0.95)'
      };
    } else {
      return {
        // Modo claro (original)
        background: '#ffffff',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        textMuted: '#94a3b8',
        gridColor: '#f0f0f0',
        tooltipBg: 'rgba(255, 255, 255, 0.95)'
      };
    }
  };

  const themeColors = getThemeColors();

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
    backgroundColor: themeColors.background, // 🔥 AGREGAR BACKGROUND DINÁMICO
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = `year=${selectedYear}&month=${selectedMonth}`;
        const res = await axios.get(`${API_BASE_URL}/itracker/stats?${query}`);
        setData(res.data);
        console.log('👉 Centros:', res.data.porCentro);
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedMonth]);

  // Paleta de colores más moderna y profesional
  const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c'];
  const pieColors = ['#3498db', '#2ecc71', '#f1c40f'];

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

  // NUEVO: Función para obtener los años disponibles basados en el año actual
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i);

  const centrosFiltrados = data?.porCentro
    ?.filter((item: any) => item?.centro && item.centro.trim() !== '')
    ?.map((item: any) => ({ centro: item.centro.trim(), cantidad: item.cantidad }));

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // 🎨 TOOLTIP ADAPTADO AL TEMA
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-2 border shadow-sm rounded"
          style={{
            backgroundColor: themeColors.tooltipBg,
            color: themeColors.textPrimary,
            borderColor: isDarkMode ? '#6c757d' : '#dee2e6'
          }}
        >
          <p className="mb-0"><strong>{label}</strong></p>
          <p className="mb-0 text-primary">{`${payload[0].name}: ${formatNumber(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  // NUEVO: Componente para mostrar la última actualización de datos
  const renderUltimaActualizacion = () => {
    const getLatestUpdateDate = () => {
      if (!data || !data.ultimaActualizacion) {
        // Si no existe en la respuesta del backend, usar la fecha actual como fallback
        const today = new Date();
        return today.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }

      const latestDate = data.ultimaActualizacion;

      // Parsear la fecha (asumiendo que viene en formato dd/mm/yyyy o similar)
      const parts = latestDate.split('/');
      if (parts.length === 3) {
        // Si está en formato dd/mm/yyyy
        const [day, month, year] = parts;

        // Crear fecha utilizando UTC para evitar ajustes de zona horaria
        const parsedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));

        if (isNaN(parsedDate.getTime())) {
          return 'Fecha no válida';
        }

        // Formateamos la fecha para mostrarla en el formato 'dd/mm/yyyy'
        return parsedDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC'
        });
      } else {
        // Intentar un formato estándar
        const parsedDate = new Date(latestDate);

        if (isNaN(parsedDate.getTime())) {
          return 'Fecha no válida';
        }

        // Crear una nueva fecha en UTC para eliminar el efecto de la zona horaria
        const utcDate = new Date(Date.UTC(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate()
        ));

        return utcDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC'
        });
      }
    };

    const latestInfo = getLatestUpdateDate();

    return (
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-3 text-center" style={{ color: themeColors.textPrimary }}>
            <i className="bi bi-clock-history me-2 text-primary"></i>
            Última Actualización de Datos
          </h5>
          <div className="fs-3 mb-2 text-center" style={{ color: themeColors.textMuted }}>
            {latestInfo}
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold" style={{ color: themeColors.textPrimary }}>
              Dashboard iTracker
            </h2>
            <div className="d-flex gap-2">
              <select
                className="form-select shadow-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">Todos los años</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
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
              {/* KPIs - Mejorados con estilo moderno */}
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1" style={{ color: themeColors.textMuted }}>Total Tickets</h6>
                          <h2 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
                            {formatNumber(data.total)}
                          </h2>
                        </div>
                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0,
                            backgroundColor: isDarkMode ? '#495057' : '#f8f9fa'
                          }}>
                          <i className="bi bi-collection fs-3" style={{ color: themeColors.textPrimary }} />
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
                          <h6 className="mb-1" style={{ color: themeColors.textMuted }}>Masivos</h6>
                          <h2 className="fw-bold mb-0 text-primary">{formatNumber(data.masivos)}</h2>
                        </div>
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-graph-up-arrow fs-3 text-primary" />
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
                          <h6 className="mb-1" style={{ color: themeColors.textMuted }}>Puntuales</h6>
                          <h2 className="fw-bold mb-0 text-success">{formatNumber(data.puntuales)}</h2>
                        </div>
                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-wrench-adjustable-circle fs-3 text-success" />
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
                          <h6 className="mb-1" style={{ color: themeColors.textMuted }}>ABM</h6>
                          <h2 className="fw-bold mb-0 text-warning">{formatNumber(data.abm)}</h2>
                        </div>
                        <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-person-badge fs-3 text-warning" />
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
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Tickets por Mes
                      </h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data.porMes.map((d: { mes: number, cantidad: number }) => ({ mes: d.mes.toString(), cantidad: d.cantidad }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
                          <XAxis 
                            dataKey="mes"
                            tick={{ fill: themeColors.textSecondary }}
                            tickFormatter={(mes) => {
                              const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                              return nombres[parseInt(mes) - 1] || mes;
                            }}
                          />
                          <YAxis tick={{ fill: themeColors.textSecondary }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="cantidad"
                            name="Tickets"
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

                {/* Masivos vs Puntuales */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Masivos vs Puntuales
                      </h5>
                      <div className="d-flex justify-content-center">
                        <ResponsiveContainer width="80%" height={250}>
                          <PieChart>
                            <Pie
                              data={[
                                { tipo: 'Masivos', value: data.masivos },
                                { tipo: 'Puntuales', value: data.puntuales },
                                { tipo: 'ABM', value: data.abm }
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
                              {[
                                { tipo: 'Masivos', value: data.masivos },
                                { tipo: 'Puntuales', value: data.puntuales },
                                { tipo: 'ABM', value: data.abm }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconType="circle"
                              wrapperStyle={{ color: themeColors.textPrimary }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Tickets por Herramienta
                      </h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={data.porCausa.slice(0, 7)}
                          layout="vertical"
                          margin={{ left: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} horizontal={false} />
                          <XAxis type="number" tick={{ fill: themeColors.textSecondary }} />
                          <YAxis
                            dataKey="causa"
                            type="category"
                            tick={{ fontSize: 10, fill: themeColors.textSecondary }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="cantidad"
                            name="Tickets"
                            fill={colors[2]}
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Tickets por Centro
                      </h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={(centrosFiltrados || []).slice(0, 7)}
                          layout="vertical"
                          margin={{ left: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} horizontal={false} />
                          <XAxis type="number" tick={{ fill: themeColors.textSecondary }} />
                          <YAxis
                            dataKey="centro"
                            type="category"
                            tick={{ fontSize: 10, fill: themeColors.textSecondary }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="cantidad"
                            name="Tickets"
                            fill={colors[3]}
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Usuarios de Cierre */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Usuarios de Cierre
                      </h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={data.usuariosCierre.slice(0, 7)}
                          layout="vertical"
                          margin={{ left: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} horizontal={false} />
                          <XAxis type="number" tick={{ fill: themeColors.textSecondary }} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 10, fill: themeColors.textSecondary }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="cantidad"
                            name="Tickets"
                            fill={colors[1]}
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Nube de tags */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Palabras más usadas en comentarios
                      </h5>
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        {data.tags.map((tag: { palabra: string; veces: number }, idx: number) => (
                          <span
                            key={idx}
                            className="badge rounded-pill"
                            style={{
                              backgroundColor: colors[idx % colors.length],
                              fontSize: `${Math.min(1 + (tag.veces / 10), 1.5)}rem`,
                              padding: '8px 12px',
                              color: '#ffffff'
                            }}
                          >
                            {tag.palabra} ({tag.veces})
                          </span>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Componente de tabla */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <ItrackerTable />
                </Col>
              </Row>

              {/* Última actualización de datos al final */}
              {renderUltimaActualizacion()}
            </>
          ) : null}
        </Container>

        <ThemedFooter />
      </div>
    </div>
  );
};

export default ItrackerDash;