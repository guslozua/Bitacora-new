// components/Informes/InformeLiquidacionesComponent.tsx
import React, { useEffect, useState } from 'react';
import { Table, Card, Badge, Row, Col, Accordion } from 'react-bootstrap';
import InformeService, { InformeLiquidacionesParams } from '../../services/InformeService';
import InformeFilters from './InformeFilters';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface Detalle {
  id: number;
  usuario: string;
  fecha: string;
  totalMinutos: number;
  totalImporte: number;
}

interface Liquidacion {
  id: number;
  periodo: string;
  fechaGeneracion: string;
  estado: string;
  observaciones: string;
  detalles: Detalle[];
  totalMinutos: number;
  totalImporte: number;
}

interface Estadisticas {
  totalLiquidaciones: number;
  totalImporte: number;
  porEstado: Record<string, number>;
  porPeriodo: Record<string, { cantidad: number; importe: number }>;
}

const InformeLiquidacionesComponent: React.FC = () => {
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [filtros, setFiltros] = useState<InformeLiquidacionesParams>({});
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Colores para los gráficos
  const COLORES_ESTADOS = {
    'pendiente': '#f1c40f',
    'enviada': '#3498db',
    'procesada': '#2ecc71',
    'cerrada': '#9b59b6'
  };
  
  const COLORES_GENERALES = [
    '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', 
    '#1abc9c', '#f39c12', '#d35400', '#c0392b', '#8e44ad'
  ];

  // Función para obtener el informe
  const obtenerInforme = async (params: InformeLiquidacionesParams = {}) => {
    setCargando(true);
    setError(null);
    try {
      console.log('Obteniendo informe con parámetros:', params);
      const respuesta = await InformeService.getInformeLiquidaciones(params);
      console.log('Respuesta del servicio:', respuesta);
      
      if (respuesta && respuesta.success && respuesta.data) {
        // Validar estructura de datos
        const { liquidaciones: liquidacionesData = [], estadisticas: estadisticasData } = respuesta.data;
        
        setLiquidaciones(Array.isArray(liquidacionesData) ? liquidacionesData : []);
        
        // Validar estadísticas
        if (estadisticasData && typeof estadisticasData === 'object') {
          setEstadisticas({
            totalLiquidaciones: estadisticasData.totalLiquidaciones || 0,
            totalImporte: estadisticasData.totalImporte || 0,
            porEstado: estadisticasData.porEstado || {},
            porPeriodo: estadisticasData.porPeriodo || {}
          });
        } else {
          // Estadísticas por defecto si no vienen del backend
          setEstadisticas({
            totalLiquidaciones: liquidacionesData.length || 0,
            totalImporte: 0,
            porEstado: {},
            porPeriodo: {}
          });
        }
      } else {
        console.warn('Respuesta inválida del servicio:', respuesta);
        setLiquidaciones([]);
        setEstadisticas({
          totalLiquidaciones: 0,
          totalImporte: 0,
          porEstado: {},
          porPeriodo: {}
        });
      }
    } catch (error) {
      console.error('Error al obtener informe de liquidaciones:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setLiquidaciones([]);
      setEstadisticas({
        totalLiquidaciones: 0,
        totalImporte: 0,
        porEstado: {},
        porPeriodo: {}
      });
    } finally {
      setCargando(false);
    }
  };

  // Cargar informe al montar el componente
  useEffect(() => {
    obtenerInforme();
  }, []);

  // Función para aplicar filtros
  const aplicarFiltros = (nuevosFiltros: InformeLiquidacionesParams) => {
    setFiltros(nuevosFiltros);
    obtenerInforme(nuevosFiltros);
  };

  // Función para exportar informe
  const exportarInforme = (formato: 'excel' | 'pdf' | 'csv') => {
    InformeService.exportarInformeLiquidaciones(formato, filtros);
  };

  // Obtener color de badge según el estado
  const obtenerColorBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'enviada': return 'info';
      case 'procesada': return 'success';
      case 'cerrada': return 'primary';
      default: return 'secondary';
    }
  };

  // Preparar datos para los gráficos - CON VALIDACIÓN
  const datosEstados = estadisticas && estadisticas.porEstado ? 
    Object.entries(estadisticas.porEstado || {}).map(([estado, cantidad]) => ({
      name: estado,
      value: typeof cantidad === 'number' ? cantidad : 0
    })) : [];

  const datosPeriodos = estadisticas && estadisticas.porPeriodo ? 
    Object.entries(estadisticas.porPeriodo || {}).map(([periodo, datos]) => ({
      name: periodo,
      cantidad: (datos && typeof datos === 'object' && typeof datos.cantidad === 'number') ? datos.cantidad : 0,
      importe: (datos && typeof datos === 'object' && typeof datos.importe === 'number') ? datos.importe : 0
    })) : [];

  // Custom tooltip para los gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0"><strong>{payload[0].name}</strong></p>
          <p className="mb-0">
            {payload[0].value || payload[0].payload.cantidad} 
            {payload[0].payload.percent ? ` (${(payload[0].payload.percent * 100).toFixed(1)}%)` : ''}
          </p>
          {payload.length > 1 && (
            <p className="mb-0">
              {`Importe: $${payload[1].value.toFixed(2)}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Mostrar error si existe
  if (error) {
    return (
      <div className="informe-liquidaciones">
        <InformeFilters 
          tipo="liquidaciones" 
          onFilter={aplicarFiltros} 
          onExport={exportarInforme} 
        />
        <Card className="mt-3">
          <Card.Body>
            <div className="alert alert-danger">
              <h4>Error al cargar el informe</h4>
              <p>{error}</p>
              <button 
                className="btn btn-primary" 
                onClick={() => obtenerInforme(filtros)}
              >
                Reintentar
              </button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="informe-liquidaciones">
      {/* Filtros */}
      <InformeFilters 
        tipo="liquidaciones" 
        onFilter={aplicarFiltros} 
        onExport={exportarInforme} 
      />

      {cargando ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del informe...</p>
        </div>
      ) : (
        <>
          {/* Estadísticas */}
          {estadisticas && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="m-0">Estadísticas generales</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Total de liquidaciones</h6>
                      <h2 className="mb-0">{estadisticas.totalLiquidaciones}</h2>
                    </div>
                  </Col>
                  <Col md={6} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Total de importe</h6>
                      <h2 className="mb-0">${estadisticas.totalImporte.toFixed(2)}</h2>
                    </div>
                  </Col>
                </Row>

                {/* Solo mostrar gráficos si hay datos */}
                {(datosEstados.length > 0 || datosPeriodos.length > 0) && (
                  <Row className="mt-4">
                    {datosEstados.length > 0 && (
                      <Col md={6} className="mb-4">
                        <h6 className="text-center mb-3">Liquidaciones por Estado</h6>
                        <div style={{ height: '250px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={datosEstados}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {datosEstados.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORES_ESTADOS[entry.name as keyof typeof COLORES_ESTADOS] || COLORES_GENERALES[index % COLORES_GENERALES.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Col>
                    )}
                    
                    {datosPeriodos.length > 0 && (
                      <Col md={datosEstados.length > 0 ? 6 : 12} className="mb-4">
                        <h6 className="text-center mb-3">Liquidaciones por Periodo</h6>
                        <div style={{ height: '250px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={datosPeriodos}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis yAxisId="left" orientation="left" stroke="#3498db" />
                              <YAxis yAxisId="right" orientation="right" stroke="#e74c3c" />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              <Bar 
                                dataKey="cantidad" 
                                name="Liquidaciones" 
                                yAxisId="left"
                                fill="#3498db" 
                              />
                              <Bar 
                                dataKey="importe" 
                                name="Importe" 
                                yAxisId="right"
                                fill="#e74c3c" 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Col>
                    )}
                  </Row>
                )}

                {/* Mensaje si no hay datos para gráficos */}
                {datosEstados.length === 0 && datosPeriodos.length === 0 && (
                  <div className="text-center mt-4">
                    <p className="text-muted">No hay datos suficientes para mostrar gráficos</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Tabla de liquidaciones */}
          <Card>
            <Card.Header>
              <h5 className="m-0">Liquidaciones</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Accordion>
                {liquidaciones.length > 0 ? (
                  liquidaciones.map((liquidacion, index) => (
                    <Accordion.Item key={liquidacion.id} eventKey={index.toString()}>
                      <Accordion.Header>
                        <div className="d-flex w-100 justify-content-between align-items-center">
                          <div>
                            <strong>Periodo:</strong> {liquidacion.periodo}
                          </div>
                          <div className="ms-2">
                            <Badge bg={obtenerColorBadge(liquidacion.estado)} className="ms-2">
                              {liquidacion.estado}
                            </Badge>
                          </div>
                          <div className="ms-2">
                            <strong>Fecha generación:</strong> {new Date(liquidacion.fechaGeneracion).toLocaleString()}
                          </div>
                          <div className="ms-2">
                            <strong>Total:</strong> ${liquidacion.totalImporte.toFixed(2)}
                          </div>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="mb-3">
                          <strong>Observaciones:</strong> {liquidacion.observaciones || "Sin observaciones"}
                        </div>
                        
                        <h6>Detalles de la liquidación</h6>
                        <div className="table-responsive">
                          <Table striped bordered hover size="sm">
                            <thead>
                              <tr>
                                <th>Usuario</th>
                                <th>Fecha</th>
                                <th>Total Minutos</th>
                                <th>Total Importe</th>
                              </tr>
                            </thead>
                            <tbody>
                              {liquidacion.detalles && liquidacion.detalles.length > 0 ? (
                                liquidacion.detalles.map((detalle) => (
                                  <tr key={detalle.id}>
                                    <td>{detalle.usuario}</td>
                                    <td>{detalle.fecha}</td>
                                    <td>{detalle.totalMinutos} min</td>
                                    <td>${detalle.totalImporte.toFixed(2)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="text-center text-muted">
                                    No hay detalles disponibles
                                  </td>
                                </tr>
                              )}
                              <tr className="table-info">
                                <td colSpan={2} className="text-end">
                                  <strong>Totales:</strong>
                                </td>
                                <td>
                                  <strong>{liquidacion.totalMinutos} min</strong>
                                </td>
                                <td>
                                  <strong>${liquidacion.totalImporte.toFixed(2)}</strong>
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted mb-0">
                      No se encontraron liquidaciones con los filtros aplicados
                    </p>
                  </div>
                )}
              </Accordion>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">
                Total: {liquidaciones.length} liquidaciones
              </small>
            </Card.Footer>
          </Card>
        </>
      )}
    </div>
  );
};

export default InformeLiquidacionesComponent;