// ============================================================================
// ARCHIVO ACTUALIZADO: frontend/src/services/DashboardSectionVisibilityContext.tsx
// Integración con API para configuraciones globales
// ============================================================================
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AdminConfigService from './AdminConfigService';

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
  setSections: (sections: DashboardSection[], applyGlobally?: boolean) => Promise<void>;
  toggleSectionVisibility: (id: string) => void;
  getVisibleSections: () => DashboardSection[];
  resetToDefaults: () => void;
  isSectionVisible: (id: string) => boolean;
  reorderSections: (dragIndex: number, hoverIndex: number) => void;
  moveSectionToPosition: (sectionId: string, newOrder: number) => void;
  getSectionsInOrder: () => DashboardSection[];
  // 🆕 Nuevas propiedades para sincronización
  isServerSynced: boolean;
  lastUpdated: Date | null;
  syncFromServer: () => Promise<void>;
};

const defaultSections: DashboardSection[] = [
  {
    id: 'kpis-sistema',
    label: 'KPIs del Sistema',
    description: 'Indicadores clave y métricas del sistema',
    visible: true,
    icon: 'bi-speedometer2',
    order: 1
  },
  {
    id: 'actividad-reciente',
    label: 'Actividad Reciente',
    description: 'Últimas acciones y cambios en el sistema',
    visible: true,
    icon: 'bi-clock-history',
    order: 2
  },
  {
    id: 'calendario',
    label: 'Calendario',
    description: 'Mini calendario con eventos próximos',
    visible: true,
    icon: 'bi-calendar-event',
    order: 3
  },
  {
    id: 'anuncios',
    label: 'Anuncios',
    description: 'Carrusel de anuncios y noticias importantes',
    visible: true,
    icon: 'bi-megaphone',
    order: 4
  },
  {
    id: 'reportes-rapidos',
    label: 'Reportes Rápidos',
    description: 'Gráfico con estadísticas del sistema',
    visible: true,
    icon: 'bi-bar-chart-fill',
    order: 5
  },
  {
    id: 'proximos-eventos',
    label: 'Próximos Eventos',
    description: 'Lista de eventos programados',
    visible: true,
    icon: 'bi-calendar-check',
    order: 6
  },
  {
    id: 'acciones-rapidas',
    label: 'Acciones Rápidas',
    description: 'Botones para crear proyectos, tareas y eventos',
    visible: true,
    icon: 'bi-lightning-charge',
    order: 7
  },
  {
    id: 'resumen-sistema',
    label: 'Resumen del Sistema',
    description: 'Estadísticas generales y métricas del sistema',
    visible: true,
    icon: 'bi-pie-chart-fill',
    order: 8
  },
  {
    id: 'cronograma-proyectos',
    label: 'Cronograma de Proyectos',
    description: 'Vista Gantt con el cronograma de proyectos',
    visible: true,
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
  // 🔄 Estados principales
  const [sections, setSectionsState] = useState<DashboardSection[]>(defaultSections);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 🔄 Función para cargar configuración desde el servidor o localStorage
  const loadConfiguration = useCallback(async (): Promise<void> => {
    try {
      console.log('🔧 DashboardSections: Cargando configuración...');

      // 1. Intentar cargar desde el servidor
      const serverConfig = await AdminConfigService.getDashboardConfiguration(false);
      
      if (serverConfig && Array.isArray(serverConfig)) {
        console.log('✅ DashboardSections: Configuración cargada desde servidor');
        setSectionsState(serverConfig.sort((a, b) => a.order - b.order));
        setIsServerSynced(true);
        setLastUpdated(new Date());
        return;
      }

      // 2. Fallback a localStorage
      const savedSections = localStorage.getItem('dashboardSections');
      if (savedSections) {
        try {
          const parsed = JSON.parse(savedSections);
          
          // ✅ NUEVA LÓGICA: Verificar que tenga TODAS las 9 secciones
          const expectedSectionCount = 9;
          const currentSectionCount = Array.isArray(parsed) ? parsed.length : 0;
          
          if (currentSectionCount < expectedSectionCount) {
            console.log(`🔄 DashboardSections: Configuración incompleta (${currentSectionCount}/${expectedSectionCount}). Usando configuración completa.`);
            localStorage.setItem('dashboardSections', JSON.stringify(defaultSections));
            setSectionsState(defaultSections);
          } else {
            // Migrar configuración asegurando que todas las secciones estén presentes
            const migratedSections = defaultSections.map(defaultSection => {
              const saved = parsed.find((section: DashboardSection) => section.id === defaultSection.id);
              return saved ? { ...defaultSection, ...saved } : defaultSection;
            });
            
            // Verificar que tenemos todas las secciones después de la migración
            if (migratedSections.length === expectedSectionCount) {
              setSectionsState(migratedSections.sort((a, b) => a.order - b.order));
              console.log(`✅ DashboardSections: Configuración migrada con ${migratedSections.length} secciones`);
            } else {
              console.log('🔄 DashboardSections: Migración incompleta, usando defaults');
              setSectionsState(defaultSections);
              localStorage.setItem('dashboardSections', JSON.stringify(defaultSections));
            }
          }
          
          setIsServerSynced(false);
        } catch (error) {
          console.error('❌ DashboardSections: Error parsing localStorage, using defaults');
          setSectionsState(defaultSections);
          setIsServerSynced(false);
        }
      } else {
        // 3. Usar configuración por defecto
        console.log('🔧 DashboardSections: Usando configuración por defecto');
        setSectionsState(defaultSections);
        setIsServerSynced(false);
      }
    } catch (error) {
      console.error('❌ DashboardSections: Error loading configuration:', error);
      
      // Fallback final a localStorage o defaults
      const savedSections = localStorage.getItem('dashboardSections');
      if (savedSections) {
        try {
          const parsed = JSON.parse(savedSections);
          setSectionsState(parsed);
          setIsServerSynced(false);
        } catch {
          setSectionsState(defaultSections);
          setIsServerSynced(false);
        }
      } else {
        setSectionsState(defaultSections);
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

  // 🔄 Función para actualizar secciones y guardar (local y/o servidor)
  const setSections = async (newSections: DashboardSection[], applyGlobally: boolean = false): Promise<void> => {
    try {
      // 1. Actualizar estado local
      setSectionsState(newSections);
      setLastUpdated(new Date());

      // 2. Guardar en localStorage como backup
      localStorage.setItem('dashboardSections', JSON.stringify(newSections));

      // 3. Guardar en servidor
      if (applyGlobally) {
        console.log('🌐 DashboardSections: Guardando configuración globalmente');
        const success = await AdminConfigService.saveDashboardConfiguration(newSections, true);
        
        if (success) {
          setIsServerSynced(true);
          console.log('✅ DashboardSections: Configuración global guardada exitosamente');
        } else {
          console.error('❌ DashboardSections: Error guardando configuración global');
          setIsServerSynced(false);
        }
      } else {
        // Guardar configuración personal
        const success = await AdminConfigService.saveDashboardConfiguration(newSections, false);
        
        if (success) {
          setIsServerSynced(true);
          console.log('✅ DashboardSections: Configuración personal guardada exitosamente');
        } else {
          console.error('❌ DashboardSections: Error guardando configuración personal');
          setIsServerSynced(false);
        }
      }
    } catch (error) {
      console.error('❌ DashboardSections: Error saving configuration:', error);
      setIsServerSynced(false);
      
      // Solo actualizar localStorage si falla el servidor
      localStorage.setItem('dashboardSections', JSON.stringify(newSections));
    }
  };

  // 🔄 Función para sincronizar desde servidor
  const syncFromServer = async (): Promise<void> => {
    await loadConfiguration();
  };

  // Toggle visibilidad de una sección específica
  const toggleSectionVisibility = (id: string) => {
    const newSections = sections.map(section =>
      section.id === id ? { ...section, visible: !section.visible } : section
    );
    setSections(newSections, false); // Solo guardar localmente
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
    setSections(defaultSections, false);
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
    
    setSections(reorderedSections, false);
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
    
    setSections(reorderedSections, false);
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
        // 🆕 Nuevas propiedades para sincronización
        isServerSynced,
        lastUpdated,
        syncFromServer
      }}
    >
      {children}
    </DashboardSectionVisibilityContext.Provider>
  );
};