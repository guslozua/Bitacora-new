import React, { useEffect, useState } from 'react';
import { Container, Spinner, Alert, Row, Col, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import PlacasTable from '../components/PlacasTable';
import PlacaFormModal from '../components/PlacaFormModal';
import DistribucionTemporalGrafico from '../components/DistribucionTemporalGrafico';
import PlacasPorMesLineChart from '../components/PlacasPorMesLineChart';

// 🔐 IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { PLACA_PERMISSIONS, REPORT_PERMISSIONS } from '../utils/permissions';
import AccessDenied from './AccessDenied';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid,
  Area, ComposedChart
} from 'recharts';

interface PlacasStats {
  total: number;
  por_clase: {
    Incidente: number;
    Comunicado: number;
    Mantenimiento: number;
  };
  por_impacto: {
    bajo: number;
    medio: number;
    alto: number;
  };
  por_sistema: Array<{
    sistema: string;
    cantidad: number;
  }>;
  por_mes: Array<{
    mes: number;
    cantidad: number;
  }>;
  por_mes_cierre?: Array<{
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
    maximo: number;
    minimo: number;
    cantidad?: number;
  }>;
}

const PlacasDash = () => {
  const navigate = useNavigate();
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  // 🔐 VERIFICAR ACCESO A LA PÁGINA COMPLETA
  const canViewPlacas = hasPermission(PLACA_PERMISSIONS.VIEW_ALL_PLACAS);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [stats, setStats] = useState<PlacasStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [refreshData, setRefreshData] = useState(0);
  const [mostrarPorCierre, setMostrarPorCierre] = useState(false);


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
        const res = await axios.get(`${API_BASE_URL}/placas/stats?${query}`);
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
    'Incidente': '#dc3545',      // Rojo
    'Comunicado': '#0dcaf0',     // Cyan
    'Mantenimiento': '#0d6efd'   // Azul oscuro 
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

  // Helper para convertir minutos en formato horas:minutos (redondeado)
  const formatDuration = (minutes: number | null) => {
    // Para valores no disponibles (null)
    if (minutes === null) {
      return 'N/D';
    }

    // Asegurarse de que sea un número válido
    if (isNaN(minutes) || minutes === null || minutes === undefined) {
      return '0h 0m';
    }

    // Redondear a minutos enteros
    minutes = Math.round(minutes);

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
  };

  // Esta función actualizada procesa los datos que vienen del backend mejorado
  const procesarDatosPorImpacto = () => {
    // Definimos el tipo para mayor seguridad
    type NivelImpacto = 'alto' | 'medio' | 'bajo';
    type ResultadoImpacto = {
      promedio: number;
      maximo: number;
      minimo: number;
      cantidad: number;
    };

    // Datos iniciales para cada nivel de impacto (todos en -1 para indicar "sin datos")
    const resultados: Record<NivelImpacto, ResultadoImpacto> = {
      alto: { promedio: -1, maximo: -1, minimo: -1, cantidad: stats?.por_impacto?.alto || 0 },
      medio: { promedio: -1, maximo: -1, minimo: -1, cantidad: stats?.por_impacto?.medio || 0 },
      bajo: { promedio: -1, maximo: -1, minimo: -1, cantidad: stats?.por_impacto?.bajo || 0 }
    };

    // Si no hay datos o no está cargado, devuelve los valores iniciales
    if (!stats || !stats.duracion_por_impacto || !Array.isArray(stats.duracion_por_impacto) || stats.duracion_por_impacto.length === 0) {
      console.warn("No hay datos de duración por impacto disponibles");
      return resultados;
    }

    // Debug: ver qué datos llegan del backend
    console.log("Datos de duración por impacto:", stats.duracion_por_impacto);

    // Procesar datos por impacto
    stats.duracion_por_impacto.forEach(item => {
      // Verificar que el impacto sea una de las claves válidas y que los datos sean válidos
      const impacto = item.impacto;
      if ((impacto === 'alto' || impacto === 'medio' || impacto === 'bajo') && item) {
        // Ahora asignamos todos los valores que vienen del backend, con validación
        resultados[impacto].promedio = item.promedio !== undefined && !isNaN(item.promedio) ?
          Math.round(item.promedio) : -1;

        resultados[impacto].maximo = item.maximo !== undefined && !isNaN(item.maximo) ?
          item.maximo : -1;

        resultados[impacto].minimo = item.minimo !== undefined && !isNaN(item.minimo) ?
          item.minimo : -1;

        resultados[impacto].cantidad = item.cantidad !== undefined && !isNaN(item.cantidad) ?
          item.cantidad : stats?.por_impacto?.[impacto] || 0;
      }
    });

    return resultados;
  };
  // Tooltip genérico mejorado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0 fw-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="mb-0" style={{ color: entry.color || entry.stroke || entry.fill }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 🔐 CONTROL DE ACCESO PRINCIPAL - Si no tiene permisos, mostrar página de acceso denegado
  if (!permissionsLoading && !canViewPlacas) {
    return <AccessDenied />;
  }

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Dashboard Novedades</h2>
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
              
              {/* 🔐 BOTÓN NUEVA PLACA - Solo con permisos */}
              <PermissionGate 
                permission={PLACA_PERMISSIONS.CREATE_PLACA}
                fallback={
                  <button className="btn btn-outline-secondary shadow-sm" disabled>
                    <i className="bi bi-lock me-1"></i> Sin permisos
                  </button>
                }
              >
                <button
                  className="btn btn-primary shadow-sm"
                  onClick={() => setShowModal(true)}
                >
                  <i className="bi bi-plus-circle me-1"></i> Nueva Placa
                </button>
              </PermissionGate>
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
              {/* KPI Principal Rediseñado - Ancho completo */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Total Placas y Novedades</h5>
                      <div className="d-flex align-items-center">
                        <div className="text-center px-4">
                          <h1 className="display-2 fw-bold">{formatNumber(stats.total)}</h1>
                        </div>
                        <div className="d-flex flex-grow-1 justify-content-center">
                          <div className="d-flex gap-4">
                            <div className="text-center">
                              <Badge bg="danger" className="mb-2 px-4 py-2 fs-6">
                                <i className="bi bi-exclamation-triangle me-1"></i> Incidentes
                              </Badge>
                              <h2 className="mb-0 fw-bold">{formatNumber(stats.por_clase?.Incidente || 0)}</h2>
                            </div>
                            <div className="text-center">
                              <Badge bg="info" className="mb-2 px-4 py-2 fs-6">
                                <i className="bi bi-info-circle me-1"></i> Comunicados
                              </Badge>
                              <h2 className="mb-0 fw-bold">{formatNumber(stats.por_clase?.Comunicado || 0)}</h2>
                            </div>
                            <div className="text-center">
                              <Badge bg="primary" className="mb-2 px-4 py-2 fs-6">
                                <i className="bi bi-tools me-1"></i> Mantenimientos
                              </Badge>
                              <h2 className="mb-0 fw-bold">{formatNumber(stats.por_clase?.Mantenimiento || 0)}</h2>
                            </div>
                          </div>
                        </div>
                        <div className="d-none d-lg-block ms-4">
                          <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                              <Pie
                                data={[
                                  { clase: 'Incidente', cantidad: stats.por_clase?.Incidente || 0 },
                                  { clase: 'Comunicado', cantidad: stats.por_clase?.Comunicado || 0 },
                                  { clase: 'Mantenimiento', cantidad: stats.por_clase?.Mantenimiento || 0 }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={55}
                                dataKey="cantidad"
                                nameKey="clase"
                              >
                                <Cell fill={claseColors['Incidente']} />
                                <Cell fill={claseColors['Comunicado']} />
                                <Cell fill={claseColors['Mantenimiento']} />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="progress mt-3" style={{ height: '10px' }}>
                        <div
                          className="progress-bar bg-danger"
                          role="progressbar"
                          style={{
                            width: `${stats.total ? (stats.por_clase?.Incidente / stats.total) * 100 : 0}%`
                          }}
                          aria-valuenow={(stats.por_clase?.Incidente || 0)}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        ></div>
                        <div
                          className="progress-bar bg-info"
                          role="progressbar"
                          style={{
                            width: `${stats.total ? (stats.por_clase?.Comunicado / stats.total) * 100 : 0}%`
                          }}
                          aria-valuenow={(stats.por_clase?.Comunicado || 0)}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        ></div>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{
                            width: `${stats.total ? (stats.por_clase?.Mantenimiento / stats.total) * 100 : 0}%`
                          }}
                          aria-valuenow={(stats.por_clase?.Mantenimiento || 0)}
                          aria-valuemin={0}
                          aria-valuemax={stats.total}
                        ></div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* KPIs Secundarios (sin Placas Resueltas) */}
              <Row className="g-4 mb-4">
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Incidentes - Impacto Alto</h6>
                          <h2 className="fw-bold mb-0 text-danger">{formatNumber(stats.por_impacto.alto)}</h2>
                        </div>
                        <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-exclamation-triangle fs-3 text-danger" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Incidentes - Impacto Medio</h6>
                          <h2 className="fw-bold mb-0 text-warning">{formatNumber(stats.por_impacto.medio)}</h2>
                        </div>
                        <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-exclamation-circle fs-3 text-warning" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Incidentes - Impacto Bajo</h6>
                          <h2 className="fw-bold mb-0 text-success">{formatNumber(stats.por_impacto.bajo)}</h2>
                        </div>
                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0
                          }}>
                          <i className="bi bi-info-circle fs-3 text-success" />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="text-muted mb-1">Placas Pendientes</h6>
                          <h2 className="fw-bold mb-0 text-warning">{formatNumber(stats.estado.pendientes)}</h2>
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

              {/* Gráficas */}
              <Row className="g-4 mb-4">
                {/* NUEVO GRÁFICO DE LÍNEAS AQUÍ */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <PlacasPorMesLineChart
                        year={selectedYear}
                        month={selectedMonth}
                        porMesData={stats.por_mes || []}
                        porMesCierreData={stats.por_mes_cierre || []}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                {/* Distribución por Impacto de Incidentes */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Distribución por Impacto (Incidentes)</h5>
                      <div className="d-flex justify-content-center">
                        <ResponsiveContainer width="100%" height={280}>
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
                              innerRadius={65}
                              dataKey="value"
                              nameKey="tipo"
                              label={(entry) => `${entry.tipo}: ${entry.value}`}
                              labelLine={{ stroke: '#ccc', strokeWidth: 0.5, strokeDasharray: '3 3' }}
                            >
                              <Cell fill={impactColors.bajo} />
                              <Cell fill={impactColors.medio} />
                              <Cell fill={impactColors.alto} />
                            </Pie>
                            <Tooltip formatter={(value) => [formatNumber(value as number), 'Cantidad']} />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconType="circle"
                              layout="horizontal"
                              formatter={(value) => <span style={{ color: '#333' }}>{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Gráficas adicionales */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3">Distribución por Clase</h5>
                      <div className="d-flex justify-content-center">
                        <ResponsiveContainer width="100%" height={330}>
                          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Pie
                              data={[
                                { clase: 'Incidente', cantidad: stats.por_clase?.Incidente || 0 },
                                { clase: 'Comunicado', cantidad: stats.por_clase?.Comunicado || 0 },
                                { clase: 'Mantenimiento', cantidad: stats.por_clase?.Mantenimiento || 0 }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              innerRadius={65}
                              dataKey="cantidad"
                              nameKey="clase"
                              paddingAngle={3}
                              label={({ clase, percent }) => {
                                return `${clase} (${(percent * 100).toFixed(0)}%)`;
                              }}
                              labelLine={{ stroke: '#ccc', strokeWidth: 0.5 }}
                            >
                              <Cell fill={claseColors['Incidente']} />
                              <Cell fill={claseColors['Comunicado']} />
                              <Cell fill={claseColors['Mantenimiento']} />
                            </Pie>
                            <Tooltip formatter={(value) => [formatNumber(value as number), 'Cantidad']} />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconType="circle"
                              layout="horizontal"
                              formatter={(value) => <span style={{ color: '#333' }}>{value}</span>}
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
                      <ResponsiveContainer width="100%" height={330}>
                        <BarChart
                          data={stats.por_sistema.slice(0, 8)} // Limitamos a los 8 principales para mayor claridad
                          margin={{ top: 50, right: 20, left: 20, bottom: 90 }}
                          barSize={30} // Barras más delgadas
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="sistema"
                            tick={{ fontSize: 10 }}
                            interval={0}
                            tickFormatter={(value) => value.length > 10 ? `${value.slice(0, 10)}...` : value}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis tickFormatter={(value) => formatNumber(value)} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="cantidad"
                            name="Placas"
                            fill={colors[4]}
                            radius={[4, 4, 0, 0]}
                          >
                            {stats.por_sistema.slice(0, 8).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                              />
                            ))}
                          </Bar>
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
                      <h5 className="fw-bold mb-3">Tiempos de Resolución por Impacto</h5>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr>
                              <th className="text-center">Impacto</th>
                              <th className="text-center">Promedio</th>
                              <th className="text-center">Máximo</th>
                              <th className="text-center">Mínimo</th>
                              <th className="text-center">Incidentes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const datosProcesados = procesarDatosPorImpacto();
                              return (
                                <>
                                  {/* Fila para impacto Alto */}
                                  <tr>
                                    <td className="text-center">
                                      <span className="badge bg-danger px-3 py-2">
                                        <i className="bi bi-exclamation-triangle me-1"></i> Alto
                                      </span>
                                    </td>
                                    <td className="text-center fw-bold">
                                      {formatDuration(datosProcesados.alto.promedio)}
                                    </td>
                                    <td className="text-center">
                                      {formatDuration(datosProcesados.alto.maximo)}
                                    </td>
                                    <td className="text-center">
                                      {formatDuration(datosProcesados.alto.minimo)}
                                    </td>
                                    <td className="text-center">
                                      <span className="badge bg-secondary">
                                        {formatNumber(stats.por_impacto.alto)}
                                      </span>
                                    </td>
                                  </tr>

                                  {/* Fila para impacto Medio */}
                                  <tr>
                                    <td className="text-center">
                                      <span className="badge bg-warning px-3 py-2">
                                        <i className="bi bi-exclamation-circle me-1"></i> Medio
                                      </span>
                                    </td>
                                    <td className="text-center fw-bold">
                                      {formatDuration(datosProcesados.medio.promedio)}
                                    </td>
                                    <td className="text-center">
                                      {formatDuration(datosProcesados.medio.maximo)}
                                    </td>
                                    <td className="text-center">
                                      {formatDuration(datosProcesados.medio.minimo)}
                                    </td>
                                    <td className="text-center">
                                      <span className="badge bg-secondary">
                                        {formatNumber(stats.por_impacto.medio)}
                                      </span>
                                    </td>
                                  </tr>

                                  {/* Fila para impacto Bajo */}
                                  <tr>
                                    <td className="text-center">
                                      <span className="badge bg-success px-3 py-2">
                                        <i className="bi bi-info-circle me-1"></i> Bajo
                                      </span>
                                    </td>
                                    <td className="text-center fw-bold">
                                      {formatDuration(datosProcesados.bajo.promedio)}
                                    </td>
                                    <td className="text-center">
                                      {formatDuration(datosProcesados.bajo.maximo)}
                                    </td>
                                    <td className="text-center">
                                      {formatDuration(datosProcesados.bajo.minimo)}
                                    </td>
                                    <td className="text-center">
                                      <span className="badge bg-secondary">
                                        {formatNumber(stats.por_impacto.bajo)}
                                      </span>
                                    </td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <PermissionGate 
                    permission={REPORT_PERMISSIONS.VIEW_REPORTS}
                    fallback={
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center py-4">
                          <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
                          <h6 className="text-muted">Usuarios de Cierre</h6>
                          <p className="text-muted small">No tienes permisos para ver información de usuarios</p>
                        </Card.Body>
                      </Card>
                    }
                  >
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h5 className="fw-bold mb-3">Usuarios de Cierre</h5>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart
                            data={stats.top_usuarios}
                            layout="vertical"
                            margin={{ left: 120 }}
                            barSize={22}
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
                            >
                              {stats.top_usuarios.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={`${colors[3]}${90 - index * 15}`}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </PermissionGate>
                </Col>
              </Row>

              {/* Gráfico de distribución temporal */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <DistribucionTemporalGrafico
                        year={selectedYear}
                        month={selectedMonth}
                      />
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