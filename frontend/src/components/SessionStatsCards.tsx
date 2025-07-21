// components/SessionStatsCards.tsx
import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';

interface StatsCardsProps {
  stats: {
    resumen: {
      total_sesiones: number;
      sesiones_activas: number;
      total_vm_pic: number;
      vm_pic_activas: number;
      total_home: number;
      total_call_center: number;
      home_activas: number;
      call_center_activas: number;
      porcentaje_home: number;
      porcentaje_call_center: number;
      usuarios_unicos: number;
      ultima_actualizacion: string;
    };
  };
  onRefresh?: () => void;
}

const SessionStatsCards: React.FC<StatsCardsProps> = ({ stats, onRefresh }) => {
  const { resumen } = stats;

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color = 'primary',
    percentage,
    gradient = false
  }: {
    title: string;
    value: number;
    subtitle?: string;
    icon: string;
    color?: string;
    percentage?: number;
    gradient?: boolean;
  }) => (
    <Card className={`h-100 border-0 shadow-sm ${gradient ? 'bg-gradient' : ''}`}>
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className="text-muted mb-2 text-uppercase small fw-bold">{title}</h6>
            <h2 className={`text-${color} mb-1 fw-bold`}>
              {value.toLocaleString('es-ES')}
            </h2>
            {subtitle && (
              <p className="text-muted mb-2 small">
                <i className="bi bi-activity me-1"></i>
                {subtitle}
              </p>
            )}
            {percentage !== undefined && (
              <div className="mt-2">
                <span className={`badge bg-${color} bg-opacity-15 text-${color} px-3 py-2`}>
                  <i className="bi bi-percent me-1"></i>
                  {percentage.toFixed(1)}% del total
                </span>
              </div>
            )}
          </div>
          <div className={`text-${color} fs-1 opacity-75`}>
            <i className={icon}></i>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <>
      {/* Fila principal de estadísticas */}
      <Row className="mb-4 g-3">
        <Col lg={3} md={6}>
          <StatCard
            title="Total Sesiones"
            value={resumen.total_sesiones}
            subtitle={`${resumen.sesiones_activas} activas (${((resumen.sesiones_activas / resumen.total_sesiones) * 100).toFixed(1)}%)`}
            icon="bi bi-people-fill"
            color="primary"
          />
        </Col>
        <Col lg={3} md={6}>
          <StatCard
            title="Máquinas VM PIC"
            value={resumen.total_vm_pic}
            subtitle={`${resumen.vm_pic_activas} activas`}
            icon="bi bi-pc-display"
            color="success"
            percentage={(resumen.total_vm_pic / resumen.total_sesiones) * 100}
          />
        </Col>
        <Col lg={3} md={6}>
          <StatCard
            title="Home Office"
            value={resumen.total_home}
            subtitle={`${resumen.home_activas} activas`}
            icon="bi bi-house-fill"
            color="info"
            percentage={parseFloat(resumen.porcentaje_home.toString()) || 0}
          />
        </Col>
        <Col lg={3} md={6}>
          <StatCard
            title="Call Centers"
            value={resumen.total_call_center}
            subtitle={`${resumen.call_center_activas} activas`}
            icon="bi bi-building-fill"
            color="warning"
            percentage={parseFloat(resumen.porcentaje_call_center.toString()) || 0}
          />
        </Col>
      </Row>
      
      {/* Fila secundaria de métricas */}
      <Row className="mb-4 g-3">
        <Col lg={3} md={6}>
          <StatCard
            title="Usuarios Únicos"
            value={resumen.usuarios_unicos}
            subtitle="Usuarios diferentes identificados"
            icon="bi bi-person-check-fill"
            color="purple"
          />
        </Col>
        <Col lg={3} md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2 text-uppercase small fw-bold">Tasa de Actividad</h6>
                  <h2 className="text-success mb-1 fw-bold">
                    {((resumen.sesiones_activas / resumen.total_sesiones) * 100).toFixed(1)}%
                  </h2>
                  <p className="text-muted mb-0 small">
                    <i className="bi bi-graph-up-arrow me-1"></i>
                    {resumen.sesiones_activas} de {resumen.total_sesiones} sesiones
                  </p>
                </div>
                <div className="text-success fs-1 opacity-75">
                  <i className="bi bi-speedometer2"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2 text-uppercase small fw-bold">Distribución</h6>
                  <div className="d-flex align-items-center mb-2">
                    <div className="me-3">
                      <div className="text-info fw-bold">{(parseFloat(resumen.porcentaje_home.toString()) || 0).toFixed(1)}%</div>
                      <small className="text-muted">Home</small>
                    </div>
                    <div>
                      <div className="text-warning fw-bold">{(parseFloat(resumen.porcentaje_call_center.toString()) || 0).toFixed(1)}%</div>
                      <small className="text-muted">Call Centers</small>
                    </div>
                  </div>
                  <div className="progress" style={{height: '6px'}}>
                    <div 
                      className="progress-bar bg-info" 
                      style={{width: `${parseFloat(resumen.porcentaje_home.toString()) || 0}%`}}
                    ></div>
                    <div 
                      className="progress-bar bg-warning" 
                      style={{width: `${parseFloat(resumen.porcentaje_call_center.toString()) || 0}%`}}
                    ></div>
                  </div>
                </div>
                <div className="text-secondary fs-1 opacity-75">
                  <i className="bi bi-pie-chart-fill"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6}>
          <Card className="h-100 border-0 shadow-sm bg-light">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-2 text-uppercase small fw-bold">
                    <i className="bi bi-clock me-1"></i>
                    Última Actualización
                  </h6>
                  <div className="text-dark fw-bold mb-1">
                    {resumen.ultima_actualizacion ? 
                      new Date(resumen.ultima_actualizacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'No disponible'
                    }
                  </div>
                  <small className="text-muted">
                    {resumen.ultima_actualizacion ? 
                      new Date(resumen.ultima_actualizacion).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''
                    }
                  </small>
                  {onRefresh && (
                    <div className="mt-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={onRefresh}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Actualizar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-secondary fs-1 opacity-50">
                  <i className="bi bi-calendar-check"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Resumen ejecutivo */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm bg-gradient">
            <Card.Body className="p-4">
              <h5 className="text-primary mb-3">
                <i className="bi bi-clipboard-data me-2"></i>
                Resumen Ejecutivo
              </h5>
              <Row>
                <Col md={4}>
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <h4 className="text-primary mb-1">
                      {((resumen.total_vm_pic / resumen.total_sesiones) * 100).toFixed(1)}%
                    </h4>
                    <small className="text-muted">Máquinas VM PIC del total</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <h4 className="text-info mb-1">
                      {(parseFloat(resumen.porcentaje_home.toString()) || 0) > (parseFloat(resumen.porcentaje_call_center.toString()) || 0) ? 'Home' : 'Call Centers'}
                    </h4>
                    <small className="text-muted">Modalidad predominante</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <h4 className="text-success mb-1">
                      {(resumen.total_sesiones / resumen.usuarios_unicos).toFixed(1)}
                    </h4>
                    <small className="text-muted">Sesiones promedio por usuario</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default SessionStatsCards;