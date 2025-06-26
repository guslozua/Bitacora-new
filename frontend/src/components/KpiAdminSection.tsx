import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { useDashboardKpiVisibility } from '../services/DashboardKpiVisibilityContext';
import Swal from 'sweetalert2';

interface KpiAdminSectionProps {
  isDarkMode: boolean;
}

const KpiAdminSection: React.FC<KpiAdminSectionProps> = ({ isDarkMode }) => {
  const { kpiConfigs, toggleKpiVisibility, resetToDefaults, setKpiConfigs } = useDashboardKpiVisibility();
  const [isLoading, setIsLoading] = useState(false);
  const [draggedKpi, setDraggedKpi] = useState<string | null>(null);
  const [dragOverKpi, setDragOverKpi] = useState<string | null>(null);

  const handleToggleKpi = async (kpiId: string) => {
    setIsLoading(true);
    try {
      await toggleKpiVisibility(kpiId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDefaults = () => {
    Swal.fire({
      title: '¿Restaurar configuración por defecto?',
      text: 'Esto activará los KPIs predeterminados y desactivará los demás.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    }).then((result) => {
      if (result.isConfirmed) {
        resetToDefaults();
        Swal.fire({
          title: '¡Restaurado!',
          text: 'La configuración ha sido restaurada a los valores por defecto.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#343a40' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#212529'
        });
      }
    });
  };

  const handleClearCache = () => {
    Swal.fire({
      title: '¿Limpiar cache de KPIs?',
      text: 'Esto eliminará toda la configuración guardada y recargará la página.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar cache del servicio KPI
        localStorage.removeItem('dashboardKpiConfigs');
        localStorage.removeItem('dashboardKpiData');
        
        Swal.fire({
          title: '¡Cache limpiado!',
          text: 'La página se recargará automáticamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#343a40' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#212529'
        });
        
        // Recargar la página para aplicar cambios
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });
  };

  // 🎯 FUNCIONES DE DRAG AND DROP
  const handleDragStart = (e: React.DragEvent, kpiId: string) => {
    setDraggedKpi(kpiId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', kpiId);
    
    // Agregar clase visual al elemento arrastrado
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedKpi(null);
    setDragOverKpi(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, kpiId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverKpi(kpiId);
  };

  const handleDragLeave = () => {
    setDragOverKpi(null);
  };

  const handleDrop = (e: React.DragEvent, targetKpiId: string) => {
    e.preventDefault();
    const sourceKpiId = draggedKpi;
    
    if (!sourceKpiId || sourceKpiId === targetKpiId) {
      setDraggedKpi(null);
      setDragOverKpi(null);
      return;
    }

    // Encontrar los índices de los KPIs
    const sourceIndex = kpiConfigs.findIndex(kpi => kpi.id === sourceKpiId);
    const targetIndex = kpiConfigs.findIndex(kpi => kpi.id === targetKpiId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;

    // Crear nueva configuración con orden actualizado
    const newConfigs = [...kpiConfigs];
    const sourceKpi = newConfigs[sourceIndex];
    const targetKpi = newConfigs[targetIndex];

    // Intercambiar órdenes
    const tempOrder = sourceKpi.order;
    sourceKpi.order = targetKpi.order;
    targetKpi.order = tempOrder;

    // Reordenar array por orden
    newConfigs.sort((a, b) => a.order - b.order);

    // Actualizar configuración
    setKpiConfigs(newConfigs);
    
    // Limpiar estados de drag
    setDraggedKpi(null);
    setDragOverKpi(null);

    // Mostrar confirmación
    Swal.fire({
      title: '¡Orden actualizado!',
      text: `"${sourceKpi.label}" se movió al orden ${targetKpi.order}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    });
  };

  // Obtener estadísticas de configuración
  const totalKpis = kpiConfigs.length;
  const visibleKpis = kpiConfigs.filter(kpi => kpi.visible).length;
  const hiddenKpis = totalKpis - visibleKpis;

  // Organizar KPIs en filas de 4 como en el Dashboard
  const organizeKpisInRows = () => {
    const sortedKpis = [...kpiConfigs].sort((a, b) => a.order - b.order);
    const rows = [];
    for (let i = 0; i < sortedKpis.length; i += 4) {
      rows.push(sortedKpis.slice(i, i + 4));
    }
    return rows;
  };

  const kpiRows = organizeKpisInRows();

  // Función para generar valores simulados realistas
  const getSimulatedValue = (kpiId: string): string => {
    const simulatedValues: { [key: string]: string } = {
      'proyectos_activos': '28',
      'tareas_pendientes': '147',
      'usuarios_activos': '89',
      'eventos_hoy': '5',
      'altas_pic': '1,247',
      'altas_social': '892',
      'tabulaciones': '156',
      'placas': '73',
      'itracker': '324',
      'incidentes_guardias': '12',
      'hitos_totales': '45',
      'eventos_mes': '28'
    };
    return simulatedValues[kpiId] || Math.floor(Math.random() * 100 + 10).toString();
  };

  // Mapeo de colores Bootstrap según el tipo del KPI
  const getBootstrapVariant = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'primary': 'primary',
      'success': 'success', 
      'warning': 'warning',
      'danger': 'danger',
      'info': 'info'
    };
    return colorMap[color] || 'primary';
  };

  return (
    <Card className={`mb-4 border-0 shadow-sm ${isDarkMode ? 'bg-dark text-light' : ''}`}>
      <Card.Header className={`d-flex justify-content-between align-items-center py-3 ${isDarkMode ? 'bg-secondary' : 'bg-light'}`}>
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-bar-chart-line me-2 text-primary"></i>
          KPIs del Dashboard Principal
        </h5>
        <div className="d-flex gap-2">
          <Button
            variant="outline-warning"
            size="sm"
            onClick={handleClearCache}
            disabled={isLoading}
            title="Limpiar cache"
          >
            <i className="bi bi-trash"></i>
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleResetDefaults}
            disabled={isLoading}
            title="Restaurar configuración"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Estadísticas de configuración */}
        <Row className="mb-4">
          <Col md={4}>
            <div className="text-center p-3">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  backgroundColor: 'rgba(13, 110, 253, 0.1)',
                  color: '#0d6efd'
                }}
              >
                <i className="bi bi-bar-chart-fill" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <h2 className="fw-bold mb-1">{totalKpis}</h2>
              <small className="text-muted">Total KPIs</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-3">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  backgroundColor: 'rgba(25, 135, 84, 0.1)',
                  color: '#198754'
                }}
              >
                <i className="bi bi-eye-fill" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <h2 className="fw-bold mb-1">{visibleKpis}</h2>
              <small className="text-muted">Visibles</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-3">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  color: '#ffc107'
                }}
              >
                <i className="bi bi-eye-slash-fill" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <h2 className="fw-bold mb-1">{hiddenKpis}</h2>
              <small className="text-muted">Ocultos</small>
            </div>
          </Col>
        </Row>

        {/* Vista previa de KPIs como se ven en el Dashboard */}
        <div className="mb-3">
          <h6 className="text-muted mb-3">
            <i className="bi bi-layout-three-columns me-2"></i>
            Vista previa del Dashboard 
            <Badge bg="info" className="ms-2">
              <i className="bi bi-arrows-move me-1"></i>
              Arrastra para reordenar
            </Badge>
          </h6>
          
          {kpiRows.map((row, rowIndex) => (
            <Row key={rowIndex} className="g-3 mb-3">
              {row.map((kpi) => (
                <Col lg={3} md={6} key={kpi.id}>
                  <Card 
                    draggable
                    onDragStart={(e) => handleDragStart(e, kpi.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, kpi.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, kpi.id)}
                    className={`h-100 shadow-sm border-0 position-relative ${!kpi.visible ? 'opacity-50' : ''} ${
                      dragOverKpi === kpi.id ? 'border-primary border-2' : ''
                    } ${draggedKpi === kpi.id ? 'shadow-lg' : ''}`}
                    style={{ 
                      cursor: draggedKpi ? 'grabbing' : 'grab',
                      transition: 'all 0.2s ease',
                      backgroundColor: isDarkMode ? '#343a40' : '#ffffff',
                      transform: draggedKpi === kpi.id ? 'rotate(3deg) scale(1.02)' : 'none'
                    }}
                    onClick={(e) => {
                      // Solo hacer toggle si no estamos arrastrando
                      if (!draggedKpi) {
                        handleToggleKpi(kpi.id);
                      }
                    }}
                  >
                    {/* Indicador de drag más sutil */}
                    <div className="position-absolute top-0 start-0 m-1">
                      <div 
                        className="d-flex align-items-center justify-content-center rounded"
                        style={{
                          width: '1rem',
                          height: '1rem',
                          backgroundColor: 'rgba(108, 117, 125, 0.15)',
                          fontSize: '0.6rem',
                          color: '#6c757d',
                          opacity: draggedKpi ? 0.8 : 0.4,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.opacity = draggedKpi ? '0.8' : '0.4';
                        }}
                      >
                        <i className="bi bi-grip-vertical"></i>
                      </div>
                    </div>

                    {/* Badge de estado en la esquina superior derecha */}
                    <div className="position-absolute top-0 end-0 m-1">
                      <Badge 
                        bg={kpi.visible ? 'success' : 'secondary'}
                        className="rounded-pill"
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.25rem 0.4rem'
                        }}
                      >
                        <i 
                          className={`bi ${kpi.visible ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}
                          style={{ fontSize: '0.65rem' }}
                        ></i>
                      </Badge>
                    </div>

                    <Card.Body className="p-3 pt-3">
                      <div className="d-flex justify-content-between align-items-start mt-1">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <div 
                              className={`rounded-circle me-3 d-flex align-items-center justify-content-center bg-${getBootstrapVariant(kpi.color)} bg-opacity-10`}
                              style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                minWidth: '2.5rem'
                              }}
                            >
                              <i 
                                className={`bi ${kpi.icon} text-${getBootstrapVariant(kpi.color)}`}
                                style={{ fontSize: '1.1rem' }}
                              ></i>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                                {kpi.label}
                              </h6>
                              <small className="text-muted">
                                Orden: {kpi.order}
                              </small>
                            </div>
                          </div>
                          
                          {/* Simulación del valor del KPI */}
                          <div className="mt-2">
                            <h4 className="fw-bold mb-1 text-primary">
                              {kpi.visible ? getSimulatedValue(kpi.id) : '(oculto)'}
                            </h4>
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                              {kpi.description}
                            </small>
                          </div>

                          {/* Información del endpoint */}
                          <div className="mt-2 pt-2 border-top border-opacity-25">
                            <small className="text-muted">
                              <i className="bi bi-link-45deg me-1"></i>
                              <code style={{ fontSize: '0.7rem' }}>{kpi.endpoint}</code>
                            </small>
                          </div>
                        </div>
                      </div>
                    </Card.Body>

                    {/* Overlay para KPIs ocultos */}
                    {!kpi.visible && !draggedKpi && (
                      <div 
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <div className="text-center">
                          <i className="bi bi-eye-slash display-6 text-secondary mb-2"></i>
                          <p className="small text-muted mb-0">Click para activar</p>
                        </div>
                      </div>
                    )}

                    {/* Overlay de drag */}
                    {dragOverKpi === kpi.id && draggedKpi !== kpi.id && (
                      <div 
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: 'rgba(13, 110, 253, 0.1)',
                          borderRadius: '0.375rem',
                          border: '2px dashed #0d6efd'
                        }}
                      >
                        <div className="text-center">
                          <i className="bi bi-arrow-down-circle display-6 text-primary mb-2"></i>
                          <p className="small text-primary mb-0">Soltar aquí</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
              
              {/* Rellenar celdas vacías si la fila no tiene 4 elementos */}
              {row.length < 4 && Array.from({ length: 4 - row.length }).map((_, emptyIndex) => (
                <Col lg={3} md={6} key={`empty-${rowIndex}-${emptyIndex}`}>
                  <div style={{ height: '1px' }}></div>
                </Col>
              ))}
            </Row>
          ))}
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 rounded" style={{ 
          backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
          fontSize: '0.875rem' 
        }}>
          <div className="row">
            <div className="col-md-6">
              <strong>💡 Consejos:</strong>
              <ul className="mb-0 mt-2" style={{ fontSize: '0.8rem' }}>
                <li><i className="bi bi-arrows-move me-1"></i>Arrastra las tarjetas para reordenar</li>
                <li><i className="bi bi-mouse me-1"></i>Haz clic para activar/desactivar</li>
                <li><i className="bi bi-grid me-1"></i>Máximo 4 KPIs por fila</li>
              </ul>
            </div>
            <div className="col-md-6">
              <strong>🔧 Funciones:</strong>
              <ul className="mb-0 mt-2" style={{ fontSize: '0.8rem' }}>
                <li><i className="bi bi-arrow-clockwise me-1"></i>Restaurar configuración por defecto</li>
                <li><i className="bi bi-trash me-1"></i>Limpiar cache y recargar página</li>
              </ul>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default KpiAdminSection;