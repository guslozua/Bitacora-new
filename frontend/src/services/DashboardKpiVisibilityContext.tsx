// ============================================================================
// ARCHIVO ACTUALIZADO: frontend/src/services/DashboardKpiVisibilityContext.tsx
// Integración con API para configuraciones globales
// ============================================================================
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AdminConfigService from './AdminConfigService';

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
  setKpiConfigs: (configs: KpiConfig[], applyGlobally?: boolean) => Promise<void>;
  toggleKpiVisibility: (id: string) => void;
  getVisibleKpis: () => KpiConfig[];
  resetToDefaults: () => void;
  // 🆕 Nuevas propiedades para sincronización
  isServerSynced: boolean;
  lastUpdated: Date | null;
  syncFromServer: () => Promise<void>;
};

const defaultKpiConfigs: KpiConfig[] = [
  // 🔥 KPIS PRINCIPALES DEL DASHBOARD
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
    description: 'Total de tabulaciones registradas',
    order: 7
  },
  {
    id: 'itracker_registros',
    label: 'Registros iTracker',
    icon: 'bi bi-graph-up',
    color: 'primary',
    visible: true,
    endpoint: '/api/itracker/stats',
    dataKey: 'total_records',
    description: 'Total de registros iTracker procesados',
    order: 8
  },
  {
    id: 'hitos_completados',
    label: 'Hitos Completados',
    icon: 'bi bi-flag-fill',
    color: 'success',
    visible: true,
    endpoint: '/api/hitos/stats',
    dataKey: 'completados',
    description: 'Hitos completados este mes',
    order: 9
  },
  {
    id: 'placas_generadas',
    label: 'Placas Generadas',
    icon: 'bi bi-card-text',
    color: 'info',
    visible: true,
    endpoint: '/api/placas/stats',
    dataKey: 'total_placas',
    description: 'Total de placas generadas',
    order: 10
  },
  {
    id: 'contactos_activos',
    label: 'Contactos Activos',
    icon: 'bi bi-person-lines-fill',
    color: 'primary',
    visible: true,
    endpoint: '/api/contactos/stats',
    dataKey: 'activos',
    description: 'Contactos activos en el sistema',
    order: 11
  },
  {
    id: 'mensajes_pendientes',
    label: 'Mensajes Pendientes',
    icon: 'bi bi-envelope-fill',
    color: 'warning',
    visible: true,
    endpoint: '/api/mensajes/stats',
    dataKey: 'pendientes',
    description: 'Mensajes pendientes de respuesta',
    order: 12
  },
  {
    id: 'sesiones_activas',
    label: 'Sesiones Activas',
    icon: 'bi bi-activity',
    color: 'success',
    visible: false, // 🔒 Experimental - oculto por defecto
    endpoint: '/api/session-analysis/stats',
    dataKey: 'active_sessions',
    description: 'Sesiones activas en el sistema',
    order: 13
  },
  {
    id: 'alertas_aternity',
    label: 'Alertas Aternity',
    icon: 'bi bi-exclamation-triangle',
    color: 'danger',
    visible: false, // 🔒 Experimental - oculto por defecto
    endpoint: '/api/aternity/alerts',
    dataKey: 'active_alerts',
    description: 'Alertas activas en Aternity',
    order: 14
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
  // 🔄 Estados principales
  const [kpiConfigs, setKpiConfigsState] = useState<KpiConfig[]>(defaultKpiConfigs);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 🔄 Función para cargar configuración desde el servidor o localStorage
  const loadConfiguration = useCallback(async (): Promise<void> => {
    try {
      console.log('🔧 DashboardKpis: Cargando configuración...');

      // 1. Intentar cargar desde el servidor
      const serverConfig = await AdminConfigService.getKpiConfiguration(false);
      
      if (serverConfig && Array.isArray(serverConfig)) {
        console.log('✅ DashboardKpis: Configuración cargada desde servidor');
        setKpiConfigsState(serverConfig.sort((a, b) => a.order - b.order));
        setIsServerSynced(true);
        setLastUpdated(new Date());
        return;
      }

      // 2. Fallback a localStorage
      const savedKpis = localStorage.getItem('kpiConfigs');
      if (savedKpis) {
        try {
          const parsed = JSON.parse(savedKpis);
          
          if (Array.isArray(parsed)) {
            // Migrar configuración si hay KPIs nuevos en defaultKpiConfigs
            const migratedKpis = defaultKpiConfigs.map(defaultKpi => {
              const saved = parsed.find((kpi: KpiConfig) => kpi.id === defaultKpi.id);
              return saved ? { ...defaultKpi, ...saved } : defaultKpi;
            });
            
            setKpiConfigsState(migratedKpis.sort((a, b) => a.order - b.order));
            console.log('✅ DashboardKpis: Configuración cargada desde localStorage');
          } else {
            throw new Error('Invalid format in localStorage');
          }
          
          setIsServerSynced(false);
        } catch (error) {
          console.error('❌ DashboardKpis: Error parsing localStorage, using defaults');
          setKpiConfigsState(defaultKpiConfigs);
          setIsServerSynced(false);
        }
      } else {
        // 3. Usar configuración por defecto
        console.log('🔧 DashboardKpis: Usando configuración por defecto');
        setKpiConfigsState(defaultKpiConfigs);
        setIsServerSynced(false);
      }
    } catch (error) {
      console.error('❌ DashboardKpis: Error loading configuration:', error);
      
      // Fallback final a localStorage o defaults
      const savedKpis = localStorage.getItem('kpiConfigs');
      if (savedKpis) {
        try {
          const parsed = JSON.parse(savedKpis);
          if (Array.isArray(parsed)) {
            setKpiConfigsState(parsed);
          } else {
            setKpiConfigsState(defaultKpiConfigs);
          }
          setIsServerSynced(false);
        } catch {
          setKpiConfigsState(defaultKpiConfigs);
          setIsServerSynced(false);
        }
      } else {
        setKpiConfigsState(defaultKpiConfigs);
        setIsServerSynced(false);
      }
    }
  }, []);

  // 🔄 Inicializar configuración al montar el componente
  useEffect(() => {
    if (!isInitialized) {
      loadConfiguration().finally(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized, loadConfiguration]);

  // 🔄 Función para actualizar KPIs y guardar (local y/o servidor)
  const setKpiConfigs = async (newConfigs: KpiConfig[], applyGlobally: boolean = false): Promise<void> => {
    try {
      // 1. Actualizar estado local
      setKpiConfigsState(newConfigs);
      setLastUpdated(new Date());

      // 2. Guardar en localStorage como backup
      localStorage.setItem('kpiConfigs', JSON.stringify(newConfigs));

      // 3. Guardar en servidor
      if (applyGlobally) {
        console.log('🌐 DashboardKpis: Guardando configuración globalmente');
        const success = await AdminConfigService.saveKpiConfiguration(newConfigs, true);
        
        if (success) {
          setIsServerSynced(true);
          console.log('✅ DashboardKpis: Configuración global guardada exitosamente');
        } else {
          console.error('❌ DashboardKpis: Error guardando configuración global');
          setIsServerSynced(false);
        }
      } else {
        // Guardar configuración personal
        const success = await AdminConfigService.saveKpiConfiguration(newConfigs, false);
        
        if (success) {
          setIsServerSynced(true);
          console.log('✅ DashboardKpis: Configuración personal guardada exitosamente');
        } else {
          console.error('❌ DashboardKpis: Error guardando configuración personal');
          setIsServerSynced(false);
        }
      }
    } catch (error) {
      console.error('❌ DashboardKpis: Error saving configuration:', error);
      setIsServerSynced(false);
      
      // Solo actualizar localStorage si falla el servidor
      localStorage.setItem('kpiConfigs', JSON.stringify(newConfigs));
    }
  };

  // 🔄 Función para sincronizar desde servidor
  const syncFromServer = async (): Promise<void> => {
    await loadConfiguration();
  };

  // Toggle visibilidad de un KPI específico
  const toggleKpiVisibility = (id: string) => {
    const newConfigs = kpiConfigs.map(kpi =>
      kpi.id === id ? { ...kpi, visible: !kpi.visible } : kpi
    );
    setKpiConfigs(newConfigs, false); // Solo guardar localmente
  };

  // Obtener solo KPIs visibles
  const getVisibleKpis = () => {
    return kpiConfigs.filter(kpi => kpi.visible).sort((a, b) => a.order - b.order);
  };

  // Resetear a configuración por defecto
  const resetToDefaults = () => {
    setKpiConfigs(defaultKpiConfigs, false);
  };

  return (
    <DashboardKpiVisibilityContext.Provider 
      value={{ 
        kpiConfigs, 
        setKpiConfigs, 
        toggleKpiVisibility, 
        getVisibleKpis, 
        resetToDefaults,
        // 🆕 Nuevas propiedades para sincronización
        isServerSynced,
        lastUpdated,
        syncFromServer
      }}
    >
      {children}
    </DashboardKpiVisibilityContext.Provider>
  );
};