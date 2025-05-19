// components/Informes/DashboardResumen.tsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Form, Button, Table } from 'react-bootstrap';
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
  
  // Colores para los gráficos
  const COLORS = [
    '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', 
    '#1abc9c', '#f39c12', '#d35400', '#c0392b', '#8e44ad'
  ];
  
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
  
  // Preparar datos para el gráfico de incidentes por estado
  const datosIncidentesPorEstado = resumenData?.incidentesPorEstado.map(item => ({
    name: item.estado,
    value: item.cantidad
  })) || [];
  
  // Preparar datos para el gráfico de guardias por usuario
  const datosGuardiasPorUsuario = resumenData?.guardiasPorUsuario.map(item => ({
    name: item.usuario,
    cantidad: item.cantidad
  })) || [];
  
  // Custom tooltip para los gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0"><strong>{payload[0].name}</strong></p>
          <p className="mb-0">
            {payload[0].value} ({payload[0].payload.percent ? `${(payload[0].payload.percent * 100).toFixed(1)}%` : ''})
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="dashboard-resumen">
      <Card className="mb-4">
        <Card.Header>
          <h4 className="m-0">Dashboard Resumen</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit} className="mb-4">
            <Row className="align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label><strong>Seleccionar periodo</strong></Form.Label>
                  <Form.Control
                    type="month"
                    value={periodo}
                    onChange={handlePeriodoChange}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="w-100">
                  Aplicar
                </Button>
              </Col>
            </Row>
          </Form>
          
          {cargando ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando datos del resumen...</p>
            </div>
          ) : resumenData ? (
            <>
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h5>Periodo: {resumenData.periodo.nombre}</h5>
                      <p>Desde: {new Date(resumenData.periodo.fechaInicio).toLocaleDateString()} hasta: {new Date(resumenData.periodo.fechaFin).toLocaleDateString()}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100 text-center">
                    <Card.Body>
                      <h5 className="text-muted">Total de Guardias</h5>
                      <h2 className="display-4">{resumenData.totalGuardias}</h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 text-center">
                    <Card.Body>
                      <h5 className="text-muted">Total de Incidentes</h5>
                      <h2 className="display-4">{resumenData.totalIncidentes}</h2>
                      {resumenData.estadisticasTiempo && (
                        <small className="text-muted">
                          Tiempo total: {resumenData.estadisticasTiempo.tiempoTotalHoras} horas
                        </small>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {resumenData.estadisticasTiempo && (
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="h-100 text-center">
                      <Card.Body>
                        <h5 className="text-muted">Tiempo Total de Incidentes</h5>
                        <h2 className="display-4">{resumenData.estadisticasTiempo.tiempoTotalHoras}</h2>
                        <p>horas</p>
                        <small className="text-muted">
                          ({resumenData.estadisticasTiempo.tiempoTotalMinutos} minutos)
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 text-center">
                      <Card.Body>
                        <h5 className="text-muted">Promedio por Incidente</h5>
                        <h2 className="display-4">{resumenData.estadisticasTiempo.promedioDuracionHoras}</h2>
                        <p>horas</p>
                        <small className="text-muted">
                          ({resumenData.estadisticasTiempo.promedioDuracionMinutos} minutos)
                        </small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
              
              <Row className="mb-4">
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5 className="m-0">Incidentes por Estado</h5>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={datosIncidentesPorEstado}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {datosIncidentesPorEstado.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5 className="m-0">Guardias por Usuario</h5>
                    </Card.Header>
                    <Card.Body>
                      <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={datosGuardiasPorUsuario}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              scale="band" 
                              width={120}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar 
                              dataKey="cantidad" 
                              name="Guardias"
                              fill="#3498db" 
                              background={{ fill: '#eee' }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5 className="m-0">Distribución de Guardias</h5>
                    </Card.Header>
                    <Card.Body>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Cantidad</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumenData.guardiasPorUsuario.map((item, index) => (
                            <tr key={index}>
                              <td>{item.usuario}</td>
                              <td>{item.cantidad}</td>
                              <td>{((item.cantidad / resumenData.totalGuardias) * 100).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5 className="m-0">Distribución de Incidentes</h5>
                    </Card.Header>
                    <Card.Body>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Estado</th>
                            <th>Cantidad</th>
                            <th>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumenData.incidentesPorEstado.map((item, index) => (
                            <tr key={index}>
                              <td>{item.estado}</td>
                              <td>{item.cantidad}</td>
                              <td>{((item.cantidad / resumenData.totalIncidentes) * 100).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <div className="text-center my-5">
              <p>No hay datos disponibles para mostrar.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default DashboardResumen;