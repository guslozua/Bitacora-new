// frontend/src/components/KpiStatusWidget.tsx
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { useDashboardKpiVisibility } from '../services/DashboardKpiVisibilityContext';
import { kpiService, KpiData } from '../services/kpiService';
import { useTheme } from '../context/ThemeContext';

const KpiStatusWidget: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { getVisibleKpis } = useDashboardKpiVisibility();
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

  // Cargar datos de KPIs
  const fetchKpiData = async () => {
    setLoading(true);
    try {
      const visibleKpis = getVisibleKpis();
      const data = await kpiService.fetchMultipleKpis(visibleKpis);
      setKpiData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchKpiData();
  }, []);

  // Formatear tiempo de última actualización
  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `hace ${diffInSeconds} segundos`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    }
  };

  // Obtener color del badge según el estado
  const getBadgeColor = (kpi: KpiData) => {
    if (kpi.error) return 'danger';
    if (kpi.loading) return 'warning';
    return 'success';
  };

  const visibleKpis = getVisibleKpis();
  const totalKpis = visibleKpis.length;
  const errorKpis = kpiData.filter(kpi => kpi.error).length;
  const successKpis = kpiData.filter(kpi => !kpi.error && !kpi.loading).length;

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
            <h6 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
              <i className="bi bi-speedometer2 me-2 text-primary"></i>
              Estado de KPIs en Tiempo Real
            </h6>
            <small style={{ color: themeColors.textMuted }}>
              Monitoreo de indicadores del dashboard principal
            </small>
          </div>
          <div className="d-flex align-items-center gap-2">
            {lastUpdate && (
              <small style={{ color: themeColors.textMuted }}>
                Actualizado {formatLastUpdate(lastUpdate)}
              </small>
            )}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={fetchKpiData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Cargando...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Actualizar
                </>
              )}
            </Button>
          </div>
        </div>
      </Card.Header>
      
      <Card.Body>
        {/* Resumen de estado */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div 
              className="text-center p-3 rounded" 
              style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}
            >
              <i className="bi bi-speedometer text-primary fs-4"></i>
              <h5 className="mt-2 mb-1" style={{ color: themeColors.textPrimary }}>
                {totalKpis}
              </h5>
              <small style={{ color: themeColors.textMuted }}>KPIs Configurados</small>
            </div>
          </div>
          <div className="col-md-4">
            <div 
              className="text-center p-3 rounded" 
              style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}
            >
              <i className="bi bi-check-circle text-success fs-4"></i>
              <h5 className="mt-2 mb-1" style={{ color: themeColors.textPrimary }}>
                {successKpis}
              </h5>
              <small style={{ color: themeColors.textMuted }}>Funcionando</small>
            </div>
          </div>
          <div className="col-md-4">
            <div 
              className="text-center p-3 rounded" 
              style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}
            >
              <i className="bi bi-exclamation-triangle text-warning fs-4"></i>
              <h5 className="mt-2 mb-1" style={{ color: themeColors.textPrimary }}>
                {errorKpis}
              </h5>
              <small style={{ color: themeColors.textMuted }}>Con Errores</small>
            </div>
          </div>
        </div>

        {/* Lista de KPIs */}
        {kpiData.length > 0 ? (
          <div className="row g-2">
            {kpiData.map((kpi) => {
              const config = visibleKpis.find(c => c.id === kpi.id);
              if (!config) return null;

              return (
                <div key={kpi.id} className="col-md-6 col-lg-4">
                  <div 
                    className="d-flex align-items-center p-2 rounded"
                    style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}
                  >
                    <div
                      className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: `var(--bs-${config.color})`,
                        opacity: kpi.error ? 0.5 : 1,
                        width: '2rem',
                        height: '2rem',
                        minWidth: '2rem'
                      }}
                    >
                      <i
                        className={`${config.icon} text-white`}
                        style={{ fontSize: '0.8rem' }}
                      ></i>
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex align-items-center justify-content-between">
                        <small 
                          className="fw-medium text-truncate" 
                          style={{ color: themeColors.textPrimary }}
                        >
                          {config.label}
                        </small>
                        <Badge bg={getBadgeColor(kpi)} className="ms-1">
                          {kpi.error ? 'Error' : kpi.loading ? 'Cargando' : kpi.value.toLocaleString()}
                        </Badge>
                      </div>
                      {kpi.error && (
                        <small className="text-danger d-block text-truncate">
                          {kpi.error}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Alert variant="info" className="mb-0">
            <i className="bi bi-info-circle me-2"></i>
            No hay KPIs configurados como visibles. 
            Ve a la sección de configuración de KPIs para activar algunos indicadores.
          </Alert>
        )}

        {/* Información adicional */}
        <div className="mt-4 p-3 rounded" style={{ backgroundColor: isDarkMode ? '#495057' : '#f8f9fa' }}>
          <small style={{ color: themeColors.textMuted }}>
            <i className="bi bi-info-circle me-2"></i>
            <strong>Nota:</strong> Los KPIs se actualizan automáticamente en el dashboard principal. 
            Este widget muestra el estado actual de los datos.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default KpiStatusWidget;