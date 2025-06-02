// components/Informes/InformeGuardiasComponent.tsx
import React, { useEffect, useState } from 'react';
import { Table, Card, Badge, Row, Col, Spinner, Alert, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import InformeService, { InformeGuardiasParams } from '../../services/InformeService';
import InformeFilters from './InformeFilters';
import api from '../../services/api'; // Para consultar incidentes
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
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
  // Nuevas propiedades para incidentes
  tieneIncidentes?: boolean;
  cantidadIncidentes?: number;
  estadosIncidentes?: string[];
}

interface Estadisticas {
  totalGuardias: number;
  porUsuario: Record<string, number>;
  porDiaSemana: Record<string, number>;
  guardiasEnFeriados: number;
  guardiasEnFinDeSemana: number;
  conIncidentes?: number;
  sinIncidentes?: number;
}

// Funciones helper existentes
const formatearFecha = (fechaStr: string): string => {
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString('es-ES');
};

const fechaATimestamp = (fechaStr: string): number => {
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  return fecha.getTime();
};

type OrdenColumna = 'fecha' | 'usuario' | 'diaSemana' | 'tipoDia' | 'incidentes';
type DireccionOrden = 'asc' | 'desc';

const InformeGuardiasComponent: React.FC = () => {
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [filtros, setFiltros] = useState<InformeGuardiasParams>({});
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [cargandoIncidentes, setCargandoIncidentes] = useState<boolean>(false);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [elementosPorPagina] = useState<number>(20);

  // Estados para ordenamiento
  const [columnaOrden, setColumnaOrden] = useState<OrdenColumna>('fecha');
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('desc');

  // Estado para determinar si mostrar tabla completa (cuando hay filtro de mes específico)
  const [mostrarTablaCompleta, setMostrarTablaCompleta] = useState<boolean>(false);

  // Colores modernos
  const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c'];

  // Función para cargar incidentes de las guardias
  const cargarIncidentesGuardias = async (guardiasData: Guardia[]) => {
    try {
      setCargandoIncidentes(true);
      
      // Obtener IDs de guardias
      const guardiaIds = guardiasData.map(g => g.id);
      
      if (guardiaIds.length === 0) {
        return guardiasData;
      }

      // Consultar incidentes para todas las guardias
      const response = await api.post('/incidentes/guardias/resumen', {
        guardia_ids: guardiaIds
      });

      if (response.data.success) {
        const incidentesData = response.data.data;
        
        // Mapear los datos de incidentes a las guardias
        const guardiasConIncidentes = guardiasData.map(guardia => {
          const incidentesGuardia = incidentesData.find((inc: any) => inc.guardia_id === guardia.id);
          
          return {
            ...guardia,
            tieneIncidentes: incidentesGuardia ? incidentesGuardia.cantidad > 0 : false,
            cantidadIncidentes: incidentesGuardia ? incidentesGuardia.cantidad : 0,
            estadosIncidentes: incidentesGuardia ? incidentesGuardia.estados : []
          };
        });

        return guardiasConIncidentes;
      }
    } catch (error: any) {
      console.error('Error al cargar incidentes de guardias:', error);
      
      // Si falla, usar método individual (fallback)
      return await cargarIncidentesIndividual(guardiasData);
    } finally {
      setCargandoIncidentes(false);
    }
    
    return guardiasData;
  };

  // Método de fallback para cargar incidentes individualmente
  const cargarIncidentesIndividual = async (guardiasData: Guardia[]) => {
    const BATCH_SIZE = 5;
    const guardiasConIncidentes = [...guardiasData];
    
    for (let i = 0; i < guardiasData.length; i += BATCH_SIZE) {
      const batch = guardiasData.slice(i, i + BATCH_SIZE);
      
      const promesas = batch.map(async (guardia) => {
        try {
          const response = await api.get(`/incidentes/guardia/${guardia.id}`);
          const incidentes = response.data.success ? response.data.data : [];
          
          return {
            id: guardia.id,
            tieneIncidentes: incidentes.length > 0,
            cantidadIncidentes: incidentes.length,
            estadosIncidentes: incidentes.map((inc: any) => inc.estado)
          };
        } catch (error) {
          // Si da 404, significa que no hay incidentes
          return {
            id: guardia.id,
            tieneIncidentes: false,
            cantidadIncidentes: 0,
            estadosIncidentes: []
          };
        }
      });
      
      const resultadosBatch = await Promise.all(promesas);
      
      // Actualizar guardias con información de incidentes
      resultadosBatch.forEach(resultado => {
        const index = guardiasConIncidentes.findIndex(g => g.id === resultado.id);
        if (index !== -1) {
          guardiasConIncidentes[index] = {
            ...guardiasConIncidentes[index],
            ...resultado
          };
        }
      });
      
      // Pequeña pausa entre batches
      if (i + BATCH_SIZE < guardiasData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return guardiasConIncidentes;
  };

  // Función para obtener el informe - MODIFICADA
  const obtenerInforme = async (params: InformeGuardiasParams = {}) => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await InformeService.getInformeGuardias(params);
      if (respuesta.success) {
        // Primero establecer las guardias básicas
        const guardiasBasicas = respuesta.data.guardias;
        setGuardias(guardiasBasicas);
        setEstadisticas(respuesta.data.estadisticas);
        setPaginaActual(1);
        
        // Determinar si mostrar tabla completa
        const tieneFiltroPorMes = params.desde && params.hasta && 
          new Date(params.desde).getMonth() === new Date(params.hasta).getMonth();
        setMostrarTablaCompleta(!!tieneFiltroPorMes);
        
        // Luego cargar información de incidentes
        const guardiasConIncidentes = await cargarIncidentesGuardias(guardiasBasicas);
        setGuardias(guardiasConIncidentes);
      }
    } catch (error: any) {
      console.error('Error al obtener informe de guardias:', error);
      setError('Error al cargar el informe de guardias');
    } finally {
      setCargando(false);
    }
  };

  // Función unificada para aplicar filtros
  const aplicarFiltros = (nuevosFiltros: InformeGuardiasParams) => {
    setFiltros(nuevosFiltros);
    obtenerInforme(nuevosFiltros);
    // Resetear ordenamiento al aplicar nuevos filtros
    setColumnaOrden('fecha');
    setDireccionOrden('asc');
  };

  useEffect(() => {
    obtenerInforme();
  }, []);

  const exportarInforme = (formato: 'excel' | 'pdf' | 'csv') => {
    InformeService.exportarInformeGuardias(formato, filtros);
  };

  // Función para manejar ordenamiento de tabla
  const manejarOrdenamiento = (columna: OrdenColumna) => {
    let nuevaDireccion: DireccionOrden = 'asc';
    
    // Si es la misma columna, cambiar dirección
    if (columnaOrden === columna) {
      nuevaDireccion = direccionOrden === 'asc' ? 'desc' : 'asc';
    }
    
    setColumnaOrden(columna);
    setDireccionOrden(nuevaDireccion);
    setPaginaActual(1); // Resetear a primera página al ordenar
  };

  // Función para ordenar guardias - MODIFICADA
  const guardiasOrdenadas = [...guardias].sort((a, b) => {
    let valorA: any;
    let valorB: any;

    switch (columnaOrden) {
      case 'fecha':
        valorA = fechaATimestamp(a.fecha);
        valorB = fechaATimestamp(b.fecha);
        break;
      case 'usuario':
        valorA = a.usuario.toLowerCase();
        valorB = b.usuario.toLowerCase();
        break;
      case 'diaSemana':
        valorA = a.diaSemana;
        valorB = b.diaSemana;
        break;
      case 'tipoDia':
        // Orden: Día hábil < Fin de semana < Feriado
        const getTipoOrden = (guardia: Guardia) => {
          if (guardia.esFeriado) return 3;
          if (guardia.esFinSemana) return 2;
          return 1;
        };
        valorA = getTipoOrden(a);
        valorB = getTipoOrden(b);
        break;
      case 'incidentes':
        // Ordenar por cantidad de incidentes
        valorA = a.cantidadIncidentes || 0;
        valorB = b.cantidadIncidentes || 0;
        break;
      default:
        valorA = fechaATimestamp(a.fecha);
        valorB = fechaATimestamp(b.fecha);
    }

    if (valorA < valorB) return direccionOrden === 'asc' ? -1 : 1;
    if (valorA > valorB) return direccionOrden === 'asc' ? 1 : -1;
    return 0;
  });

  // Preparar datos para los gráficos
  const datosUsuarios = estadisticas?.porUsuario ? 
    Object.entries(estadisticas.porUsuario).map(([usuario, cantidad]) => ({
      name: usuario,
      cantidad: cantidad
    })) : [];

  // Guardias con y sin incidentes
  const datosIncidentes = estadisticas ? [
    {
      name: 'Con Incidentes',
      value: estadisticas.conIncidentes || 0,
      color: '#e74c3c'
    },
    {
      name: 'Sin Incidentes',
      value: estadisticas.sinIncidentes || (estadisticas.totalGuardias - (estadisticas.conIncidentes || 0)),
      color: '#2ecc71'
    }
  ] : [];

  // Lógica de paginación
  let guardiasParaMostrar: Guardia[];
  let totalPaginas = 1;

  if (mostrarTablaCompleta) {
    // Mostrar todas las guardias cuando hay filtro específico
    guardiasParaMostrar = guardiasOrdenadas;
  } else {
    // Paginación normal
    const indiceUltimoElemento = paginaActual * elementosPorPagina;
    const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
    guardiasParaMostrar = guardiasOrdenadas.slice(indicePrimerElemento, indiceUltimoElemento);
    totalPaginas = Math.ceil(guardiasOrdenadas.length / elementosPorPagina);
  }

  // Generar páginas para el componente Pagination
  const generarPaginas = () => {
    const paginas = [];
    const rango = 2; // Mostrar 2 páginas a cada lado de la actual

    // Botón "Primera"
    if (paginaActual > 1) {
      paginas.push(
        <Pagination.First key="first" onClick={() => setPaginaActual(1)} />
      );
      paginas.push(
        <Pagination.Prev key="prev" onClick={() => setPaginaActual(paginaActual - 1)} />
      );
    }

    // Páginas numeradas
    for (let i = Math.max(1, paginaActual - rango); i <= Math.min(totalPaginas, paginaActual + rango); i++) {
      paginas.push(
        <Pagination.Item
          key={i}
          active={i === paginaActual}
          onClick={() => setPaginaActual(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Botón "Última"
    if (paginaActual < totalPaginas) {
      paginas.push(
        <Pagination.Next key="next" onClick={() => setPaginaActual(paginaActual + 1)} />
      );
      paginas.push(
        <Pagination.Last key="last" onClick={() => setPaginaActual(totalPaginas)} />
      );
    }

    return paginas;
  };

  // Helper functions
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded">
          <p className="mb-1 fw-bold">{payload[0].name || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="mb-0" style={{ color: entry.color }}>
              {entry.dataKey}: {formatNumber(entry.value)}
              {entry.payload.percent && ` (${(entry.payload.percent * 100).toFixed(1)}%)`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getBadgeVariant = (guardia: Guardia) => {
    if (guardia.esFeriado) return 'danger';
    if (guardia.esFinSemana) return 'warning';
    return 'info';
  };

  const getTipoDiaTexto = (guardia: Guardia) => {
    if (guardia.esFeriado) return 'Feriado';
    if (guardia.esFinSemana) return 'Fin de semana';
    return 'Día hábil';
  };

  // Función para obtener icono de ordenamiento
  const getIconoOrden = (columna: OrdenColumna) => {
    if (columnaOrden !== columna) {
      return <i className="bi bi-arrow-down-up text-muted ms-1"></i>;
    }
    return direccionOrden === 'asc' 
      ? <i className="bi bi-arrow-up text-primary ms-1"></i>
      : <i className="bi bi-arrow-down text-primary ms-1"></i>;
  };

  // Función para renderizar la columna de incidentes
  const renderIncidentes = (guardia: Guardia) => {
    if (cargandoIncidentes) {
      return <Spinner animation="border" size="sm" />;
    }

    if (!guardia.tieneIncidentes) {
      return (
        <Badge bg="light" text="muted">
          <i className="bi bi-check-circle me-1"></i>
          Sin incidentes
        </Badge>
      );
    }

    const estadosUnicos = Array.from(new Set(guardia.estadosIncidentes || []));
    const tooltipContent = (
      <div>
        <strong>{guardia.cantidadIncidentes} incidente{guardia.cantidadIncidentes !== 1 ? 's' : ''}</strong>
        {estadosUnicos.length > 0 && (
          <div className="mt-1">
            Estados: {estadosUnicos.join(', ')}
          </div>
        )}
      </div>
    );

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{tooltipContent}</Tooltip>}
      >
        <Badge 
          bg={guardia.cantidadIncidentes && guardia.cantidadIncidentes > 0 ? "warning" : "light"} 
          className="d-flex align-items-center gap-1"
          style={{ cursor: 'pointer' }}
        >
          <i className="bi bi-exclamation-triangle"></i>
          {guardia.cantidadIncidentes}
        </Badge>
      </OverlayTrigger>
    );
  };

  return (
    <div className="informe-guardias">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold">Informe de Guardias</h2>
      </div>

      {/* Filtros únicos */}
      <InformeFilters 
        tipo="guardias" 
        onFilter={aplicarFiltros} 
        onExport={exportarInforme} 
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {(cargando || cargandoIncidentes) ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">
            {cargando ? 'Cargando datos del informe...' : 'Cargando información de incidentes...'}
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          {estadisticas && (
            <Row className="g-4 mb-4">
              {/* 1. Total Guardias */}
              <Col md={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Total Guardias</h6>
                        <h2 className="fw-bold mb-0 text-primary">{formatNumber(estadisticas.totalGuardias)}</h2>
                      </div>
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '3.5rem', height: '3.5rem' }}>
                        <i className="bi bi-shield-check fs-3 text-primary" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              {/* 2. Días Hábiles */}
              <Col md={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Días Hábiles</h6>
                        <h2 className="fw-bold mb-0 text-success">
                          {formatNumber(estadisticas.totalGuardias - estadisticas.guardiasEnFeriados - estadisticas.guardiasEnFinDeSemana)}
                        </h2>
                        <small className="text-muted">
                          ({estadisticas.totalGuardias > 0 ? (((estadisticas.totalGuardias - estadisticas.guardiasEnFeriados - estadisticas.guardiasEnFinDeSemana) / estadisticas.totalGuardias) * 100).toFixed(1) : '0'}%)
                        </small>
                      </div>
                      <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '3.5rem', height: '3.5rem' }}>
                        <i className="bi bi-calendar-check fs-3 text-success" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* 3. Fines de Semana */}
              <Col md={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Fines de Semana</h6>
                        <h2 className="fw-bold mb-0 text-warning">{formatNumber(estadisticas.guardiasEnFinDeSemana)}</h2>
                        <small className="text-muted">
                          ({estadisticas.totalGuardias > 0 ? ((estadisticas.guardiasEnFinDeSemana / estadisticas.totalGuardias) * 100).toFixed(1) : '0'}%)
                        </small>
                      </div>
                      <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '3.5rem', height: '3.5rem' }}>
                        <i className="bi bi-calendar2-week fs-3 text-warning" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* 4. Feriados */}
              <Col md={3}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-muted mb-1">Feriados</h6>
                        <h2 className="fw-bold mb-0 text-danger">{formatNumber(estadisticas.guardiasEnFeriados)}</h2>
                        <small className="text-muted">
                          ({estadisticas.totalGuardias > 0 ? ((estadisticas.guardiasEnFeriados / estadisticas.totalGuardias) * 100).toFixed(1) : '0'}%)
                        </small>
                      </div>
                      <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '3.5rem', height: '3.5rem' }}>
                        <i className="bi bi-calendar-x fs-3 text-danger" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Gráficos */}
          {estadisticas && (
            <Row className="g-4 mb-4">
              {/* Guardias con/sin incidentes */}
              <Col md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h5 className="fw-bold mb-3">Guardias con/sin Incidentes</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={datosIncidentes}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {datosIncidentes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
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
              
              {/* Guardias por Usuario */}
              <Col md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h5 className="fw-bold mb-3">Total Guardias x Usuario</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={datosUsuarios}
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category"
                          tick={{ fontSize: 11 }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="cantidad" 
                          name="Guardias"
                          radius={[0, 4, 4, 0]}
                        >
                          {datosUsuarios.map((entry, index) => (
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
          )}

          {/* Tabla con ordenamiento - MODIFICADA CON COLUMNA DE INCIDENTES */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Listado de Guardias</h5>
              <div className="text-muted">
                {mostrarTablaCompleta ? (
                  <span>Mostrando todas las {guardiasParaMostrar.length} guardias del período</span>
                ) : (
                  <span>
                    Mostrando {((paginaActual - 1) * elementosPorPagina) + 1}-{Math.min(paginaActual * elementosPorPagina, guardiasOrdenadas.length)} de {guardiasOrdenadas.length} guardias
                  </span>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-light">
                    <tr>
                      <th 
                        role="button" 
                        onClick={() => manejarOrdenamiento('fecha')}
                        className="user-select-none"
                      >
                        Fecha {getIconoOrden('fecha')}
                      </th>
                      <th 
                        role="button" 
                        onClick={() => manejarOrdenamiento('usuario')}
                        className="user-select-none"
                      >
                        Usuario {getIconoOrden('usuario')}
                      </th>
                      <th 
                        role="button" 
                        onClick={() => manejarOrdenamiento('diaSemana')}
                        className="user-select-none"
                      >
                        Día de la Semana {getIconoOrden('diaSemana')}
                      </th>
                      <th 
                        role="button" 
                        onClick={() => manejarOrdenamiento('tipoDia')}
                        className="user-select-none"
                      >
                        Tipo de Día {getIconoOrden('tipoDia')}
                      </th>
                      <th 
                        role="button" 
                        onClick={() => manejarOrdenamiento('incidentes')}
                        className="user-select-none"
                      >
                        Incidentes {getIconoOrden('incidentes')}
                      </th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guardiasParaMostrar.length > 0 ? (
                      guardiasParaMostrar.map((guardia) => (
                        <tr key={guardia.id}>
                          <td className="fw-bold">
                            {formatearFecha(guardia.fecha)}
                          </td>
                          <td>{guardia.usuario}</td>
                          <td>
                            <Badge bg="secondary">
                              {guardia.diaSemana}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getBadgeVariant(guardia)} className="px-3 py-2">
                              {getTipoDiaTexto(guardia)}
                            </Badge>
                          </td>
                          <td>
                            {renderIncidentes(guardia)}
                          </td>
                          <td>{guardia.notas || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          No se encontraron guardias con los filtros aplicados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            
            {/* Paginación - Solo si no se muestra tabla completa */}
            {!mostrarTablaCompleta && totalPaginas > 1 && (
              <Card.Footer className="bg-light d-flex justify-content-center">
                <Pagination className="mb-0">
                  {generarPaginas()}
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default InformeGuardiasComponent;