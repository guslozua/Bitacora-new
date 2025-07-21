// components/SessionChartsPanel.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { sessionAnalysisService } from '../services/sessionAnalysisService';

interface ChartsPanelProps {
  stats: {
    versionesReceiver: Array<{
      version_receiver: string;
      cantidad: number;
      porcentaje: number;
    }>;
    distribucionUbicacion: Array<{
      ubicacion: string;
      total: number;
      activas: number;
      porcentaje: number;
    }>;
  };
}

const SessionChartsPanel: React.FC<ChartsPanelProps> = ({ stats }) => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [historicalDays, setHistoricalDays] = useState(30);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  useEffect(() => {
    loadHistoricalData();
  }, [historicalDays]);

  const loadHistoricalData = async () => {
    try {
      setLoadingHistorical(true);
      const response = await sessionAnalysisService.getHistoricalData(historicalDays);
      if (response.success) {
        setHistoricalData(response.data.map((item: any) => ({
          ...item,
          fecha_formatted: new Date(item.fecha_corte).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric'
          })
        })));
      }
    } catch (error) {
      console.error('Error cargando datos históricos:', error);
    } finally {
      setLoadingHistorical(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  // Datos para el gráfico de torta con colores personalizados
  const pieData = stats.distribucionUbicacion.map((item, index) => ({
    ...item,
    name: item.ubicacion === 'Home Office' ? '🏠 Home Office' : `🏢 ${item.ubicacion}`,
    value: item.total,
    color: COLORS[index % COLORS.length]
  }));

  // Custom label para el pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <>
      {/* Gráficos principales */}
      <Row className="mb-4 g-3">
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-pie-chart-fill me-2 text-primary"></i>
                Distribución por Ubicación
              </h5>
              <small className="text-muted">Total de sesiones por tipo de ubicación</small>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `${value.toLocaleString()} sesiones`, 
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-bar-chart-fill me-2 text-success"></i>
                Versiones de Receiver
              </h5>
              <small className="text-muted">Top versiones más utilizadas</small>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.versionesReceiver.slice(0, 6)} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="version_receiver" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`${value} sesiones`, 'Cantidad']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Bar dataKey="cantidad" fill="#28a745" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráfico histórico */}
      {historicalData.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0 d-flex align-items-center">
                      <i className="bi bi-graph-up me-2 text-info"></i>
                      Tendencia Histórica
                    </h5>
                    <small className="text-muted">Evolución de sesiones en el tiempo</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {loadingHistorical && (
                      <Spinner animation="border" size="sm" />
                    )}
                    <Form.Select 
                      style={{width: 'auto'}}
                      value={historicalDays}
                      onChange={(e) => setHistoricalDays(parseInt(e.target.value))}
                      size="sm"
                    >
                      <option value={7}>Últimos 7 días</option>
                      <option value={15}>Últimos 15 días</option>
                      <option value={30}>Últimos 30 días</option>
                      <option value={60}>Últimos 60 días</option>
                      <option value={90}>Últimos 90 días</option>
                    </Form.Select>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={loadHistoricalData}
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="fecha_formatted"
                      fontSize={11}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `Fecha: ${value}`}
                      formatter={(value: any, name: any) => {
                        const labels: {[key: string]: string} = {
                          'total_sesiones': 'Total Sesiones',
                          'total_home': 'Home Office',
                          'total_call_center': 'Call Centers',
                          'total_vm_pic': 'Máquinas VM PIC'
                        };
                        return [value?.toLocaleString(), labels[name] || name];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total_sesiones" 
                      stroke="#007bff" 
                      strokeWidth={3}
                      name="Total Sesiones"
                      dot={{ fill: '#007bff', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_home" 
                      stroke="#17a2b8" 
                      strokeWidth={2}
                      name="Home Office"
                      dot={{ fill: '#17a2b8', r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_call_center" 
                      stroke="#ffc107" 
                      strokeWidth={2}
                      name="Call Centers"
                      dot={{ fill: '#ffc107', r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_vm_pic" 
                      stroke="#28a745" 
                      strokeWidth={2}
                      name="Máquinas VM PIC"
                      dot={{ fill: '#28a745', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla de detalle por ubicación */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-table me-2 text-secondary"></i>
                Detalle por Ubicación
              </h5>
              <small className="text-muted">Análisis detallado de actividad por ubicación</small>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 py-3">
                        <i className="bi bi-geo-alt me-1"></i>
                        Ubicación
                      </th>
                      <th className="border-0 py-3 text-center">Total Sesiones</th>
                      <th className="border-0 py-3 text-center">Sesiones Activas</th>
                      <th className="border-0 py-3 text-center">% del Total</th>
                      <th className="border-0 py-3 text-center">Tasa de Actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.distribucionUbicacion.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <i className={`bi ${item.ubicacion === 'Home Office' ? 'bi-house-fill text-info' : 'bi-building-fill text-warning'} me-2 fs-5`}></i>
                            <span className="fw-medium">{item.ubicacion}</span>
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <strong className="text-primary">{item.total.toLocaleString()}</strong>
                        </td>
                        <td className="text-center py-3">
                          <strong className="text-success">{item.activas.toLocaleString()}</strong>
                        </td>
                        <td className="text-center py-3">
                          <strong className="text-dark">{(parseFloat(item.porcentaje.toString()) || 0).toFixed(1)}%</strong>
                        </td>
                        <td className="text-center py-3">
                          <div className="d-flex align-items-center justify-content-center">
                            <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                style={{ width: `${item.total > 0 ? (item.activas / item.total) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <small className="fw-bold">
                              {item.total > 0 ? ((item.activas / item.total) * 100).toFixed(1) : 0}%
                            </small>
                          </div>
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
  );
};

export default SessionChartsPanel;