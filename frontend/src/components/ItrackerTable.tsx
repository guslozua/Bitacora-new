import React, { useEffect, useState } from 'react';
import { Table, Form, Row, Col, Spinner, Alert, Button, Pagination, Offcanvas } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';

const ItrackerTable = () => {
  const [sortBy, setSortBy] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    year: '2025',
    month: 'all',
    ticket: ''
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPage(1);
  };

  const filteredData = data.filter(ticket =>
    filters.ticket === '' || ticket.ticket_id.toString().includes(filters.ticket)
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0;
    const valA = a[sortBy]?.toLowerCase?.() || a[sortBy];
    const valB = b[sortBy]?.toLowerCase?.() || b[sortBy];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const paginatedData = sortedData.slice((page - 1) * perPage, page * perPage);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters as any).toString();
      const res = await axios.get(`${API_BASE_URL}/itracker/list?${query}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError('Error al cargar la tabla');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.year, filters.month]);

  const openDetail = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowDetail(true);
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  };

  // Estilos de columna más específicos y aplicables
  const columnStyles = {
    id: { width: '80px', maxWidth: '80px' },
    unido: { width: '80px', maxWidth: '80px' },
    tipo: { width: '120px', maxWidth: '120px' },
    causa: { width: '120px', maxWidth: '120px' },
    fecha: { width: '100px', maxWidth: '100px' },
    equipo: { width: '140px', maxWidth: '140px' },
    descripcion: { width: '180px', maxWidth: '180px' },
    usuario: { width: '120px', maxWidth: '120px' },
    tipoCierre: { width: '100px', maxWidth: '100px' },
    comentario: { width: '180px', maxWidth: '180px' }
  };

  // Estilo común para encabezados ordenables
  const sortableHeaderStyle = {
    cursor: 'pointer',
    backgroundColor: '#f8f9fa'
  };

  return (
    <div className="my-4">
      <h5>📋 Listado de Tickets</h5>

      <Form className="mb-3">
        <Row className="g-2 align-items-center">
          <Col md={2}>
            <Form.Select name="year" value={filters.year} onChange={handleChange}>
              <option value="all">Todos los años</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select name="month" value={filters.month} onChange={handleChange}>
              <option value="all">Todos los meses</option>
              {[
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
              ].map((mes, i) => (
                <option key={i + 1} value={i + 1}>{mes}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Control name="ticket" value={filters.ticket} onChange={handleChange} placeholder="Buscar por Ticket ID" />
          </Col>
          <Col>
            <Button variant="secondary" onClick={() => setFilters({ ...filters, ticket: '' })}>
              Limpiar búsqueda
            </Button>
          </Col>
        </Row>
      </Form>

      {loading ? <Spinner animation="border" /> : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover size="sm" className="table-fixed">
              <thead>
                <tr style={{ fontSize: '0.85rem' }}>
                  <th style={columnStyles.id}>ID</th>
                  <th style={columnStyles.unido}>Unido a</th>
                  <th 
                    style={{...columnStyles.tipo, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('t_1'); setSortAsc(sortBy !== 't_1' || !sortAsc); }}
                  >
                    Tipo {sortBy === 't_1' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th 
                    style={{...columnStyles.causa, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('t_2'); setSortAsc(sortBy !== 't_2' || !sortAsc); }}
                  >
                    Causa {sortBy === 't_2' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th style={columnStyles.fecha}>Fecha Apertura</th>
                  <th 
                    style={{...columnStyles.equipo, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('equipo_apertura'); setSortAsc(sortBy !== 'equipo_apertura' || !sortAsc); }}
                  >
                    Equipo {sortBy === 'equipo_apertura' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th style={columnStyles.descripcion}>Descripción Error</th>
                  <th style={columnStyles.fecha}>Fecha Cierre</th>
                  <th 
                    style={{...columnStyles.usuario, ...sortableHeaderStyle}} 
                    onClick={() => { setSortBy('usuario_cierre'); setSortAsc(sortBy !== 'usuario_cierre' || !sortAsc); }}
                  >
                    Us. Cierre {sortBy === 'usuario_cierre' ? (sortAsc ? '↑' : '↓') : '⇅'}
                  </th>
                  <th style={columnStyles.tipoCierre}>Tipo Cierre</th>
                  <th style={columnStyles.comentario}>Comentario</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.875rem' }}>
                {paginatedData.map((t, idx) => (
                  <tr key={idx} onClick={() => openDetail(t)} style={{ cursor: 'pointer' }}>
                    <td style={columnStyles.id}>{t.ticket_id}</td>
                    <td style={columnStyles.unido}>{t.unido_a}</td>
                    <td style={columnStyles.tipo} title={t.t_1}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.tipo.maxWidth}}>
                        {t.t_1}
                      </div>
                    </td>
                    <td style={columnStyles.causa} title={t.t_2}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.causa.maxWidth}}>
                        {t.t_2}
                      </div>
                    </td>
                    <td style={columnStyles.fecha}>{t.fecha_apertura ? formatDate(t.fecha_apertura) : ''}</td>
                    <td style={columnStyles.equipo} title={t.equipo_apertura}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.equipo.maxWidth}}>
                        {t.equipo_apertura}
                      </div>
                    </td>
                    <td style={columnStyles.descripcion} title={t.apertura_descripcion_error}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.descripcion.maxWidth}}>
                        {t.apertura_descripcion_error}
                      </div>
                    </td>
                    <td style={columnStyles.fecha}>{t.fecha_cierre ? formatDate(t.fecha_cierre) : ''}</td>
                    <td style={columnStyles.usuario} title={t.usuario_cierre}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.usuario.maxWidth}}>
                        {t.usuario_cierre}
                      </div>
                    </td>
                    <td style={columnStyles.tipoCierre} title={t.cierre_tipo}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.tipoCierre.maxWidth}}>
                        {t.cierre_tipo}
                      </div>
                    </td>
                    <td style={columnStyles.comentario} title={t.cierre_comentario}>
                      <div className="text-truncate" style={{maxWidth: columnStyles.comentario.maxWidth}}>
                        {t.cierre_comentario}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <div>
              <span className="me-2">Registros por página:</span>
              <Form.Select style={{ width: '120px', display: 'inline-block' }} value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
            </div>
            <Pagination>
              <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />
              <Pagination.Item active>{page} de {Math.ceil(filteredData.length / perPage)}</Pagination.Item>
              <Pagination.Next disabled={page * perPage >= filteredData.length} onClick={() => setPage(page + 1)} />
            </Pagination>
          </div>

          <Offcanvas show={showDetail} onHide={() => setShowDetail(false)} placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>🗂️ Detalles del Ticket</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {selectedTicket && (
                <div>
                  <p><strong>ID:</strong> {selectedTicket.ticket_id}</p>
                  <p><strong>Unido a:</strong> {selectedTicket.unido_a}</p>
                  <p><strong>Tipo:</strong> {selectedTicket.t_1}</p>
                  <p><strong>Causa:</strong> {selectedTicket.t_2}</p>
                  <p><strong>Fecha Apertura:</strong> {formatDate(selectedTicket.fecha_apertura)}</p>
                  <p><strong>Equipo Apertura:</strong> {selectedTicket.equipo_apertura}</p>
                  <p><strong>Descripción Error:</strong> {selectedTicket.apertura_descripcion_error}</p>
                  <p><strong>Fecha Cierre:</strong> {formatDate(selectedTicket.fecha_cierre)}</p>
                  <p><strong>Usuario Cierre:</strong> {selectedTicket.usuario_cierre}</p>
                  <p><strong>Tipo Cierre:</strong> {selectedTicket.cierre_tipo}</p>
                  <p><strong>Novedad:</strong> {selectedTicket.cierre_novedad}</p>
                  <p><strong>Comentario:</strong> {selectedTicket.cierre_comentario}</p>
                </div>
              )}
            </Offcanvas.Body>
          </Offcanvas>
        </>
      )}
    </div>
  );
};

export default ItrackerTable;