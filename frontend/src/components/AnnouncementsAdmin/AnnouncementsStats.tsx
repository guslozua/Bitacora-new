// src/components/AnnouncementsAdmin/AnnouncementsStats.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Alert, Spinner, Table } from 'react-bootstrap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import announcementsService, { Announcement } from '../../services/announcementsService';

// Tipos para las estadísticas - definidos localmente
interface AnnouncementStatsData {
  general: {
    total_announcements: number;
    active_announcements: number;
    inactive_announcements: number;
    scheduled_announcements: number;
    expired_announcements: number;
    total_views: number;
    total_clicks: number;
    avg_views_per_announcement: number;
    last_created_at: string | null;
  };
  byType: Array<{
    type: string;
    total: number;
    active: number;
    total_views: number;
    total_clicks: number;
    avg_views: number;
  }>;
}

interface AnnouncementsStatsProps {
  stats: AnnouncementStatsData | null;
}

const AnnouncementsStats: React.FC<AnnouncementsStatsProps> = ({ stats }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [expiringAnnouncements, setExpiringAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    loadExpiringAnnouncements();
  }, []);

  const loadExpiringAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementsService.getExpiringAnnouncements(30); // Próximos 30 días
      if (response.success && response.data) {
        setExpiringAnnouncements(response.data);
      }
    } catch (err) {
      console.error('Error cargando anuncios próximos a expirar:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando estadísticas...</p>
      </div>
    );
  }

  // Datos para gráficos
  const typeData = stats.byType.map((type: any) => ({
    type: type.type.charAt(0).toUpperCase() + type.type.slice(1),
    total: Number(type.total || 0),
    active: Number(type.active || 0),
    views: Number(type.total_views || 0),
    clicks: Number(type.total_clicks || 0)
  }));

  const pieData = [
    { name: 'Activos', value: Number(stats.general.active_announcements || 0), color: '#198754' },
    { name: 'Inactivos', value: Number(stats.general.inactive_announcements || 0), color: '#6c757d' },
    { name: 'Programados', value: Number(stats.general.scheduled_announcements || 0), color: '#fd7e14' },
    { name: 'Expirados', value: Number(stats.general.expired_announcements || 0), color: '#dc3545' }
  ];

  const engagementData = stats.byType.map((type: any) => ({
    type: type.type.charAt(0).toUpperCase() + type.type.slice(1),
    ctr: Number(type.total_views) > 0 ? ((Number(type.total_clicks) / Number(type.total_views)) * 100) : 0,
    avg_views: Number(type.avg_views || 0)
  }));

  const COLORS = ['#198754', '#6c757d', '#fd7e14', '#dc3545'];

  return (
    <div>
      {/* Gráficos principales */}
      <Row className="g-4 mb-4">
        {/* Distribución por tipo */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 themed-card h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Anuncios por Tipo
              </h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#495057" : "#f0f0f0"} />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fill: isDarkMode ? '#ffffff' : '#212529' }}
                  />
                  <YAxis 
                    tick={{ fill: isDarkMode ? '#ffffff' : '#212529' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
                      color: isDarkMode ? '#ffffff' : '#212529'
                    }}
                  />
                  <Bar dataKey="total" fill="#0dcaf0" name="Total" />
                  <Bar dataKey="active" fill="#198754" name="Activos" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Estado de anuncios */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 themed-card h-100">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-pie-chart me-2"></i>
                Distribución por Estado
              </h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
                      color: isDarkMode ? '#ffffff' : '#212529'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Engagement por tipo */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0 themed-card">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Tasa de Clics (CTR) por Tipo
              </h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#495057" : "#f0f0f0"} />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fill: isDarkMode ? '#ffffff' : '#212529' }}
                  />
                  <YAxis 
                    tick={{ fill: isDarkMode ? '#ffffff' : '#212529' }}
                    label={{ value: 'CTR (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
                      color: isDarkMode ? '#ffffff' : '#212529'
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'CTR']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ctr" 
                    stroke="#dc3545" 
                    strokeWidth={3}
                    dot={{ fill: '#dc3545', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 themed-card">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-speedometer me-2"></i>
                Métricas de Rendimiento
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>CTR General:</span>
                  <Badge bg="primary">
                    {Number(stats.general.total_views) > 0 
                      ? `${((Number(stats.general.total_clicks) / Number(stats.general.total_views)) * 100).toFixed(2)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Promedio de Vistas:</span>
                  <Badge bg="info">
                    {Number(stats.general.avg_views_per_announcement || 0).toFixed(1)}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Anuncios Programados:</span>
                  <Badge bg="warning">
                    {Number(stats.general.scheduled_announcements || 0)}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Anuncios Expirados:</span>
                  <Badge bg="danger">
                    {Number(stats.general.expired_announcements || 0)}
                  </Badge>
                </div>
              </div>

              {stats.general.last_created_at && (
                <Alert variant="info" className="mb-0">
                  <small>
                    <strong>Último anuncio:</strong><br />
                    {announcementsService.formatDate(stats.general.last_created_at)}
                  </small>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla detallada por tipo */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="shadow-sm border-0 themed-card">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-table me-2"></i>
                Estadísticas Detalladas por Tipo
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className={isDarkMode ? 'table-dark' : ''}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Total</th>
                      <th>Activos</th>
                      <th>Visualizaciones</th>
                      <th>Clics</th>
                      <th>CTR</th>
                      <th>Promedio Vistas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byType.map((type: any) => (
                      <tr key={type.type}>
                        <td>
                          <Badge bg={type.type}>
                            {type.type.charAt(0).toUpperCase() + type.type.slice(1)}
                          </Badge>
                        </td>
                        <td>{Number(type.total || 0)}</td>
                        <td>{Number(type.active || 0)}</td>
                        <td>{Number(type.total_views || 0).toLocaleString()}</td>
                        <td>{Number(type.total_clicks || 0).toLocaleString()}</td>
                        <td>
                          {Number(type.total_views) > 0 
                            ? `${((Number(type.total_clicks) / Number(type.total_views)) * 100).toFixed(2)}%`
                            : '0%'
                          }
                        </td>
                        <td>{Number(type.avg_views || 0).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 themed-card">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Próximos a Expirar
              </h6>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : expiringAnnouncements.length === 0 ? (
                <Alert variant="success" className="mb-0">
                  <small>
                    <i className="bi bi-check-circle me-2"></i>
                    No hay anuncios próximos a expirar
                  </small>
                </Alert>
              ) : (
                <div>
                  {expiringAnnouncements.slice(0, 5).map((announcement) => (
                    <div key={announcement.id} className="border-bottom pb-2 mb-2">
                      <div className="fw-semibold">{announcement.title}</div>
                      <small className="text-muted">
                        Expira: {announcementsService.formatDate(announcement.end_date!)}
                      </small>
                    </div>
                  ))}
                  {expiringAnnouncements.length > 5 && (
                    <small className="text-muted">
                      Y {expiringAnnouncements.length - 5} más...
                    </small>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnnouncementsStats;