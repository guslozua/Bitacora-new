import React, { useEffect, useState } from 'react';
import { Container, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ItrackerTable from '../components/ItrackerTable';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const ItrackerDash = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = `year=${selectedYear}&month=${selectedMonth}`;
        const res = await axios.get(`http://localhost:5000/api/itracker/stats?${query}`);
        setData(res.data);
        console.log('👉 Centros:', res.data.porCentro);
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, selectedMonth]);

  const colors = ['#8884d8', '#82ca9d'];

  const months = [
    { label: 'Todos', value: 'all' },
    { label: 'Enero', value: '1' },
    { label: 'Febrero', value: '2' },
    { label: 'Marzo', value: '3' },
    { label: 'Abril', value: '4' },
    { label: 'Mayo', value: '5' },
    { label: 'Junio', value: '6' },
    { label: 'Julio', value: '7' },
    { label: 'Agosto', value: '8' },
    { label: 'Septiembre', value: '9' },
    { label: 'Octubre', value: '10' },
    { label: 'Noviembre', value: '11' },
    { label: 'Diciembre', value: '12' }
  ];

  const centrosFiltrados = data?.porCentro
    ?.filter((item: any) => item?.centro && item.centro.trim() !== '')
    ?.map((item: any) => ({ centro: item.centro.trim(), cantidad: item.cantidad }));

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container className="py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Dashboard iTracker</h2>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">Todos los años</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <Spinner animation="border" />
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : data ? (
            <>
              {/* KPIs */}
              <Row className="mb-4">
                <Col><Alert variant="secondary">Total: {data.total}</Alert></Col>
                <Col><Alert variant="info">Masivos: {data.masivos}</Alert></Col>
                <Col><Alert variant="success">Puntuales: {data.puntuales}</Alert></Col>
                <Col><Alert variant="warning">ABM: {data.abm}</Alert></Col>
              </Row>

              {/* Gráficas */}
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Tickets por Mes</h5>
                  <LineChart width={400} height={200} data={data.porMes.map((d: { mes: number, cantidad: number }) => ({ mes: `Mes ${d.mes}`, cantidad: d.cantidad }))}>
                    <XAxis dataKey="mes" /><YAxis /><Tooltip />
                    <Line type="monotone" dataKey="cantidad" stroke="#8884d8" />
                  </LineChart>
                </Col>

                <Col md={6}>
                  <h5>Usuarios de Cierre</h5>
                  <BarChart width={500} height={250} data={data.usuariosCierre} layout="vertical">
                    <XAxis type="number" /><YAxis dataKey="name" type="category" width={200} /><Tooltip />
                    <Bar dataKey="cantidad" fill="#82ca9d" />
                  </BarChart>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <h5>Tickets por Causa</h5>
                  <BarChart width={500} height={250} data={data.porCausa} layout="vertical">
                    <XAxis type="number" /><YAxis dataKey="causa" type="category" width={200} /><Tooltip />
                    <Bar dataKey="cantidad" fill="#ffc658" />
                  </BarChart>
                </Col>

                <Col md={6}>
                  <h5>Tickets por Centro</h5>
                  <BarChart width={500} height={250} data={centrosFiltrados} layout="vertical">
                    <XAxis type="number" /><YAxis dataKey="centro" type="category" width={200} /><Tooltip />
                    <Bar dataKey="cantidad" fill="#8884d8" />
                  </BarChart>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={12}>
                  <h5>Masivos vs Puntuales</h5>
                  <PieChart width={400} height={200}>
                    <Pie dataKey="value" data={[{ tipo: 'Masivos', value: data.masivos }, { tipo: 'Puntuales', value: data.puntuales }]} cx="50%" cy="50%" outerRadius={80} label>
                      {[{ tipo: 'Masivos', value: data.masivos }, { tipo: 'Puntuales', value: data.puntuales }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Col>
              </Row>

              <ItrackerTable />

              <Row>
                <Col>
                  <h5>Palabras más usadas en comentarios</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {data.tags.map((tag: { palabra: string; veces: number }, idx: number) => (
                      <span key={idx} className="badge bg-secondary">
                        {tag.palabra} ({tag.veces})
                      </span>
                    ))}
                  </div>
                </Col>
              </Row>
            </>
          ) : null}
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default ItrackerDash;
