// src/components/AnnouncementsAdmin/AnnouncementPreview.tsx
import React from 'react';
import { Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';
import announcementsService, { Announcement } from '../../services/announcementsService';

interface AnnouncementPreviewProps {
  announcement: Announcement;
}

const AnnouncementPreview: React.FC<AnnouncementPreviewProps> = ({ announcement }) => {
  const { isDarkMode } = useTheme();

  const getGradientColors = (type: string) => {
    const gradients = {
      success: isDarkMode 
        ? 'linear-gradient(135deg, #198754 0%, #20c997 100%)'
        : 'linear-gradient(135deg, #198754 0%, #20c997 100%)',
      warning: isDarkMode 
        ? 'linear-gradient(135deg, #fd7e14 0%, #ffc107 100%)'
        : 'linear-gradient(135deg, #fd7e14 0%, #ffc107 100%)',
      info: isDarkMode 
        ? 'linear-gradient(135deg, #0dcaf0 0%, #6f42c1 100%)'
        : 'linear-gradient(135deg, #0dcaf0 0%, #6f42c1 100%)',
      danger: isDarkMode 
        ? 'linear-gradient(135deg, #dc3545 0%, #d63384 100%)'
        : 'linear-gradient(135deg, #dc3545 0%, #d63384 100%)'
    };
    return gradients[type as keyof typeof gradients] || gradients.info;
  };

  const handleActionClick = () => {
    if (announcement.action_url) {
      if (announcement.action_url.startsWith('http')) {
        window.open(announcement.action_url, '_blank');
      } else {
        window.location.href = announcement.action_url;
      }
    }
  };

  const status = announcementsService.getStatusText(announcement);

  return (
    <div>
      {/* Vista previa del carrusel */}
      <Card className="shadow-lg border-0 mb-4">
        <div className="position-relative">
          <div 
            className="position-relative"
            style={{ 
              background: getGradientColors(announcement.type),
              minHeight: '280px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {/* Overlay decorativo */}
            <div 
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                opacity: 0.3
              }}
            />

            <div className="container position-relative">
              <div className="row">
                <div className="col-lg-8 mx-auto text-center">
                  {/* Badge */}
                  <Badge 
                    className="mb-3 px-3 py-2 rounded-pill"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}
                  >
                    Vista Previa • {announcementsService.formatDate(announcement.created_at)}
                  </Badge>

                  {/* Icono grande */}
                  <div className="mb-4">
                    <div 
                      className="mx-auto rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      <i className={`${announcement.icon} fs-1`} style={{ color: 'white' }}></i>
                    </div>
                  </div>

                  {/* Título */}
                  <h1 
                    className="display-6 fw-bold mb-4"
                    style={{ 
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    {announcement.title}
                  </h1>

                  {/* Contenido */}
                  <p 
                    className="lead mb-4 px-md-5"
                    style={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '1.1rem',
                      lineHeight: '1.6'
                    }}
                  >
                    {announcement.content}
                  </p>

                  {/* Botón de acción */}
                  {announcement.action_text && (
                    <div className="mb-3">
                      <Button
                        size="lg"
                        className="px-4 py-2 fw-bold"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          border: '2px solid rgba(255,255,255,0.4)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}
                        onClick={handleActionClick}
                      >
                        {announcement.action_text}
                        <i className="bi bi-arrow-right ms-2"></i>
                      </Button>
                    </div>
                  )}

                  {/* Autor */}
                  {announcement.created_by_name && (
                    <div className="mt-4">
                      <small 
                        style={{ 
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '0.9rem'
                        }}
                      >
                        <i className="bi bi-person-circle me-2"></i>
                        Publicado por {announcement.created_by_name}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Badge de estado en la esquina */}
          <div className="position-absolute top-0 end-0 m-3">
            <Badge 
              style={{ backgroundColor: status.color }}
              className="px-3 py-2 rounded-pill"
            >
              {status.text}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Detalles técnicos */}
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm border-0 themed-card">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Detalles del Anuncio
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>ID:</strong></td>
                        <td>{announcement.id}</td>
                      </tr>
                      <tr>
                        <td><strong>Tipo:</strong></td>
                        <td>
                          <Badge bg={announcement.type}>
                            <i className={`${announcement.icon} me-1`}></i>
                            {announcement.type}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Prioridad:</strong></td>
                        <td><span className="fw-bold">{announcement.priority}</span></td>
                      </tr>
                      <tr>
                        <td><strong>Estado:</strong></td>
                        <td>
                          <Badge style={{ backgroundColor: status.color }}>
                            {status.text}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Audiencia:</strong></td>
                        <td>{announcement.target_audience}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
                <Col md={6}>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Fecha de inicio:</strong></td>
                        <td>{announcement.start_date ? announcementsService.formatDate(announcement.start_date) : 'Inmediato'}</td>
                      </tr>
                      <tr>
                        <td><strong>Fecha de fin:</strong></td>
                        <td>{announcement.end_date ? announcementsService.formatDate(announcement.end_date) : 'Sin expiración'}</td>
                      </tr>
                      <tr>
                        <td><strong>Creado:</strong></td>
                        <td>{announcementsService.formatDate(announcement.created_at)}</td>
                      </tr>
                      <tr>
                        <td><strong>Actualizado:</strong></td>
                        <td>{announcementsService.formatDate(announcement.updated_at)}</td>
                      </tr>
                      <tr>
                        <td><strong>Autor:</strong></td>
                        <td>{announcement.created_by_name || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
              </Row>

              {/* URL de acción si existe */}
              {announcement.action_url && (
                <Alert variant="info" className="mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>URL de acción:</strong> {announcement.action_url}
                    </div>
                    <Button variant="outline-info" size="sm" onClick={handleActionClick}>
                      <i className="bi bi-box-arrow-up-right me-1"></i>
                      Probar
                    </Button>
                  </div>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm border-0 themed-card">
            <Card.Header>
              <h6 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Estadísticas
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="border rounded p-3">
                      <div className="text-primary mb-1">
                        <i className="bi bi-eye fs-4"></i>
                      </div>
                      <h4 className="fw-bold mb-0">{announcement.views_count}</h4>
                      <small className="text-muted">Visualizaciones</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3">
                      <div className="text-success mb-1">
                        <i className="bi bi-hand-index fs-4"></i>
                      </div>
                      <h4 className="fw-bold mb-0">{announcement.clicks_count}</h4>
                      <small className="text-muted">Clics</small>
                    </div>
                  </div>
                </div>

                {/* CTR si hay datos */}
                {announcement.views_count > 0 && (
                  <div className="mt-3 p-2 bg-light rounded">
                    <small>
                      <strong>CTR:</strong> {((announcement.clicks_count / announcement.views_count) * 100).toFixed(1)}%
                    </small>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnnouncementPreview;