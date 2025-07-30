// frontend/src/services/DashboardKpiVisibilityContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

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
  isGlobalConfig: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  aplicarConfiguracionGlobal: (configuracion: KpiConfig[]) => Promise<boolean>;
  error: string | null;
};

const defaultKpiConfigs: KpiConfig[] = [
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
  {
    id: 'altas_pic',
    label: 'Total Altas PIC',
    icon: 'bi bi-person-plus-fill',
    color: 'primary',
    visible: false,
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
    visible: false,
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
    visible: false,
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
    visible: false,
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
    visible: false,
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
    visible: false,
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
  const [kpiConfigs, setKpiConfigsState] = useState<KpiConfig[]>(defaultKpiConfigs);
  const [isGlobalConfig, setIsGlobalConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Cargar configuración al inicializar el contexto
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // Efecto adicional para monitorear la presencia del token después del login
  useEffect(() => {
    // Solo ejecutar si no hemos cargado configuración global y no es la primera carga
    if (!hasLoadedRef.current && !isGlobalConfig && !isLoading) {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔄 Token detectado, recargando configuración de KPIs...');
        hasLoadedRef.current = true;
        cargarConfiguracion();
      }
    }
  }, [isLoading, isGlobalConfig]);

  const cargarConfiguracion = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Cargando configuración global de dashboard KPIs...');

      // Verificar si el usuario es SuperAdmin - usando el token directamente
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No hay token, usando configuración local de dashboard KPIs');
        cargarDesdeLocalStorage();
        return;
      }

      try {
        // Decodificar el token para obtener los roles
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRoles = payload.roles || [];
        setIsSuperAdmin(userRoles.includes('SuperAdmin'));
      } catch (error) {
        console.log('No se pudo verificar rol de usuario desde token');
      }

      // Intentar cargar configuraciones globales
      const response = await axios.get(`${API_BASE_URL}/configuraciones-globales/tipo/dashboard_kpis`, {
        headers: { 'x-auth-token': token }
      });

      console.log('📊 [DEBUG] Respuesta completa de dashboard KPIs:', response);
      console.log('📊 [DEBUG] response.data:', response.data);
      console.log('📊 [DEBUG] response.data.success:', response.data?.success);
      console.log('📊 [DEBUG] response.data.data:', response.data?.data);
      console.log('📊 [DEBUG] response.data.data?.length:', response.data?.data?.length);

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        console.log('📊 [DEBUG] Configuraciones encontradas:', response.data.data);
        // Configuraciones globales encontradas
        const globalConfig = response.data.data.find((config: any) => config.clave === 'global_dashboard_kpis');
        
        console.log('📊 [DEBUG] globalConfig encontrado:', globalConfig);
        
        if (globalConfig && globalConfig.valor) {
          console.log('✅ Configuración global de dashboard KPIs cargada:', globalConfig.valor);
          setKpiConfigsState(globalConfig.valor);
          setIsGlobalConfig(true);
          console.log('🌐 Usando configuración global de dashboard KPIs');
          return;
        }
      }

      // No hay configuraciones globales, intentar localStorage
      console.log('⚠️ No hay configuración global, intentando localStorage...');
      cargarDesdeLocalStorage();

    } catch (error) {
      console.log('⚠️ Error cargando configuración global, usando localStorage:', error);
      cargarDesdeLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const cargarDesdeLocalStorage = () => {
    const savedConfigs = localStorage.getItem('dashboardKpiConfigs');
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs);
        
        // Migración automática: Corregir endpoints incorrectos
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
        
        setKpiConfigsState(migratedConfigs.sort((a, b) => a.order - b.order));
        localStorage.setItem('dashboardKpiConfigs', JSON.stringify(migratedConfigs));
        console.log('📱 Usando configuración local de dashboard KPIs');
      } catch (error) {
        console.error('Error parsing saved KPI configs:', error);
        setKpiConfigsState(defaultKpiConfigs);
      }
    } else {
      setKpiConfigsState(defaultKpiConfigs);
      console.log('🔄 Usando configuración por defecto de dashboard KPIs');
    }
    setIsGlobalConfig(false);
  };

  // Función para actualizar configuración
  const setKpiConfigs = (configs: KpiConfig[]) => {
    setKpiConfigsState(configs);
    if (!isGlobalConfig) {
      localStorage.setItem('dashboardKpiConfigs', JSON.stringify(configs));
    }
  };

  // Función para aplicar configuración como global (solo SuperAdmin)
  const aplicarConfiguracionGlobal = async (configuracion: KpiConfig[]): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await axios.post(
        `${API_BASE_URL}/configuraciones-globales/aplicar-global`,
        {
          tipo_configuracion: 'dashboard_kpis',
          configuracion_local: configuracion
        },
        {
          headers: { 'x-auth-token': token }
        }
      );

      if (response.status === 200) {
        // Recargar configuración para reflejar cambios
        await cargarConfiguracion();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error aplicando configuración global:', error);
      setError('Error aplicando configuración global');
      return false;
    }
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
        resetToDefaults,
        isGlobalConfig,
        isLoading,
        isSuperAdmin,
        aplicarConfiguracionGlobal,
        error
      }}
    >
      {children}
    </DashboardKpiVisibilityContext.Provider>
  );
};