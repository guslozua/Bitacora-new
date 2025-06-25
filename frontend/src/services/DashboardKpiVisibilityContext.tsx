// frontend/src/services/DashboardKpiVisibilityContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface KpiConfig {
  id: string;
  label: string;
  icon: string;
  color: 'primary' | 'warning' | 'success' | 'danger' | 'info';
  visible: boolean;
  endpoint: string;
  dataKey: string;
  description: string;
  order: number;
}

type DashboardKpiVisibilityContextType = {
  kpiConfigs: KpiConfig[];
  setKpiConfigs: (configs: KpiConfig[]) => void;
  toggleKpiVisibility: (id: string) => void;
  getVisibleKpis: () => KpiConfig[];
  resetToDefaults: () => void;
};

const defaultKpiConfigs: KpiConfig[] = [
  // 🔥 KPIS PRINCIPALES DEL DASHBOARD (ANTES FIJOS)
  {
    id: 'proyectos_activos',
    label: 'Proyectos Activos',
    icon: 'bi bi-diagram-3-fill',
    color: 'primary',
    visible: true,
    endpoint: '/api/projects',
    dataKey: 'total_proyectos',
    description: 'Total de proyectos activos en el sistema',
    order: 1
  },
  {
    id: 'tareas_pendientes',
    label: 'Tareas Pendientes',
    icon: 'bi bi-list-task',
    color: 'warning',
    visible: true,
    endpoint: '/api/tasks',
    dataKey: 'tareas_pendientes',
    description: 'Tareas que requieren atención',
    order: 2
  },
  {
    id: 'usuarios_activos',
    label: 'Usuarios Activos',
    icon: 'bi bi-people-fill',
    color: 'success',
    visible: true,
    endpoint: '/api/users',
    dataKey: 'total_usuarios',
    description: 'Usuarios registrados en el sistema',
    order: 3
  },
  {
    id: 'eventos_hoy',
    label: 'Eventos Hoy',
    icon: 'bi bi-calendar-event',
    color: 'info',
    visible: true,
    endpoint: '/api/eventos',
    dataKey: 'eventos_hoy',
    description: 'Eventos programados para hoy',
    order: 4
  },
  // 🆕 KPIS ADICIONALES DEL SISTEMA
  {
    id: 'altas_pic',
    label: 'Total Altas PIC',
    icon: 'bi bi-person-plus-fill',
    color: 'primary',
    visible: true,
    endpoint: '/api/abm/stats',
    dataKey: 'total_altas_pic',
    description: 'Total de altas PIC en el año actual',
    order: 5
  },
  {
    id: 'altas_social',
    label: 'Total Altas Social',
    icon: 'bi bi-people-fill',
    color: 'success',
    visible: true,
    endpoint: '/api/abm/stats',
    dataKey: 'total_altas_social',
    description: 'Total de altas Social en el año actual',
    order: 6
  },
  {
    id: 'tabulaciones',
    label: 'Árboles de Tabulación',
    icon: 'bi bi-diagram-3-fill',
    color: 'info',
    visible: true,
    endpoint: '/api/tabulaciones/stats',
    dataKey: 'total',
    description: 'Total de árboles de tabulación gestionados',
    order: 7
  },
  {
    id: 'placas',
    label: 'Placas Emitidas',
    icon: 'bi bi-clipboard-check',
    color: 'warning',
    visible: true,
    endpoint: '/api/placas/stats',
    dataKey: 'total',
    description: 'Total de placas de novedades emitidas',
    order: 8
  },
  {
    id: 'itracker',
    label: 'iTracker Gestionados',
    icon: 'bi bi-bug-fill',
    color: 'danger',
    visible: true,
    endpoint: '/api/itracker/stats',
    dataKey: 'total',
    description: 'Total de tickets iTracker gestionados',
    order: 9
  },
  {
    id: 'incidentes_guardias',
    label: 'Incidentes en Guardias',
    icon: 'bi bi-shield-exclamation',
    color: 'warning',
    visible: true,
    endpoint: '/api/informes/incidentes',
    dataKey: 'total_incidentes',
    description: 'Total de incidentes registrados en guardias',
    order: 10
  },
  {
    id: 'hitos_totales',
    label: 'Hitos Totales',
    icon: 'bi bi-flag-fill',
    color: 'success',
    visible: false,
    endpoint: '/api/hitos',
    dataKey: 'total',
    description: 'Total de hitos registrados en el sistema',
    order: 11
  },
  {
    id: 'eventos_mes',
    label: 'Eventos del Mes',
    icon: 'bi bi-calendar-event',
    color: 'info',
    visible: false,
    endpoint: '/api/eventos',
    dataKey: 'eventos_mes',
    description: 'Eventos programados para el mes actual',
    order: 12
  }
];

const DashboardKpiVisibilityContext = createContext<DashboardKpiVisibilityContextType | undefined>(undefined);

export const useDashboardKpiVisibility = () => {
  const context = useContext(DashboardKpiVisibilityContext);
  if (!context) {
    throw new Error('useDashboardKpiVisibility must be used within DashboardKpiVisibilityProvider');
  }
  return context;
};

export const DashboardKpiVisibilityProvider = ({ children }: { children: ReactNode }) => {
  // Cargar configuración desde localStorage o usar valores por defecto
  const [kpiConfigs, setKpiConfigsState] = useState<KpiConfig[]>(() => {
    const savedConfigs = localStorage.getItem('dashboardKpiConfigs');
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs);
        
        // 🔥 MIGRACIÓN AUTOMÁTICA: Corregir endpoints incorrectos
        const migratedConfigs = defaultKpiConfigs.map(defaultKpi => {
          const saved = parsed.find((kpi: KpiConfig) => kpi.id === defaultKpi.id);
          if (saved) {
            // Aplicar migraciones específicas para endpoints corregidos
            const migrated = { ...defaultKpi, ...saved };
            
            // Forzar actualización de endpoints corregidos
            migrated.endpoint = defaultKpi.endpoint;
            migrated.dataKey = defaultKpi.dataKey;
            migrated.label = defaultKpi.label;
            migrated.description = defaultKpi.description;
            
            return migrated;
          }
          return defaultKpi;
        });
        
        // Guardar configuración migrada
        localStorage.setItem('dashboardKpiConfigs', JSON.stringify(migratedConfigs));
        
        return migratedConfigs.sort((a, b) => a.order - b.order);
      } catch (error) {
        console.error('Error parsing saved KPI configs:', error);
        return defaultKpiConfigs;
      }
    }
    return defaultKpiConfigs;
  });

  // Función para actualizar configuración y guardar en localStorage
  const setKpiConfigs = (configs: KpiConfig[]) => {
    setKpiConfigsState(configs);
    localStorage.setItem('dashboardKpiConfigs', JSON.stringify(configs));
  };

  // Toggle visibilidad de un KPI específico
  const toggleKpiVisibility = (id: string) => {
    const newConfigs = kpiConfigs.map(config =>
      config.id === id ? { ...config, visible: !config.visible } : config
    );
    setKpiConfigs(newConfigs);
  };

  // Obtener solo KPIs visibles
  const getVisibleKpis = () => {
    return kpiConfigs.filter(config => config.visible).sort((a, b) => a.order - b.order);
  };

  // Resetear a configuración por defecto
  const resetToDefaults = () => {
    setKpiConfigs(defaultKpiConfigs);
  };

  return (
    <DashboardKpiVisibilityContext.Provider 
      value={{ 
        kpiConfigs, 
        setKpiConfigs, 
        toggleKpiVisibility, 
        getVisibleKpis, 
        resetToDefaults 
      }}
    >
      {children}
    </DashboardKpiVisibilityContext.Provider>
  );
};