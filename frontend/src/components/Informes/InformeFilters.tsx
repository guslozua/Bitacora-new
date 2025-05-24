// components/Informes/InformeFilters.tsx
import React, { useState } from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface InformeFiltersProps {
  tipo: 'incidentes' | 'guardias' | 'liquidaciones';
  onFilter: (filtros: any) => void;
  onExport: (formato: 'excel' | 'pdf' | 'csv') => void;
}

const InformeFilters: React.FC<InformeFiltersProps> = ({ tipo, onFilter, onExport }) => {
  // Estado para los filtros comunes
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [usuario, setUsuario] = useState<string>('');
  
  // Estados específicos según el tipo de informe
  const [estado, setEstado] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [periodo, setPeriodo] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('');
  const [orderDir, setOrderDir] = useState<string>('desc');

  // Estados para filtros rápidos de guardias
  const [añoSeleccionado, setAñoSeleccionado] = useState<string>('');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');

  // Generar años disponibles (últimos 5 años + año actual + próximo año)
  const añosDisponibles = () => {
    const añoActual = new Date().getFullYear();
    const años = [];
    for (let i = añoActual - 3; i <= añoActual + 2; i++) {
      años.push(i.toString());
    }
    return años.reverse();
  };

  // Meses del año
  const meses = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  // Función para manejar selección rápida de año/mes para guardias
  const manejarFiltroRapido = (nuevoAño: string, nuevoMes: string) => {
    setAñoSeleccionado(nuevoAño);
    setMesSeleccionado(nuevoMes);

    // Si se selecciona año y mes, establecer rango automáticamente
    if (nuevoAño && nuevoMes) {
      const year = parseInt(nuevoAño);
      const month = parseInt(nuevoMes);
      
      // Primer día del mes
      const primerDia = new Date(year, month - 1, 1);
      // Último día del mes
      const ultimoDia = new Date(year, month, 0);
      
      setDesde(primerDia);
      setHasta(ultimoDia);
    } else if (nuevoAño && !nuevoMes) {
      // Solo año seleccionado
      const year = parseInt(nuevoAño);
      const primerDia = new Date(year, 0, 1);
      const ultimoDia = new Date(year, 11, 31);
      
      setDesde(primerDia);
      setHasta(ultimoDia);
    } else {
      // Limpiar fechas si no hay selección completa
      setDesde(null);
      setHasta(null);
    }
  };

  // Función para aplicar los filtros
  const aplicarFiltros = () => {
    let filtros: any = {};
    
    // Filtros comunes
    if (desde) filtros.desde = desde.toISOString().split('T')[0];
    if (hasta) filtros.hasta = hasta.toISOString().split('T')[0];
    if (usuario) filtros.usuario = usuario;
    
    // Filtros específicos según el tipo
    if (tipo === 'incidentes') {
      if (estado) filtros.estado = estado;
      if (codigo) filtros.codigo = codigo;
      if (orderBy) {
        filtros.orderBy = orderBy;
        filtros.orderDir = orderDir;
      }
    } else if (tipo === 'guardias') {
      // Para guardias, solo enviamos fechas y usuario
      // El ordenamiento se maneja en el frontend
    } else if (tipo === 'liquidaciones') {
      if (periodo) filtros.periodo = periodo;
      if (estado) filtros.estado = estado;
      if (orderBy) {
        filtros.orderBy = orderBy;
        filtros.orderDir = orderDir;
      }
    }
    
    onFilter(filtros);
  };

  // Función para limpiar los filtros
  const limpiarFiltros = () => {
    setDesde(null);
    setHasta(null);
    setUsuario('');
    setEstado('');
    setCodigo('');
    setPeriodo('');
    setOrderBy('');
    setOrderDir('desc');
    setAñoSeleccionado('');
    setMesSeleccionado('');
    
    onFilter({});
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="m-0">Filtros de informe</h5>
      </Card.Header>
      <Card.Body>
        <Form>
          {/* Primera fila - Filtros principales */}
          <Row className="mb-3">
            {tipo === 'guardias' ? (
              // Filtros específicos para guardias (más simples)
              <>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Año</Form.Label>
                    <Form.Select
                      value={añoSeleccionado}
                      onChange={(e) => manejarFiltroRapido(e.target.value, mesSeleccionado)}
                    >
                      <option value="">Todos los años</option>
                      {añosDisponibles().map(año => (
                        <option key={año} value={año}>{año}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Mes</Form.Label>
                    <Form.Select
                      value={mesSeleccionado}
                      onChange={(e) => manejarFiltroRapido(añoSeleccionado, e.target.value)}
                    >
                      <option value="">Todos los meses</option>
                      {meses.map(mes => (
                        <option key={mes.value} value={mes.value}>{mes.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Usuario</Form.Label>
                    <Form.Control
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="Nombre de usuario"
                    />
                  </Form.Group>
                </Col>
              </>
            ) : (
              // Filtros para incidentes y liquidaciones (más complejos)
              <>
                {(tipo === 'incidentes') && (
                  <>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Desde</Form.Label>
                        <DatePicker
                          selected={desde}
                          onChange={(date) => setDesde(date)}
                          className="form-control"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Seleccione fecha"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Hasta</Form.Label>
                        <DatePicker
                          selected={hasta}
                          onChange={(date) => setHasta(date)}
                          className="form-control"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Seleccione fecha"
                          minDate={desde ?? undefined}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}
                
                {tipo === 'liquidaciones' && (
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Periodo</Form.Label>
                      <Form.Control
                        type="month"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        placeholder="YYYY-MM"
                      />
                    </Form.Group>
                  </Col>
                )}
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Usuario</Form.Label>
                    <Form.Control
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="Nombre de usuario"
                    />
                  </Form.Group>
                </Col>
                
                {(tipo === 'incidentes' || tipo === 'liquidaciones') && (
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Estado</Form.Label>
                      <Form.Select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                      >
                        <option value="">Todos</option>
                        {tipo === 'incidentes' && (
                          <>
                            <option value="registrado">Registrado</option>
                            <option value="revisado">Revisado</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="rechazado">Rechazado</option>
                            <option value="liquidado">Liquidado</option>
                          </>
                        )}
                        {tipo === 'liquidaciones' && (
                          <>
                            <option value="pendiente">Pendiente</option>
                            <option value="enviada">Enviada</option>
                            <option value="procesada">Procesada</option>
                            <option value="cerrada">Cerrada</option>
                          </>
                        )}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
                
                {tipo === 'incidentes' && (
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Código</Form.Label>
                      <Form.Control
                        type="text"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        placeholder="Código de facturación"
                      />
                    </Form.Group>
                  </Col>
                )}
              </>
            )}
          </Row>

          {/* Segunda fila - Rango de fechas personalizado para guardias */}
          {tipo === 'guardias' && (
            <Row className="mb-3">
              <Col md={12}>
                <div className="border rounded p-3 bg-light">
                  <h6 className="mb-3">O seleccione un rango personalizado:</h6>
                  <Row>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Desde</Form.Label>
                        <DatePicker
                          selected={desde}
                          onChange={(date) => {
                            setDesde(date);
                            // Limpiar selección rápida si se usa fecha personalizada
                            if (date && (añoSeleccionado || mesSeleccionado)) {
                              setAñoSeleccionado('');
                              setMesSeleccionado('');
                            }
                          }}
                          className="form-control"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Seleccione fecha inicial"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Hasta</Form.Label>
                        <DatePicker
                          selected={hasta}
                          onChange={(date) => {
                            setHasta(date);
                            // Limpiar selección rápida si se usa fecha personalizada
                            if (date && (añoSeleccionado || mesSeleccionado)) {
                              setAñoSeleccionado('');
                              setMesSeleccionado('');
                            }
                          }}
                          className="form-control"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Seleccione fecha final"
                          minDate={desde ?? undefined}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          )}
          
          {/* Fila de ordenamiento - Solo para incidentes y liquidaciones */}
          {tipo !== 'guardias' && (
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Ordenar por</Form.Label>
                  <Form.Select
                    value={orderBy}
                    onChange={(e) => setOrderBy(e.target.value)}
                  >
                    <option value="">Predeterminado</option>
                    {tipo === 'incidentes' && (
                      <>
                        <option value="inicio">Fecha de inicio</option>
                        <option value="fin">Fecha de fin</option>
                        <option value="estado">Estado</option>
                        <option value="duracion_minutos">Duración</option>
                      </>
                    )}
                    {tipo === 'liquidaciones' && (
                      <>
                        <option value="periodo">Periodo</option>
                        <option value="fecha_generacion">Fecha de generación</option>
                        <option value="estado">Estado</option>
                      </>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              {orderBy && (
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Dirección</Form.Label>
                    <Form.Select
                      value={orderDir}
                      onChange={(e) => setOrderDir(e.target.value)}
                    >
                      <option value="desc">Descendente</option>
                      <option value="asc">Ascendente</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>
          )}
          
          {/* Botones de acción */}
          <Row>
            <Col>
              <Button variant="primary" onClick={aplicarFiltros} className="me-2">
                <i className="bi bi-funnel"></i> Aplicar filtros
              </Button>
              <Button variant="secondary" onClick={limpiarFiltros} className="me-2">
                <i className="bi bi-arrow-clockwise"></i> Limpiar filtros
              </Button>
              <div className="float-end">
                <Button variant="success" onClick={() => onExport('excel')} className="me-2">
                  <i className="bi bi-file-excel"></i> Excel
                </Button>
                <Button variant="danger" onClick={() => onExport('pdf')} className="me-2">
                  <i className="bi bi-file-pdf"></i> PDF
                </Button>
                <Button variant="info" onClick={() => onExport('csv')} className="me-2">
                  <i className="bi bi-file-text"></i> CSV
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default InformeFilters;