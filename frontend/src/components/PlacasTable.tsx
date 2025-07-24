import React, { useEffect, useState } from 'react';
import { Table, Form, Row, Col, Spinner, Alert, Button, Pagination, Offcanvas } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import Swal from 'sweetalert2';
import PlacaFormModal from './PlacaFormModal';

interface Placa {
  id: number;
  numero_placa: string;
  titulo: string;
  descripcion: string;
  impacto: 'bajo' | 'medio' | 'alto' | null;
  clase: 'Incidente' | 'Comunicado' | 'Mantenimiento';
  sistema: string;
  fecha_inicio: string;
  fecha_cierre?: string | null;
  duracion: number | null;
  cerrado_por?: string | null;
  causa_resolutiva?: string | null;
}

interface PlacasTableProps {
  year: string;
  month: string;
  onPlacaChange: () => void;
}

const PlacasTable: React.FC<PlacasTableProps> = ({ year, month, onPlacaChange }) => {
  const [sortBy, setSortBy] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [data, setData] = useState<Placa[]>([]);
  const [filters, setFilters] = useState({
    numero_placa: '',
    titulo: '',
    impacto: 'all',
    clase: 'all',
    sistema: 'all'
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlaca, setSelectedPlaca] = useState<Placa | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [placaToEdit, setPlacaToEdit] = useState<Placa | null>(null);

  // Lista de sistemas disponibles
  const sistemasDisponibles = [
    'Citrix', 'Doble Factor', 'Eflow', 'Enlace', 'EQA', 
    'Form. Responsys', 'Form. Web', 'Genesys Administrator', 
    'Genesys Chat y Mail', 'Genesys Pic', 'GI2', 'Idaptive', 
    'Infraestructura Terceros', 'IVR', 'Pulse', 'Red', 
    'Red Corporativa (Teco)', 'Social+', 'Speech Miner/ GIR', 
    'TuidCloud', 'TuidFedCloud', 'Virtual Access', 'No aplica'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPage(1);
  };

  // Filtrado de datos
  const filteredData = data.filter(placa =>
    (filters.numero_placa === '' || placa.numero_placa.toLowerCase().includes(filters.numero_placa.toLowerCase())) &&
    (filters.titulo === '' || placa.titulo.toLowerCase().includes(filters.titulo.toLowerCase())) &&
    (filters.impacto === 'all' || placa.impacto === filters.impacto) &&
    (filters.clase === 'all' || placa.clase === filters.clase) &&
    (filters.sistema === 'all' || placa.sistema === filters.sistema)
  );

  // Ordenamiento de datos
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0;
    
    let valA: any = a[sortBy as keyof Placa];
    let valB: any = b[sortBy as keyof Placa];
    
    // Manejo especial para strings
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    // Manejo para valores nulos
    if (valA === null && valB === null) return 0;
    if (valA === null) return sortAsc ? 1 : -1;
    if (valB === null) return sortAsc ? -1 : 1;
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Paginación
  const paginatedData = sortedData.slice((page - 1) * perPage, page * perPage);

  // Cargar datos
  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        year,
        month
      }).toString();
      
      const res = await axios.get(`${API_BASE_URL}/placas/list?${query}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError('Error al cargar la tabla de placas');
      Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: 'No se pudieron cargar los datos de las placas',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  // Mostrar detalle de una placa
  const openDetail = (placa: Placa) => {
    setSelectedPlaca(placa);
    setShowDetail(true);
  };

  // Abrir modal de edición
  const openEditModal = (placa: Placa) => {
    setPlacaToEdit(placa);
    setShowEditModal(true);
  };

  // Confirmar eliminación con SweetAlert2
  const confirmDelete = (id: number, numeroPlaca: string) => {
    Swal.fire({
      title: '¿Eliminar placa?',
      text: `¿Está seguro que desea eliminar la placa ${numeroPlaca}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        deletePlaca(id);
      }
    });
  };

  // Eliminar placa
  const deletePlaca = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/placas/${id}`);
      
      Swal.fire({
        icon: 'success',
        title: 'Placa eliminada',
        text: 'La placa ha sido eliminada correctamente',
        timer: 1500,
        showConfirmButton: false
      });
      
      fetchData();
      onPlacaChange();
      setShowDetail(false);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al eliminar la placa',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  // Formatear fecha
  const formatDate = (isoDate: string | null | undefined) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear duración
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Colores según nivel de impacto
  const getImpactColor = (impacto: string | null) => {
    if (!impacto) return 'secondary';
    switch (impacto) {
      case 'bajo': return 'success';
      case 'medio': return 'warning';
      case 'alto': return 'danger';
      default: return 'secondary';
    }
  };

  // Colores según clase
  const getClaseColor = (clase: string) => {
    switch (clase) {
      case 'Incidente': return 'danger';
      case 'Comunicado': return 'info';
      case 'Mantenimiento': return 'primary';
      default: return 'secondary';
    }
  };

  // Estilos de columna
  const columnStyles = {
    id: { width: '60px', maxWidth: '60px' },
    numero: { width: '120px', maxWidth: '120px' },
    titulo: { width: '150px', maxWidth: '150px' },
    clase: { width: '100px', maxWidth: '100px' },
    impacto: { width: '80px', maxWidth: '80px' },
    sistema: { width: '120px', maxWidth: '120px' },
    fechaInicio: { width: '140px', maxWidth: '140px' },
    fechaCierre: { width: '140px', maxWidth: '140px' },
    duracion: { width: '80px', maxWidth: '80px' },
    cerradoPor: { width: '120px', maxWidth: '120px' },
    acciones: { width: '100px', maxWidth: '100px' }
  };

  // Estilo común para encabezados ordenables
  const sortableHeaderStyle = {
    cursor: 'pointer',
    backgroundColor: '#f8f9fa'
  };

  return (
    <div className="my-4">
      <h5 className="mb-3">📋 Listado de Placas y Novedades</h5>

      <Form className="mb-3">
        <Row className="g-2 align-items-center">
          <Col md={2}>
            <Form.Control 
              name="numero_placa" 
              value={filters.numero_placa} 
              onChange={handleChange} 
              placeholder="Buscar por Nº Placa" 
            />
          </Col>
          <Col md={2}>
            <Form.Control 
              name="titulo" 
              value={filters.titulo} 
              onChange={handleChange} 
              placeholder="Buscar por Título" 
            />
          </Col>
          <Col md={2}>
            <Form.Select 
              name="clase" 
              value={filters.clase} 
              onChange={handleChange}
            >
              <option value="all">Todas las clases</option>
              <option value="Incidente">Incidente</option>
              <option value="Comunicado">Comunicado</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select 
              name="impacto" 
              value={filters.impacto} 
              onChange={handleChange}
            >
              <option value="all">Todos los impactos</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select 
              name="sistema" 
              value={filters.sistema} 
              onChange={handleChange}
            >
              <option value="all">Todos los sistemas</option>
              {sistemasDisponibles.map(sistema => (
                <option key={sistema} value={sistema}>{sistema}</option>
              ))}
            </Form.Select>
          </Col>
          <Col>
            <Button 
              variant="secondary" 
              onClick={() => setFilters({ numero_placa: '', titulo: '', impacto: 'all', clase: 'all', sistema: 'all' })}
            >
              Limpiar filtros
            </Button>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover size="sm" className="table-fixed">
              <thead>
                <tr style={{ fontSize: '0.85rem' }}>
                  <th style={columnStyles.id}>ID</th>
                  <th 
                    style={{...columnStyles.numero, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('numero_placa'); setSortAsc(sortBy !== 'numero_placa' || !sortAsc); }}
                  >
                    Número {sortBy === 'numero_placa' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.titulo, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('titulo'); setSortAsc(sortBy !== 'titulo' || !sortAsc); }}
                  >
                    Título {sortBy === 'titulo' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.clase, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('clase'); setSortAsc(sortBy !== 'clase' || !sortAsc); }}
                  >
                    Clase {sortBy === 'clase' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.impacto, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('impacto'); setSortAsc(sortBy !== 'impacto' || !sortAsc); }}
                  >
                    Impacto {sortBy === 'impacto' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.sistema, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('sistema'); setSortAsc(sortBy !== 'sistema' || !sortAsc); }}
                  >
                    Sistema {sortBy === 'sistema' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.fechaInicio, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('fecha_inicio'); setSortAsc(sortBy !== 'fecha_inicio' || !sortAsc); }}
                  >
                    Inicio {sortBy === 'fecha_inicio' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.fechaCierre, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('fecha_cierre'); setSortAsc(sortBy !== 'fecha_cierre' || !sortAsc); }}
                  >
                    Cierre {sortBy === 'fecha_cierre' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.duracion, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('duracion'); setSortAsc(sortBy !== 'duracion' || !sortAsc); }}
                  >
                    Duración {sortBy === 'duracion' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th style={columnStyles.cerradoPor}>Cerrado por</th>
                  <th style={columnStyles.acciones}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.875rem' }}>
                {paginatedData.map((placa) => (
                  <tr key={placa.id} onClick={() => openDetail(placa)} style={{ cursor: 'pointer' }}>
                    <td style={columnStyles.id}>{placa.id}</td>
                    <td style={columnStyles.numero} title={placa.numero_placa}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.numero.maxWidth}}>
                        {placa.numero_placa}
                      </div>
                    </td>
                    <td style={columnStyles.titulo} title={placa.titulo}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.titulo.maxWidth}}>
                        {placa.titulo}
                      </div>
                    </td>
                    <td style={columnStyles.clase}>
                      <span className={`badge bg-${getClaseColor(placa.clase)}`}>
                        {placa.clase}
                      </span>
                    </td>
                    <td style={columnStyles.impacto}>
                      {placa.impacto ? (
                        <span className={`badge bg-${getImpactColor(placa.impacto)}`}>
                          {placa.impacto.charAt(0).toUpperCase() + placa.impacto.slice(1)}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td style={columnStyles.sistema} title={placa.sistema}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.sistema.maxWidth}}>
                        {placa.sistema}
                      </div>
                    </td>
                    <td style={columnStyles.fechaInicio}>{formatDate(placa.fecha_inicio)}</td>
                    <td style={columnStyles.fechaCierre}>{formatDate(placa.fecha_cierre)}</td>
                    <td style={columnStyles.duracion}>{formatDuration(placa.duracion)}</td>
                    <td style={columnStyles.cerradoPor} title={placa.cerrado_por || ''}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.cerradoPor.maxWidth}}>
                        {placa.cerrado_por || '-'}
                      </div>
                    </td>
                    <td style={columnStyles.acciones} onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline-primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(placa);
                          }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(placa.id, placa.numero_placa);
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-3">
                      No se encontraron placas con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <div>
              <span className="me-2">Registros por página:</span>
              <Form.Select 
                style={{ width: '120px', display: 'inline-block' }} 
                value={perPage} 
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
            </div>
            <Pagination>
              <Pagination.Prev 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)} 
              />
              <Pagination.Item active>{page} de {Math.max(1, Math.ceil(filteredData.length / perPage))}</Pagination.Item>
              <Pagination.Next 
                disabled={page * perPage >= filteredData.length} 
                onClick={() => setPage(page + 1)} 
              />
            </Pagination>
          </div>

          {/* Modal de detalle */}
          <Offcanvas show={showDetail} onHide={() => setShowDetail(false)} placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>🗂️ Detalles de la Placa</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {selectedPlaca && (
                <div>
                  <Row className="mb-3">
                    <Col>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className={`badge bg-${getClaseColor(selectedPlaca.clase)}`}>
                          {selectedPlaca.clase}
                        </span>
                        {selectedPlaca.impacto && (
                          <span className={`badge bg-${getImpactColor(selectedPlaca.impacto)}`}>
                            Impacto: {selectedPlaca.impacto.charAt(0).toUpperCase() + selectedPlaca.impacto.slice(1)}
                          </span>
                        )}
                      </div>
                      <h5>{selectedPlaca.titulo}</h5>
                      <p className="mt-2 text-muted">#{selectedPlaca.numero_placa}</p>
                      <p><strong>Sistema:</strong> {selectedPlaca.sistema}</p>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <p><strong>Fecha Inicio:</strong><br/>{formatDate(selectedPlaca.fecha_inicio)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Fecha Cierre:</strong><br/>{formatDate(selectedPlaca.fecha_cierre)}</p>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <p><strong>Duración:</strong><br/>{formatDuration(selectedPlaca.duracion)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Cerrado por:</strong><br/>{selectedPlaca.cerrado_por || '-'}</p>
                    </Col>
                  </Row>

                  <hr/>

                  <h6 className="mb-2">Descripción:</h6>
                  <p className="text-justify mb-4" style={{ whiteSpace: 'pre-line' }}>
                    {selectedPlaca.descripcion || 'No hay descripción disponible.'}
                  </p>

                  {selectedPlaca.causa_resolutiva && (
                    <>
                      <h6 className="mb-2">Causa Resolutiva:</h6>
                      <p className="text-justify" style={{ whiteSpace: 'pre-line' }}>
                        {selectedPlaca.causa_resolutiva}
                      </p>
                    </>
                  )}

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => {
                        setShowDetail(false);
                        openEditModal(selectedPlaca);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i> Editar
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      onClick={() => {
                        setShowDetail(false);
                        confirmDelete(selectedPlaca.id, selectedPlaca.numero_placa);
                      }}
                    >
                      <i className="bi bi-trash me-1"></i> Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </Offcanvas.Body>
          </Offcanvas>

          {/* Modal de edición */}
          {placaToEdit && (
            <PlacaFormModal 
              show={showEditModal} 
              onHide={() => setShowEditModal(false)}
              onSave={() => {
                fetchData();
                onPlacaChange();
              }}
              placa={placaToEdit}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PlacasTable;