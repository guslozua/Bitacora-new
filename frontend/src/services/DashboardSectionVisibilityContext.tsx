// frontend/src/services/DashboardSectionVisibilityContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  // Cargar configuración desde localStorage o usar valores por defecto
  const [sections, setSectionsState] = useState<DashboardSection[]>(() => {
    const savedSections = localStorage.getItem('dashboardSections');
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        
        // Verificar si existe la nueva sección de KPIs
        const hasKpisSection = parsed.some((section: DashboardSection) => section.id === 'kpis-sistema');
        
        if (!hasKpisSection) {
          // Si no tiene la sección de KPIs, resetear a configuración por defecto
          console.log('Migrando configuración del dashboard para incluir KPIs del Sistema');
          localStorage.setItem('dashboardSections', JSON.stringify(defaultSections));
          return defaultSections;
        }
        
        // Migrar configuración si hay secciones nuevas en defaultSections
        const migratedSections = defaultSections.map(defaultSection => {
          const saved = parsed.find((section: DashboardSection) => section.id === defaultSection.id);
          return saved ? { ...defaultSection, ...saved } : defaultSection;
        });
        
        return migratedSections.sort((a, b) => a.order - b.order);
      } catch (error) {
        console.error('Error parsing saved dashboard sections:', error);
        return defaultSections;
      }
    }
    return defaultSections;
  });

  // Función para actualizar secciones y guardar en localStorage
  const setSections = (sections: DashboardSection[]) => {
    setSectionsState(sections);
    localStorage.setItem('dashboardSections', JSON.stringify(sections));
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
        getSectionsInOrder
      }}
    >
      {children}
    </DashboardSectionVisibilityContext.Provider>
  );
};