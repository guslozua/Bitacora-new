// components/Informes/InformeIncidentesComponent.tsx
import React, { useEffect, useState } from 'react';
import { Table, Card, Badge, Row, Col } from 'react-bootstrap';
import InformeService, { InformeIncidentesParams } from '../../services/InformeService';
import InformeFilters from './InformeFilters';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface Incidente {
  id: number;
  fechaGuardia: string;
  usuarioGuardia: string;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  descripcion: string;
  estado: string;
  observaciones: string;
  codigos: Array<{
    codigo: string;
    descripcion: string;
    minutos: number;
    importe: number;
  }>;
  totalMinutos: number;
  totalImporte: number;
}

interface Estadisticas {
  totalIncidentes: number;
  totalMinutos: number;
  totalImporte: number;
  porEstado: Record<string, number>;
  porUsuario: Record<string, number>;
  porDiaSemana: Record<string, number>;
}

const InformeIncidentesComponent: React.FC = () => {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [filtros, setFiltros] = useState<InformeIncidentesParams>({});
  const [cargando, setCargando] = useState<boolean>(false);

  // Colores para los gráficos
  const COLORES_ESTADOS = {
    'registrado': '#f1c40f',
    'revisado': '#3498db',
    'aprobado': '#2ecc71',
    'rechazado': '#e74c3c',
    'liquidado': '#9b59b6'
  };
  
  const COLORES_GENERALES = [
    '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', 
    '#1abc9c', '#f39c12', '#d35400', '#c0392b', '#8e44ad'
  ];

  // Función para obtener el informe
  const obtenerInforme = async (params: InformeIncidentesParams = {}) => {
    setCargando(true);
    try {
      const respuesta = await InformeService.getInformeIncidentes(params);
      if (respuesta.success) {
        setIncidentes(respuesta.data.incidentes);
        setEstadisticas(respuesta.data.estadisticas);
      }
    } catch (error) {
      console.error('Error al obtener informe de incidentes:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar informe al montar el componente
  useEffect(() => {
    obtenerInforme();
  }, []);

  // Función para aplicar filtros
  const aplicarFiltros = (nuevosFiltros: InformeIncidentesParams) => {
    setFiltros(nuevosFiltros);
    obtenerInforme(nuevosFiltros);
  };

  // Función para exportar informe
  const exportarInforme = (formato: 'excel' | 'pdf' | 'csv') => {
    InformeService.exportarInformeIncidentes(formato, filtros);
  };

  // Obtener color de badge según el estado
  const obtenerColorBadge = (estado: string) => {
    switch (estado) {
      case 'registrado': return 'warning';
      case 'revisado': return 'info';
      case 'aprobado': return 'success';
      case 'rechazado': return 'danger';
      case 'liquidado': return 'primary';
      default: return 'secondary';
    }
  };

  // Preparar datos para los gráficos
  const datosEstados = estadisticas ? 
    Object.entries(estadisticas.porEstado).map(([estado, cantidad]) => ({
      name: estado,
      value: cantidad
    })) : [];

  const datosUsuarios = estadisticas ? 
    Object.entries(estadisticas.porUsuario).map(([usuario, cantidad]) => ({
      name: usuario,
      cantidad: cantidad
    })) : [];

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
    <div className="informe-incidentes">
      {/* Filtros */}
      <InformeFilters 
        tipo="incidentes" 
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
                  <Col md={4} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Total de incidentes</h6>
                      <h2 className="mb-0">{estadisticas.totalIncidentes}</h2>
                    </div>
                  </Col>
                  <Col md={4} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Total de minutos</h6>
                      <h2 className="mb-0">{estadisticas.totalMinutos}</h2>
                      <small className="text-muted">
                        ({Math.floor(estadisticas.totalMinutos / 60)} horas {estadisticas.totalMinutos % 60} min)
                      </small>
                    </div>
                  </Col>
                  <Col md={4} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Total de importe</h6>
                      <h2 className="mb-0">${estadisticas.totalImporte.toFixed(2)}</h2>
                    </div>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col md={6} className="mb-4">
                    <h6 className="text-center mb-3">Incidentes por Estado</h6>
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
                  <Col md={6} className="mb-4">
                    <h6 className="text-center mb-3">Incidentes por Usuario</h6>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={datosUsuarios}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="cantidad" 
                            name="Incidentes" 
                            fill="#3498db" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Tabla de incidentes */}
          <Card>
            <Card.Header>
              <h5 className="m-0">Listado de incidentes</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha Guardia</th>
                      <th>Usuario</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Duración</th>
                      <th>Estado</th>
                      <th>Códigos</th>
                      <th>Total Min.</th>
                      <th>Total Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidentes.length > 0 ? (
                      incidentes.map((incidente) => (
                        <tr key={incidente.id}>
                          <td>{incidente.id}</td>
                          <td>{incidente.fechaGuardia}</td>
                          <td>{incidente.usuarioGuardia}</td>
                          <td>{new Date(incidente.inicio).toLocaleString()}</td>
                          <td>{new Date(incidente.fin).toLocaleString()}</td>
                          <td>{incidente.duracionMinutos} min</td>
                          <td>
                            <Badge bg={obtenerColorBadge(incidente.estado)}>
                              {incidente.estado}
                            </Badge>
                          </td>
                          <td>
                            {incidente.codigos.map((codigo, index) => (
                              <div key={index} className="mb-1">
                                <small>
                                  <Badge bg="secondary" className="me-1">
                                    {codigo.codigo}
                                  </Badge>
                                  {codigo.minutos} min (${codigo.importe?.toFixed(2) || '0.00'})
                                </small>
                              </div>
                            ))}
                          </td>
                          <td>{incidente.totalMinutos} min</td>
                          <td>${incidente.totalImporte?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="text-center">
                          No se encontraron incidentes con los filtros aplicados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">
                Total: {incidentes.length} incidentes
              </small>
            </Card.Footer>
          </Card>
        </>
      )}
    </div>
  );
};

export default InformeIncidentesComponent;