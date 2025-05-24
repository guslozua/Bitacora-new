// components/Informes/DashboardResumen.tsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Form, Button, Badge, Spinner } from 'react-bootstrap';
import InformeService from '../../services/InformeService';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface ResumenData {
  periodo: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  };
  totalGuardias: number;
  totalIncidentes: number;
  guardiasPorUsuario: Array<{
    usuario: string;
    cantidad: number;
  }>;
  incidentesPorEstado: Array<{
    estado: string;
    cantidad: number;
  }>;
  estadisticasTiempo?: {
    tiempoTotalMinutos: number;
    tiempoTotalHoras: string;
    promedioDuracionMinutos: number;
    promedioDuracionHoras: string;
  };
}

const DashboardResumen: React.FC = () => {
  const [resumenData, setResumenData] = useState<ResumenData | null>(null);
  const [periodo, setPeriodo] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [cargando, setCargando] = useState<boolean>(false);
  
  // Colores más modernos y profesionales - misma paleta que iTracker
  const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c'];
  
  const estadoColors = {
    'registrado': '#f1c40f',    // Amarillo
    'revisado': '#3498db',      // Azul  
    'aprobado': '#2ecc71',      // Verde
    'rechazado': '#e74c3c',     // Rojo
    'liquidado': '#9b59b6'      // Púrpura
  };
  
  const obtenerResumen = async (periodoParam: string = periodo) => {
    setCargando(true);
    try {
      const respuesta = await InformeService.getInformeResumen(periodoParam);
      if (respuesta.success) {
        setResumenData(respuesta.data);
      }
    } catch (error) {
      console.error('Error al obtener el resumen:', error);
    } finally {
      setCargando(false);
    }
  };
  
  useEffect(() => {
    obtenerResumen();
  }, []);
  
  const handlePeriodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPeriodo(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    obtenerResumen(periodo);
  };
  
  // Preparar datos para los gráficos
  const datosIncidentesPorEstado = resumenData?.incidentesPorEstado?.map(item => ({
    name: item.estado,
    value: item.cantidad
  })) || [];
  
  const datosGuardiasPorUsuario = resumenData?.guardiasPorUsuario?.map(item => ({
    name: item.usuario,
    cantidad: item.cantidad
  })) || [];
  
  // Helper functions
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Custom tooltip mejorado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0 fw-bold">{payload[0].name || label}</p>
          <p className="mb-0" style={{ color: payload[0].color }}>
            Cantidad: {formatNumber(payload[0].value)}
            {payload[0].payload.percent && ` (${(payload[0].payload.percent * 100).toFixed(1)}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'registrado': return 'warning';
      case 'revisado': return 'info';
      case 'aprobado': return 'success';
      case 'rechazado': return 'danger';
      case 'liquidado': return 'primary';
      default: return 'secondary';
    }
  };
  
  return (
    <div className="dashboard-resumen">
      {/* Header simplificado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold">Dashboard de Guardias e Incidentes</h2>
        <div className="d-flex gap-2">
          <Form onSubmit={handleSubmit} className="d-flex gap-2">
            <Form.Control
              type="month"
              value={periodo}
              onChange={handlePeriodoChange}
              className="shadow-sm"
            />
            <Button variant="primary" type="submit" className="shadow-sm">
              <i className="bi bi-search"></i>
            </Button>
          </Form>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : resumenData ? (
        <>
          {/* KPIs principales - Estilo similar a iTracker */}
          <Row className="g-4 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-1">Total Guardias</h6>
                      <h2 className="fw-bold mb-0 text-primary">{formatNumber(resumenData.totalGuardias)}</h2>
                    </div>
                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '3.5rem', height: '3.5rem' }}>
                      <i className="bi bi-shield-check fs-3 text-primary" />
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
                      <h6 className="text-muted mb-1">Total Incidentes</h6>
                      <h2 className="fw-bold mb-0 text-warning">{formatNumber(resumenData.totalIncidentes)}</h2>
                      <small className="text-muted">tratados en guardia</small>
                    </div>
                    <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '3.5rem', height: '3.5rem' }}>
                      <i className="bi bi-exclamation-triangle fs-3 text-warning" />
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
                      <h6 className="text-muted mb-1">Usuarios Activos</h6>
                      <h2 className="fw-bold mb-0 text-success">{resumenData.guardiasPorUsuario.length}</h2>
                      <small className="text-muted">en el período seleccionado</small>
                    </div>
                    <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '3.5rem', height: '3.5rem' }}>
                      <i className="bi bi-people fs-3 text-success" />
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
                      <h6 className="text-muted mb-1">Incidentes Activos</h6>
                      <h2 className="fw-bold mb-0 text-info">
                        {datosIncidentesPorEstado
                          .filter(item => item.name !== 'liquidado')
                          .reduce((sum, item) => sum + item.value, 0)}
                      </h2>
                    </div>
                    <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '3.5rem', height: '3.5rem' }}>
                      <i className="bi bi-clock-history fs-3 text-info" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Información del período - más compacta */}
          <Row className="g-4 mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold mb-1">Período de análisis</h6>
                      <p className="mb-0 text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        {new Date(resumenData.periodo.fechaInicio).toLocaleDateString('es-ES')} 
                        {' - '}
                        {new Date(resumenData.periodo.fechaFin).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Badge bg="primary" className="fs-6 px-3 py-2">
                      {resumenData.periodo.nombre}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Estadísticas de tiempo - solo si existen */}
          {resumenData.estadisticasTiempo && (
            <Row className="g-4 mb-4">
              <Col md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Tiempo Total</h6>
                        <h3 className="fw-bold mb-0 text-info">
                          {formatDuration(resumenData.estadisticasTiempo.tiempoTotalMinutos)}
                        </h3>
                      </div>
                      <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '3.5rem', height: '3.5rem' }}>
                        <i className="bi bi-clock-history fs-3 text-info" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Promedio por Incidente</h6>
                        <h3 className="fw-bold mb-0 text-success">
                          {formatDuration(resumenData.estadisticasTiempo.promedioDuracionMinutos)}
                        </h3>
                      </div>
                      <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '3.5rem', height: '3.5rem' }}>
                        <i className="bi bi-speedometer2 fs-3 text-success" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Gráficas principales - Mejoradas */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Incidentes por Estado</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={datosIncidentesPorEstado}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {datosIncidentesPorEstado.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={estadoColors[entry.name as keyof typeof estadoColors] || colors[index % colors.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Guardias por Usuario</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={datosGuardiasPorUsuario}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="cantidad" 
                        name="Guardias"
                        radius={[0, 4, 4, 0]}
                      >
                        {datosGuardiasPorUsuario.map((entry, index) => (
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

          {/* Tablas simplificadas */}
          <Row className="g-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Distribución de Guardias</h5>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Usuario</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumenData.guardiasPorUsuario.map((item, index) => (
                          <tr key={index}>
                            <td className="fw-bold">{item.usuario}</td>
                            <td className="text-center">
                              <Badge bg="primary">{formatNumber(item.cantidad)}</Badge>
                            </td>
                            <td className="text-center">
                              {((item.cantidad / resumenData.totalGuardias) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Estados de Incidentes</h5>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Estado</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumenData.incidentesPorEstado.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <Badge bg={getBadgeVariant(item.estado)} className="px-3 py-2">
                                {item.estado}
                              </Badge>
                            </td>
                            <td className="text-center fw-bold">
                              {formatNumber(item.cantidad)}
                            </td>
                            <td className="text-center">
                              {((item.cantidad / resumenData.totalIncidentes) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div className="text-center my-5">
          <div className="bg-light rounded p-4">
            <i className="bi bi-info-circle fs-1 text-muted"></i>
            <p className="mt-2 text-muted">No hay datos disponibles para mostrar.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardResumen;