// frontend/src/components/KpiAdminSection.tsx
import React, { useState } from 'react';
import { Card, Row, Col, Form, Button, Badge, Alert } from 'react-bootstrap';
import { useDashboardKpiVisibility, KpiConfig } from '../services/DashboardKpiVisibilityContext';
import { useTheme } from '../context/ThemeContext';
import Swal from 'sweetalert2';

const KpiAdminSection: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { kpiConfigs, setKpiConfigs, toggleKpiVisibility, resetToDefaults } = useDashboardKpiVisibility();
  const [isDirty, setIsDirty] = useState(false);

  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        cardBackground: '#343a40',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        textMuted: '#6c757d',
        border: '#495057',
      };
    }
    return {
      cardBackground: '#ffffff',
      textPrimary: '#212529',
      textSecondary: '#495057',
      textMuted: '#6c757d',
      border: '#dee2e6',
    };
  };

  const themeColors = getThemeColors();

  // Toggle visibilidad y marcar como dirty
  const handleToggleVisibility = (id: string) => {
    toggleKpiVisibility(id);
    setIsDirty(true);
  };

  // Guardar cambios
  const handleSaveChanges = () => {
    setIsDirty(false);
    Swal.fire({
      title: '¡Configuración guardada!',
      text: 'Los cambios en los KPIs del dashboard se aplicarán inmediatamente',
      icon: 'success',
      iconColor: '#339fff',
      timer: 1500,
      showConfirmButton: false,
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    });
  };

  // Resetear a configuración por defecto
  const handleReset = () => {
    Swal.fire({
      title: '¿Resetear configuración?',
      text: 'Esto restaurará la configuración por defecto de los KPIs',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    }).then((result) => {
      if (result.isConfirmed) {
        resetToDefaults();
        // 🔥 NUEVO: Limpiar cache de KPIs también
        if (typeof window !== 'undefined' && (window as any).kpiService) {
          (window as any).kpiService.clearCache();
        }
        setIsDirty(false);
        Swal.fire({
          title: '¡Configuración reseteada!',
          text: 'Se ha restaurado la configuración por defecto y limpiado el cache',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#343a40' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#212529'
        });
      }
    });
  };

  // 🆕 NUEVO: Función para limpiar cache de KPIs
  const handleClearCache = () => {
    Swal.fire({
      title: '¿Limpiar cache de KPIs?',
      text: 'Esto forzará la recarga de todos los datos de KPIs',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      background: isDarkMode ? '#343a40' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#212529'
    }).then((result) => {
      if (result.isConfirmed) {
        // Limpiar cache del servicio KPI
        try {
          const { kpiService } = require('../services/kpiService');
          kpiService.clearCache();
          
          Swal.fire({
            title: '¡Cache limpiado!',
            text: 'Los KPIs se recargarán con datos frescos',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: isDarkMode ? '#343a40' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#212529'
          });
          
          // Recargar la página para aplicar cambios
          setTimeout(() => {
            window.location.reload();
          }, 1600);
        } catch (error) {
          console.error('Error limpiando cache:', error);
        }
      }
    });
  };

  // Obtener estadísticas de configuración
  const totalKpis = kpiConfigs.length;
  const visibleKpis = kpiConfigs.filter(kpi => kpi.visible).length;
  const hiddenKpis = totalKpis - visibleKpis;

  return (
    <Card 
      className="mb-4 border-0 shadow-sm"
      style={{ backgroundColor: themeColors.cardBackground }}
    >
      <Card.Header 
        className="py-3"
        style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
              <i className="bi bi-speedometer2 me-2 text-primary"></i>
              KPIs del Dashboard Principal
            </h5>
            <small style={{ color: themeColors.textMuted }}>
              Configura qué indicadores se muestran en el dashboard
            </small>
          </div>
          <div className="d-flex gap-2">
            {isDirty && (
              <Button variant="success" size="sm" onClick={handleSaveChanges}>
                <i className="bi bi-check-circle me-1"></i>
                Guardar cambios
              </Button>
            )}
            <Button variant="outline-info" size="sm" onClick={handleClearCache}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Limpiar Cache
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={handleReset}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Resetear
            </Button>
          </div>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Estadísticas */}
        <Row className="g-3 mb-4">
          <Col md={4}>
            <div className="text-center p-3 rounded" style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  backgroundColor: '#3498db20',
                  width: '3.5rem',
                  height: '3.5rem'
                }}
              >
                <i className="bi bi-speedometer fs-3" style={{ color: '#3498db' }}></i>
              </div>
              <h2 className="fw-bold mb-1" style={{ color: themeColors.textPrimary }}>
                {totalKpis}
              </h2>
              <small style={{ color: themeColors.textMuted }}>Total KPIs</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-3 rounded" style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  backgroundColor: '#19875420',
                  width: '3.5rem',
                  height: '3.5rem'
                }}
              >
                <i className="bi bi-eye fs-3" style={{ color: '#198754' }}></i>
              </div>
              <h2 className="fw-bold mb-1" style={{ color: themeColors.textPrimary }}>
                {visibleKpis}
              </h2>
              <small style={{ color: themeColors.textMuted }}>Visibles</small>
            </div>
          </Col>
          <Col md={4}>
            <div className="text-center p-3 rounded" style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  backgroundColor: '#ffc10720',
                  width: '3.5rem',
                  height: '3.5rem'
                }}
              >
                <i className="bi bi-eye-slash fs-3" style={{ color: '#ffc107' }}></i>
              </div>
              <h2 className="fw-bold mb-1" style={{ color: themeColors.textPrimary }}>
                {hiddenKpis}
              </h2>
              <small style={{ color: themeColors.textMuted }}>Ocultos</small>
            </div>
          </Col>
        </Row>

        {isDirty && (
          <Alert variant="info" className="mb-4">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Cambios pendientes:</strong> Hay modificaciones sin guardar. 
            Los cambios se aplicarán cuando presiones "Guardar cambios".
          </Alert>
        )}

        {/* Grid de KPIs */}
        <Row>
          {kpiConfigs
            .sort((a, b) => a.order - b.order)
            .map((config) => (
            <Col xs={12} md={6} lg={4} key={config.id} className="mb-3">
              <Card 
                className={`border h-100 ${config.visible ? 'border-primary' : ''}`}
                style={{ 
                  backgroundColor: themeColors.cardBackground, 
                  borderColor: config.visible ? '#0d6efd' : themeColors.border,
                  borderWidth: config.visible ? '2px' : '1px'
                }}
              >
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center flex-grow-1">
                      <div
                        className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: `var(--bs-${config.color})`,
                          opacity: config.visible ? 1 : 0.3,
                          width: '2.5rem',
                          height: '2.5rem',
                          minWidth: '2.5rem'
                        }}
                      >
                        <i
                          className={`${config.icon} text-white`}
                          style={{ fontSize: '1rem' }}
                        ></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 
                          className="mb-1 fw-medium" 
                          style={{ 
                            color: config.visible ? themeColors.textPrimary : themeColors.textMuted 
                          }}
                        >
                          {config.label}
                        </h6>
                        <small style={{ color: themeColors.textMuted }}>
                          {config.description}
                        </small>
                      </div>
                    </div>
                    <Form.Check
                      type="switch"
                      id={`kpi-switch-${config.id}`}
                      checked={config.visible}
                      onChange={() => handleToggleVisibility(config.id)}
                      className="ms-2"
                    />
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-1">
                      <Badge 
                        bg={config.color} 
                        style={{ opacity: config.visible ? 1 : 0.5 }}
                      >
                        {config.color}
                      </Badge>
                      <Badge 
                        bg="secondary" 
                        style={{ opacity: config.visible ? 1 : 0.5 }}
                      >
                        #{config.order}
                      </Badge>
                    </div>
                    <small style={{ color: themeColors.textMuted }}>
                      <i className="bi bi-link-45deg me-1"></i>
                      {config.endpoint}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Información adicional */}
        <div className="mt-4 p-3 rounded" style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}>
          <h6 style={{ color: themeColors.textPrimary }}>
            <i className="bi bi-info-circle me-2"></i>
            Información sobre KPIs
          </h6>
          <ul className="mb-0 small" style={{ color: themeColors.textMuted }}>
            <li>Los KPIs se actualizan automáticamente cada 5 minutos</li>
            <li>Los datos se filtran por año actual para mayor relevancia</li>
            <li>Puedes hacer clic en los KPIs del dashboard para navegar a las secciones correspondientes</li>
            <li>Los cambios se guardan en el navegador y persisten entre sesiones</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default KpiAdminSection;