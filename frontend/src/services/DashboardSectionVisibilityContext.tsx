// frontend/src/services/DashboardSectionVisibilityContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

export interface DashboardSection {
  id: string;
  label: string;
  description: string;
  visible: boolean;
  icon: string;
  order: number;
}

type DashboardSectionVisibilityContextType = {
  sections: DashboardSection[];
  setSections: (sections: DashboardSection[]) => void;
  toggleSectionVisibility: (id: string) => void;
  getVisibleSections: () => DashboardSection[];
  resetToDefaults: () => void;
  isSectionVisible: (id: string) => boolean;
  reorderSections: (dragIndex: number, hoverIndex: number) => void;
  moveSectionToPosition: (sectionId: string, newOrder: number) => void;
  getSectionsInOrder: () => DashboardSection[];
  isGlobalConfig: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  aplicarConfiguracionGlobal: (configuracion: DashboardSection[]) => Promise<boolean>;
  error: string | null;
};

const defaultSections: DashboardSection[] = [
  {
    id: 'anuncios',
    label: 'Anuncios',
    description: 'Carrusel de anuncios y noticias importantes',
    visible: true,
    icon: 'bi-megaphone',
    order: 1
  },
  {
    id: 'kpis-sistema',
    label: 'KPIs del Sistema',
    description: 'Indicadores clave y métricas del sistema',
    visible: true,
    icon: 'bi-speedometer2',
    order: 2
  },
  {
    id: 'actividad-reciente',
    label: 'Actividad Reciente',
    description: 'Últimas acciones y cambios en el sistema',
    visible: true,
    icon: 'bi-clock-history',
    order: 3
  },
  {
    id: 'calendario',
    label: 'Calendario',
    description: 'Mini calendario con eventos próximos',
    visible: true,
    icon: 'bi-calendar-event',
    order: 4
  },
  {
    id: 'reportes-rapidos',
    label: 'Reportes Rápidos',
    description: 'Gráfico con estadísticas del sistema',
    visible: false,
    icon: 'bi-bar-chart-fill',
    order: 5
  },
  {
    id: 'proximos-eventos',
    label: 'Próximos Eventos',
    description: 'Lista de eventos programados',
    visible: false,
    icon: 'bi-calendar-check',
    order: 6
  },
  {
    id: 'acciones-rapidas',
    label: 'Acciones Rápidas',
    description: 'Botones para crear proyectos, tareas y eventos',
    visible: false,
    icon: 'bi-lightning-charge',
    order: 7
  },
  {
    id: 'resumen-sistema',
    label: 'Resumen del Sistema',
    description: 'Estadísticas generales y métricas del sistema',
    visible: false,
    icon: 'bi-pie-chart-fill',
    order: 8
  },
  {
    id: 'cronograma-proyectos',
    label: 'Cronograma de Proyectos',
    description: 'Vista Gantt con el cronograma de proyectos',
    visible: false,
    icon: 'bi-diagram-3-fill',
    order: 9
  }
];

const DashboardSectionVisibilityContext = createContext<DashboardSectionVisibilityContextType | undefined>(undefined);

export const useDashboardSectionVisibility = () => {
  const context = useContext(DashboardSectionVisibilityContext);
  if (!context) {
    throw new Error('useDashboardSectionVisibility must be used within DashboardSectionVisibilityProvider');
  }
  return context;
};

export const DashboardSectionVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [sections, setSectionsState] = useState<DashboardSection[]>(defaultSections);
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
        console.log('🔄 Token detectado, recargando configuración de secciones...');
        hasLoadedRef.current = true;
        cargarConfiguracion();
      }
    }
  }, [isLoading, isGlobalConfig]);

  const cargarConfiguracion = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Cargando configuración global de dashboard sections...');

      // Verificar si el usuario es SuperAdmin - usando el token directamente
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No hay token, usando configuración local de dashboard sections');
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
      const response = await axios.get(`${API_BASE_URL}/configuraciones-globales/tipo/dashboard_sections`, {
        headers: { 'x-auth-token': token }
      });

      console.log('📊 [DEBUG] Respuesta completa de dashboard sections:', response);
      console.log('📊 [DEBUG] response.data:', response.data);
      console.log('📊 [DEBUG] response.data.success:', response.data?.success);
      console.log('📊 [DEBUG] response.data.data:', response.data?.data);
      console.log('📊 [DEBUG] response.data.data?.length:', response.data?.data?.length);

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        console.log('📊 [DEBUG] Configuraciones encontradas:', response.data.data);
        // Configuraciones globales encontradas
        const globalConfig = response.data.data.find((config: any) => config.clave === 'global_dashboard_sections');
        
        console.log('📊 [DEBUG] globalConfig encontrado:', globalConfig);
        
        if (globalConfig && globalConfig.valor) {
          console.log('✅ Configuración global de dashboard sections cargada:', globalConfig.valor);
          setSectionsState(globalConfig.valor);
          setIsGlobalConfig(true);
          console.log('🌐 Usando configuración global de dashboard sections');
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
    const savedSections = localStorage.getItem('dashboardSections');
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        
        // Verificar si existe la nueva sección de KPIs
        const hasKpisSection = parsed.some((section: DashboardSection) => section.id === 'kpis-sistema');
        
        if (!hasKpisSection) {
          // Si no tiene la sección de KPIs, resetear a configuración por defecto
          console.log('Migrando configuración del dashboard para incluir KPIs del Sistema');
          setSectionsState(defaultSections);
          localStorage.setItem('dashboardSections', JSON.stringify(defaultSections));
          return;
        }
        
        // Migrar configuración si hay secciones nuevas en defaultSections
        const migratedSections = defaultSections.map(defaultSection => {
          const saved = parsed.find((section: DashboardSection) => section.id === defaultSection.id);
          return saved ? { ...defaultSection, ...saved } : defaultSection;
        });
        
        setSectionsState(migratedSections.sort((a, b) => a.order - b.order));
        console.log('📱 Usando configuración local de dashboard sections');
      } catch (error) {
        console.error('Error parsing saved dashboard sections:', error);
        setSectionsState(defaultSections);
      }
    } else {
      setSectionsState(defaultSections);
      console.log('🔄 Usando configuración por defecto de dashboard sections');
    }
    setIsGlobalConfig(false);
  };

  // Función para actualizar secciones
  const setSections = (sections: DashboardSection[]) => {
    setSectionsState(sections);
    if (!isGlobalConfig) {
      localStorage.setItem('dashboardSections', JSON.stringify(sections));
    }
  };

  // Función para aplicar configuración como global (solo SuperAdmin)
  const aplicarConfiguracionGlobal = async (configuracion: DashboardSection[]): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await axios.post(
        `${API_BASE_URL}/configuraciones-globales/aplicar-global`,
        {
          tipo_configuracion: 'dashboard_sections',
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

  // Toggle visibilidad de una sección específica
  const toggleSectionVisibility = (id: string) => {
    const newSections = sections.map(section =>
      section.id === id ? { ...section, visible: !section.visible } : section
    );
    setSections(newSections);
  };

  // Obtener solo secciones visibles
  const getVisibleSections = () => {
    return sections.filter(section => section.visible).sort((a, b) => a.order - b.order);
  };

  // Verificar si una sección específica está visible
  const isSectionVisible = (id: string) => {
    const section = sections.find(s => s.id === id);
    return section ? section.visible : false;
  };

  // Resetear a configuración por defecto
  const resetToDefaults = () => {
    setSections(defaultSections);
  };

  // Reordenar secciones por drag & drop
  const reorderSections = (dragIndex: number, hoverIndex: number) => {
    const newSections = [...sections];
    const draggedSection = newSections[dragIndex];
    
    // Remover el elemento arrastrado
    newSections.splice(dragIndex, 1);
    // Insertarlo en la nueva posición
    newSections.splice(hoverIndex, 0, draggedSection);
    
    // Actualizar los números de orden
    const reorderedSections = newSections.map((section, index) => ({
      ...section,
      order: index + 1
    }));
    
    setSections(reorderedSections);
  };

  // Mover una sección a una posición específica
  const moveSectionToPosition = (sectionId: string, newOrder: number) => {
    const currentSections = [...sections];
    const sectionToMove = currentSections.find(s => s.id === sectionId);
    
    if (!sectionToMove) return;
    
    // Remover la sección de su posición actual
    const filteredSections = currentSections.filter(s => s.id !== sectionId);
    
    // Insertar en la nueva posición
    filteredSections.splice(newOrder - 1, 0, sectionToMove);
    
    // Actualizar todos los números de orden
    const reorderedSections = filteredSections.map((section, index) => ({
      ...section,
      order: index + 1
    }));
    
    setSections(reorderedSections);
  };

  // Obtener secciones ordenadas
  const getSectionsInOrder = () => {
    return [...sections].sort((a, b) => a.order - b.order);
  };

  return (
    <DashboardSectionVisibilityContext.Provider 
      value={{ 
        sections, 
        setSections, 
        toggleSectionVisibility, 
        getVisibleSections, 
        resetToDefaults,
        isSectionVisible,
        reorderSections,
        moveSectionToPosition,
        getSectionsInOrder,
        isGlobalConfig,
        isLoading,
        isSuperAdmin,
        aplicarConfiguracionGlobal,
        error
      }}
    >
      {children}
    </DashboardSectionVisibilityContext.Provider>
  );
};