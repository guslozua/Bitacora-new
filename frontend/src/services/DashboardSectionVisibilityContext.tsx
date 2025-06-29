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
};

const defaultSections: DashboardSection[] = [
  {
    id: 'actividad-reciente',
    label: 'Actividad Reciente',
    description: 'Últimas acciones y cambios en el sistema',
    visible: true,
    icon: 'bi-clock-history',
    order: 1
  },
  {
    id: 'calendario',
    label: 'Calendario',
    description: 'Mini calendario con eventos próximos',
    visible: true,
    icon: 'bi-calendar-event',
    order: 2
  },
  {
    id: 'anuncios',
    label: 'Anuncios',
    description: 'Carrusel de anuncios y noticias importantes',
    visible: true,
    icon: 'bi-megaphone',
    order: 3
  },
  {
    id: 'reportes-rapidos',
    label: 'Reportes Rápidos',
    description: 'Gráfico con estadísticas del sistema',
    visible: true,
    icon: 'bi-bar-chart-fill',
    order: 4
  },
  {
    id: 'proximos-eventos',
    label: 'Próximos Eventos',
    description: 'Lista de eventos programados',
    visible: true,
    icon: 'bi-calendar-check',
    order: 5
  },
  {
    id: 'acciones-rapidas',
    label: 'Acciones Rápidas',
    description: 'Botones para crear proyectos, tareas y eventos',
    visible: true,
    icon: 'bi-lightning-charge',
    order: 6
  },
  {
    id: 'resumen-sistema',
    label: 'Resumen del Sistema',
    description: 'Estadísticas generales y métricas del sistema',
    visible: true,
    icon: 'bi-pie-chart-fill',
    order: 7
  },
  {
    id: 'cronograma-proyectos',
    label: 'Cronograma de Proyectos',
    description: 'Vista Gantt con el cronograma de proyectos',
    visible: true,
    icon: 'bi-diagram-3-fill',
    order: 8
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

  return (
    <DashboardSectionVisibilityContext.Provider 
      value={{ 
        sections, 
        setSections, 
        toggleSectionVisibility, 
        getVisibleSections, 
        resetToDefaults,
        isSectionVisible
      }}
    >
      {children}
    </DashboardSectionVisibilityContext.Provider>
  );
};