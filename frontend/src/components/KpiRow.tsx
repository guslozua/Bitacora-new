// frontend/src/components/KpiRow.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import StatsCard from './StatsCard';
import { useDashboardKpiVisibility, KpiConfig } from '../services/DashboardKpiVisibilityContext';
import { kpiService, KpiData } from '../services/kpiService';

interface KpiRowProps {
  title?: string;
  subtitle?: string;
  refreshTrigger?: number; // Para forzar refresh desde componente padre
  onRefreshComplete?: () => void;
}

const KpiRow: React.FC<KpiRowProps> = ({ 
  title = "Indicadores del Sistema", 
  subtitle = "Métricas clave del año actual",
  refreshTrigger = 0,
  onRefreshComplete
}) => {
  const { getVisibleKpis } = useDashboardKpiVisibility();
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos de KPIs
  const loadKpiData = async () => {
    try {
      setLoading(true);
      const visibleKpis = getVisibleKpis();
      
      if (visibleKpis.length === 0) {
        setKpiData([]);
        setLoading(false);
        return;
      }

      // Crear array con estados de loading iniciales
      const loadingStates = visibleKpis.map(kpi => ({
        id: kpi.id,
        value: 0,
        loading: true
      }));
      setKpiData(loadingStates);

      // Cargar datos reales
      const data = await kpiService.fetchMultipleKpis(visibleKpis);
      setKpiData(data);
      
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar y cuando cambie refreshTrigger
  useEffect(() => {
    loadKpiData();
  }, [refreshTrigger, getVisibleKpis().map(k => k.id).join(',')]);

  const visibleKpis = getVisibleKpis();

  // No renderizar nada si no hay KPIs visibles
  if (visibleKpis.length === 0) {
    return null;
  }

  // Función para obtener datos de un KPI específico
  const getKpiValue = (kpiId: string): KpiData => {
    return kpiData.find(data => data.id === kpiId) || {
      id: kpiId,
      value: 0,
      loading: true
    };
  };

  // Función para manejar clicks en KPIs (navegación)
  const handleKpiClick = (config: KpiConfig) => {
    // Aquí puedes agregar lógica de navegación específica por KPI
    console.log(`Clicked on KPI: ${config.label}`);
    
    // Ejemplos de navegación según el KPI
    switch (config.id) {
      // 🔥 KPIS PRINCIPALES
      case 'proyectos_activos':
        window.location.href = '/projects';
        break;
      case 'tareas_pendientes':
        window.location.href = '/projects'; // o '/tasks' si tienes esa ruta
        break;
      case 'usuarios_activos':
        window.location.href = '/admin/users';
        break;
      case 'eventos_hoy':
        window.location.href = '/calendar';
        break;
      // 🆕 KPIS ADICIONALES
      case 'altas_pic':
      case 'altas_social':
        window.location.href = '/abmdashboard';
        break;
      case 'placas':
        window.location.href = '/placasdash';
        break;
      case 'itracker':
        window.location.href = '/itrackerdash';
        break;
      case 'tabulaciones':
        window.location.href = '/tabulacionesdash';
        break;
      case 'hitos_totales':
      case 'hitos_completados': // compatibilidad
        window.location.href = '/hitos';
        break;
      case 'eventos_mes':
        window.location.href = '/calendar';
        break;
      default:
        // No hacer nada para KPIs sin navegación específica
        break;
    }
  };

  // 🔥 NUEVO: Cálculo de columnas para máximo 4 por fila
  const getColSize = () => {
    const count = visibleKpis.length;
    if (count === 0) return 12;
    
    // Máximo 4 por fila
    if (count <= 4) {
      return Math.floor(12 / count); // 1 KPI = 12 cols, 2 KPIs = 6 cols, 3 KPIs = 4 cols, 4 KPIs = 3 cols
    }
    
    // Si hay más de 4, siempre usar 3 columnas (4 KPIs por fila)
    return 3;
  };

  const colSize = getColSize();

  return (
    <>
      {/* Header opcional */}
      {title && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0">{title}</h5>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
          <small className="text-muted">
            <i className="bi bi-clock me-1"></i>
            Actualizado: {new Date().toLocaleTimeString()}
          </small>
        </div>
      )}

      {/* Grid de KPIs */}
      <Row className="g-4">
        {visibleKpis.map((config) => {
          const data = getKpiValue(config.id);
          return (
            <Col key={config.id} md={colSize}>
              <StatsCard
                title={config.label}
                value={data.value}
                icon={config.icon}
                color={config.color}
                loading={data.loading}
                onClick={() => handleKpiClick(config)}
                subtitle={data.error ? `Error: ${data.error}` : config.description}
                // 🔥 REMOVED: trend (sin porcentajes)
              />
            </Col>
          );
        })}
      </Row>
    </>
  );
};

export default KpiRow;