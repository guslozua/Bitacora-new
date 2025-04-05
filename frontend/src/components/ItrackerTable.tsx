import React, { useEffect, useState } from 'react';
import { Table, Form, Row, Col, Spinner, Alert, Button, Pagination, Offcanvas } from 'react-bootstrap';
import axios from 'axios';

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

  const filteredData = data.filter(ticket => {
    return filters.ticket === '' || ticket.ticket_id.toString().includes(filters.ticket);
  });

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
      const res = await axios.get(`http://localhost:5000/api/itracker/list?${query}`);
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

  return (
    <div className="my-4">
      <h5>📋 Listado de Tickets</h5>

      <Form className="mb-3">
        <Row className="g-2 align-items-center">
          <Col md={2}><Form.Control name="year" value={filters.year} onChange={handleChange} as="select">
            <option value="all">Todos los años</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </Form.Control></Col>

          <Col md={2}><Form.Control name="month" value={filters.month} onChange={handleChange} as="select">
            <option value="all">Todos los meses</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </Form.Control></Col>

          <Col md={3}><Form.Control name="ticket" value={filters.ticket} onChange={handleChange} placeholder="Buscar por Ticket ID" /></Col>

          <Col><Button variant="secondary" onClick={() => setFilters({ ...filters, ticket: '' })}>Limpiar búsqueda</Button></Col>
        </Row>
      </Form>

      {loading ? <Spinner animation="border" /> : error ? <Alert variant="danger">{error}</Alert> : (
        <>
          <div>
            <Table striped bordered hover size="sm" responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Unido A</th>
                  <th onClick={() => { setSortBy('t_1'); setSortAsc(sortBy !== 't_1' || !sortAsc); }} style={{ cursor: 'pointer', width: '150px' }}>Tipo ⇅ {sortBy === 't_1' ? (sortAsc ? '↑' : '↓') : ''}</th>
                  <th onClick={() => { setSortBy('t_2'); setSortAsc(sortBy !== 't_2' || !sortAsc); }} style={{ cursor: 'pointer', width: '200px' }}>Causa ⇅ {sortBy === 't_2' ? (sortAsc ? '↑' : '↓') : ''}</th>
                  <th>Fecha Apertura</th>
                  <th onClick={() => { setSortBy('equipo_apertura'); setSortAsc(sortBy !== 'equipo_apertura' || !sortAsc); }} style={{ cursor: 'pointer', width: '180px' }}>Equipo ⇅ {sortBy === 'equipo_apertura' ? (sortAsc ? '↑' : '↓') : ''}</th>
                  <th>Fecha Cierre</th>
                  <th onClick={() => { setSortBy('usuario_cierre'); setSortAsc(sortBy !== 'usuario_cierre' || !sortAsc); }} style={{ cursor: 'pointer', width: '180px' }}>Usuario Cierre ⇅ {sortBy === 'usuario_cierre' ? (sortAsc ? '↑' : '↓') : ''}</th>
                  <th>Tipo Cierre</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((t, idx) => (
                  <tr key={idx} onClick={() => openDetail(t)} style={{ cursor: 'pointer' }}>
                    <td>{t.ticket_id}</td>
                    <td>{t.unido_a}</td>
                    <td>{t.t_1}</td>
                    <td>{t.t_2}</td>
                    <td>{t.fecha_apertura?.substring(0, 10)}</td>
                    <td>{t.equipo_apertura}</td>
                    <td>{t.fecha_cierre?.substring(0, 10)}</td>
                    <td>{t.usuario_cierre}</td>
                    <td>{t.cierre_tipo}</td>
                    <td title={t.cierre_comentario}>{t.cierre_comentario?.length > 60 ? t.cierre_comentario.slice(0, 60) + '...' : t.cierre_comentario}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
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
          </div>

          <Offcanvas show={showDetail} onHide={() => setShowDetail(false)} placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>🗂️ Detalles del Ticket</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {selectedTicket && (
                <div>
                  <p><strong>ID:</strong> {selectedTicket.ticket_id}</p>
                  <p><strong>Unido A:</strong> {selectedTicket.unido_a}</p>
                  <p><strong>Tipo:</strong> {selectedTicket.t_1}</p>
                  <p><strong>Causa:</strong> {selectedTicket.t_2}</p>
                  <p><strong>Fecha Apertura:</strong> {selectedTicket.fecha_apertura}</p>
                  <p><strong>Equipo Apertura:</strong> {selectedTicket.equipo_apertura}</p>
                  <p><strong>Fecha Cierre:</strong> {selectedTicket.fecha_cierre}</p>
                  <p><strong>Usuario Cierre:</strong> {selectedTicket.usuario_cierre}</p>
                  <p><strong>Tipo Cierre:</strong> {selectedTicket.cierre_tipo}</p>
                  <p><strong>Falla:</strong> {selectedTicket.cierre_falla}</p>
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
