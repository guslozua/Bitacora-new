// components/Informes/InformeGuardiasComponent.tsx
import React, { useEffect, useState } from 'react';
import { Table, Card, Badge, Row, Col } from 'react-bootstrap';
import InformeService, { InformeGuardiasParams } from '../../services/InformeService';
import InformeFilters from './InformeFilters';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface Guardia {
  id: number;
  fecha: string;
  usuario: string;
  diaSemana: string;
  esFeriado: boolean;
  esFinSemana: boolean;
  notas: string;
  fechaCreacion: string;
}

interface Estadisticas {
  totalGuardias: number;
  porUsuario: Record<string, number>;
  porDiaSemana: Record<string, number>;
  guardiasEnFeriados: number;
  guardiasEnFinDeSemana: number;
}

const InformeGuardiasComponent: React.FC = () => {
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [filtros, setFiltros] = useState<InformeGuardiasParams>({});
  const [cargando, setCargando] = useState<boolean>(false);

  // Colores para los gráficos
  const COLORES_DIAS_SEMANA = {
    'Lunes': '#3498db',
    'Martes': '#2ecc71',
    'Miércoles': '#9b59b6',
    'Jueves': '#f39c12',
    'Viernes': '#e74c3c',
    'Sábado': '#f1c40f',
    'Domingo': '#1abc9c'
  };

  const COLORES_TIPO_DIAS = ['#3498db', '#f1c40f', '#e74c3c'];
  
  const COLORES_GENERALES = [
    '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6',
    '#1abc9c', '#f39c12', '#d35400', '#c0392b', '#8e44ad'
  ];

  // Función para obtener el informe
  const obtenerInforme = async (params: InformeGuardiasParams = {}) => {
    setCargando(true);
    try {
      const respuesta = await InformeService.getInformeGuardias(params);
      if (respuesta.success) {
        setGuardias(respuesta.data.guardias);
        setEstadisticas(respuesta.data.estadisticas);
      }
    } catch (error) {
      console.error('Error al obtener informe de guardias:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar informe al montar el componente
  useEffect(() => {
    obtenerInforme();
  }, []);

  // Función para aplicar filtros
  const aplicarFiltros = (nuevosFiltros: InformeGuardiasParams) => {
    setFiltros(nuevosFiltros);
    obtenerInforme(nuevosFiltros);
  };

  // Función para exportar informe
  const exportarInforme = (formato: 'excel' | 'pdf' | 'csv') => {
    InformeService.exportarInformeGuardias(formato, filtros);
  };

  // Preparar datos para los gráficos
  const datosDiasSemana = estadisticas ? 
    Object.entries(estadisticas.porDiaSemana).map(([dia, cantidad]) => ({
      name: dia,
      value: cantidad
    })) : [];

  const datosUsuarios = estadisticas ? 
    Object.entries(estadisticas.porUsuario).map(([usuario, cantidad]) => ({
      name: usuario,
      cantidad: cantidad
    })) : [];

  const datosTiposDias = estadisticas ? [
    {
      name: 'Días hábiles',
      value: estadisticas.totalGuardias - estadisticas.guardiasEnFinDeSemana - estadisticas.guardiasEnFeriados
    },
    {
      name: 'Fines de semana',
      value: estadisticas.guardiasEnFinDeSemana
    },
    {
      name: 'Feriados',
      value: estadisticas.guardiasEnFeriados
    }
  ] : [];

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
    <div className="informe-guardias">
      {/* Filtros */}
      <InformeFilters 
        tipo="guardias" 
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
                  <Col md={3} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Total de guardias</h6>
                      <h2 className="mb-0">{estadisticas.totalGuardias}</h2>
                    </div>
                  </Col>
                  <Col md={3} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Guardias en feriados</h6>
                      <h2 className="mb-0">{estadisticas.guardiasEnFeriados}</h2>
                      <small className="text-muted">
                        ({Math.round((estadisticas.guardiasEnFeriados / estadisticas.totalGuardias) * 100)}%)
                      </small>
                    </div>
                  </Col>
                  <Col md={3} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Guardias en fin de semana</h6>
                      <h2 className="mb-0">{estadisticas.guardiasEnFinDeSemana}</h2>
                      <small className="text-muted">
                        ({Math.round((estadisticas.guardiasEnFinDeSemana / estadisticas.totalGuardias) * 100)}%)
                      </small>
                    </div>
                  </Col>
                  <Col md={3} className="mb-4">
                    <div className="d-flex flex-column align-items-center">
                      <h6 className="text-muted">Guardias en días hábiles</h6>
                      <h2 className="mb-0">
                        {estadisticas.totalGuardias - estadisticas.guardiasEnFeriados - estadisticas.guardiasEnFinDeSemana}
                      </h2>
                      <small className="text-muted">
                        ({Math.round(((estadisticas.totalGuardias - estadisticas.guardiasEnFeriados - estadisticas.guardiasEnFinDeSemana) / estadisticas.totalGuardias) * 100)}%)
                      </small>
                    </div>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col md={4} className="mb-4">
                    <h6 className="text-center mb-3">Guardias por Día de la Semana</h6>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={datosDiasSemana}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {datosDiasSemana.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORES_DIAS_SEMANA[entry.name as keyof typeof COLORES_DIAS_SEMANA] || COLORES_GENERALES[index % COLORES_GENERALES.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col md={4} className="mb-4">
                    <h6 className="text-center mb-3">Guardias por Tipo de Día</h6>
                    <div style={{ height: '250px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={datosTiposDias}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {datosTiposDias.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORES_TIPO_DIAS[index % COLORES_TIPO_DIAS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col md={4} className="mb-4">
                    <h6 className="text-center mb-3">Guardias por Usuario</h6>
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
                            name="Guardias" 
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

          {/* Tabla de guardias */}
          <Card>
            <Card.Header>
              <h5 className="m-0">Listado de guardias</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Día de la Semana</th>
                      <th>Tipo de Día</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guardias.length > 0 ? (
                      guardias.map((guardia) => (
                        <tr key={guardia.id}>
                          <td>{guardia.id}</td>
                          <td>{guardia.fecha}</td>
                          <td>{guardia.usuario}</td>
                          <td>{guardia.diaSemana}</td>
                          <td>
                            {guardia.esFeriado ? (
                              <Badge bg="danger">Feriado</Badge>
                            ) : guardia.esFinSemana ? (
                              <Badge bg="warning">Fin de semana</Badge>
                            ) : (
                              <Badge bg="info">Día hábil</Badge>
                            )}
                          </td>
                          <td>{guardia.notas}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center">
                          No se encontraron guardias con los filtros aplicados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">
                Total: {guardias.length} guardias
              </small>
            </Card.Footer>
          </Card>
        </>
      )}
    </div>
  );
};

export default InformeGuardiasComponent;