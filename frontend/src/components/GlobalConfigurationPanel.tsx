import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useSidebarVisibility } from '../services/SidebarVisibilityContext';
import { useDashboardSectionVisibility } from '../services/DashboardSectionVisibilityContext';
import { useDashboardKpiVisibility } from '../services/DashboardKpiVisibilityContext';
import globalConfigService from '../services/globalConfigService';
import Swal from 'sweetalert2';

interface GlobalConfigurationPanelProps {
  isDarkMode: boolean;
}

const GlobalConfigurationPanel: React.FC<GlobalConfigurationPanelProps> = ({ isDarkMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Contextos existentes  
  const { 
    visibility: sidebarVisibility, 
    isGlobalConfig: sidebarIsGlobal,
    isSuperAdmin,
    aplicarConfiguracionGlobal: aplicarSidebar 
  } = useSidebarVisibility();

  const { 
    sections: dashboardSections,
    getSectionsInOrder 
  } = useDashboardSectionVisibility();

  const { 
    kpiConfigs,
    getVisibleKpis 
  } = useDashboardKpiVisibility();

  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        background: '#212529',
        cardBackground: '#343a40',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        border: '#495057'
      };
    }
    return {
      background: '#f8f9fa',
      cardBackground: '#ffffff',
      textPrimary: '#212529',
      textSecondary: '#495057',
      border: '#dee2e6'
    };
  };

  const themeColors = getThemeColors();

  // Aplicar configuración del sidebar globalmente
  const handleApplySidebarGlobal = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Aplicar configuración del sidebar globalmente?',
        html: `
          <p>Esta acción aplicará la configuración actual del sidebar para <strong>todos los usuarios</strong>.</p>
          <div class="alert alert-warning mt-3">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Los usuarios perderán sus configuraciones personales del sidebar.
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aplicar globalmente',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0d6efd',
        background: isDarkMode ? '#343a40' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#212529'
      });

      if (result.isConfirmed) {
        setIsLoading(true);
        const success = await aplicarSidebar(sidebarVisibility);
        
        if (success) {
          setSuccess('Configuración del sidebar aplicada globalmente');
          
          Swal.fire({
            title: '¡Configuración aplicada!',
            text: 'El sidebar se ha configurado globalmente para todos los usuarios.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: isDarkMode ? '#343a40' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#212529'
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error aplicando configuración del sidebar:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar configuración de secciones del dashboard globalmente
  const handleApplyDashboardSectionsGlobal = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Aplicar configuración de secciones globalmente?',
        html: `
          <p>Esta acción aplicará la configuración actual de las secciones del dashboard para <strong>todos los usuarios</strong>.</p>
          <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle me-2"></i>
            Se aplicará el orden y visibilidad actual de las secciones.
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aplicar globalmente',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0d6efd',
        background: isDarkMode ? '#343a40' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#212529'
      });

      if (result.isConfirmed) {
        setIsLoading(true);
        
        const sectionsConfig = getSectionsInOrder();
        
        const success = await globalConfigService.applyGlobalConfiguration({
          tipo_configuracion: 'dashboard_sections',
          configuracion_local: sectionsConfig
        });
        
        if (success) {
          setSuccess('Configuración de secciones del dashboard aplicada globalmente');
          
          Swal.fire({
            title: '¡Configuración aplicada!',
            text: 'Las secciones del dashboard se han configurado globalmente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: isDarkMode ? '#343a40' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#212529'
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error aplicando configuración de secciones:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar configuración de KPIs globalmente
  const handleApplyKpisGlobal = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Aplicar configuración de KPIs globalmente?',
        html: `
          <p>Esta acción aplicará la configuración actual de los KPIs para <strong>todos los usuarios</strong>.</p>
          <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle me-2"></i>
            Se aplicará la visibilidad y orden actual de los KPIs.
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aplicar globalmente',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0d6efd',
        background: isDarkMode ? '#343a40' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#212529'
      });

      if (result.isConfirmed) {
        setIsLoading(true);
        
        const success = await globalConfigService.applyGlobalConfiguration({
          tipo_configuracion: 'dashboard_kpis',
          configuracion_local: kpiConfigs
        });
        
        if (success) {
          setSuccess('Configuración de KPIs aplicada globalmente');
          
          Swal.fire({
            title: '¡Configuración aplicada!',
            text: 'Los KPIs se han configurado globalmente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: isDarkMode ? '#343a40' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#212529'
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error aplicando configuración de KPIs:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // No mostrar nada si no es SuperAdmin
  if (!isSuperAdmin) {
    return (
      <Alert variant="warning" className="text-center">
        <i className="bi bi-shield-exclamation me-2"></i>
        Solo los usuarios con rol <strong>SuperAdmin</strong> pueden acceder a la gestión de configuraciones globales.
      </Alert>
    );
  }

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
          <h5 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
            <i className="bi bi-globe me-2 text-primary"></i>
            Gestión de Configuraciones Globales
          </h5>
          <Badge bg="info">
            <i className="bi bi-person-badge me-1"></i>
            SuperAdmin
          </Badge>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Mensajes de estado */}
        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccess(null)}>
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        {/* Sección para aplicar configuraciones actuales como globales */}
        <div className="mb-4">
          <h6 className="text-muted mb-3">
            <i className="bi bi-upload me-2"></i>
            Aplicar Configuraciones Actuales como Globales
          </h6>
          
          <Row className="g-3">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div 
                    className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '3rem', height: '3rem' }}
                  >
                    <i className="bi bi-layout-sidebar fs-4 text-primary"></i>
                  </div>
                  <h6 className="fw-bold mb-2">Sidebar</h6>
                  <p className="small text-muted mb-3">
                    Estado: {sidebarIsGlobal ? 
                      <Badge bg="success">Global</Badge> : 
                      <Badge bg="warning">Local</Badge>
                    }
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApplySidebarGlobal}
                    disabled={isLoading}
                    className="w-100"
                  >
                    {isLoading ? (
                      <Spinner animation="border" size="sm" className="me-1" />
                    ) : (
                      <i className="bi bi-globe me-1"></i>
                    )}
                    Aplicar Globalmente
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div 
                    className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '3rem', height: '3rem' }}
                  >
                    <i className="bi bi-grid-3x3-gap fs-4 text-success"></i>
                  </div>
                  <h6 className="fw-bold mb-2">Secciones Dashboard</h6>
                  <p className="small text-muted mb-3">
                    {dashboardSections.length} secciones configuradas
                  </p>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleApplyDashboardSectionsGlobal}
                    disabled={isLoading}
                    className="w-100"
                  >
                    {isLoading ? (
                      <Spinner animation="border" size="sm" className="me-1" />
                    ) : (
                      <i className="bi bi-globe me-1"></i>
                    )}
                    Aplicar Globalmente
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div 
                    className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '3rem', height: '3rem' }}
                  >
                    <i className="bi bi-bar-chart-line fs-4 text-info"></i>
                  </div>
                  <h6 className="fw-bold mb-2">KPIs Dashboard</h6>
                  <p className="small text-muted mb-3">
                    {getVisibleKpis().length} KPIs visibles
                  </p>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={handleApplyKpisGlobal}
                    disabled={isLoading}
                    className="w-100"
                  >
                    {isLoading ? (
                      <Spinner animation="border" size="sm" className="me-1" />
                    ) : (
                      <i className="bi bi-globe me-1"></i>
                    )}
                    Aplicar Globalmente
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 rounded" style={{ 
          backgroundColor: isDarkMode ? '#495057' : '#f8f9fa',
          fontSize: '0.875rem' 
        }}>
          <div className="row">
            <div className="col-md-6">
              <strong>🌐 Configuraciones Globales:</strong>
              <ul className="mb-0 mt-2" style={{ fontSize: '0.8rem' }}>
                <li>Se aplicarán para <strong>todos los usuarios</strong></li>
                <li>Sobrescriben configuraciones locales existentes</li>
                <li>Los usuarios regulares no pueden modificarlas</li>
              </ul>
            </div>
            <div className="col-md-6">
              <strong>⚠️ Consideraciones:</strong>
              <ul className="mb-0 mt-2" style={{ fontSize: '0.8rem' }}>
                <li>Los cambios son inmediatos para nuevas sesiones</li>
                <li>Las configuraciones se guardan en la base de datos</li>
                <li>Solo SuperAdmin puede aplicar configuraciones globales</li>
              </ul>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default GlobalConfigurationPanel;