import React, { createContext, useContext, useState, ReactNode } from 'react';

type SidebarItemVisibility = {
  [key: string]: boolean;
};

type SidebarVisibilityContextType = {
  visibility: SidebarItemVisibility;
  setVisibility: (newState: SidebarItemVisibility) => void;
};

const SidebarVisibilityContext = createContext<SidebarVisibilityContextType | undefined>(undefined);

export const useSidebarVisibility = () => {
  const context = useContext(SidebarVisibilityContext);
  if (!context) {
    throw new Error('useSidebarVisibility must be used within SidebarVisibilityProvider');
  }
  return context;
};

export const SidebarVisibilityProvider = ({ children }: { children: ReactNode }) => {
  // Cargar configuración inicial desde localStorage o usar valores por defecto
  const [visibility, setVisibilityState] = useState<SidebarItemVisibility>(() => {
    const savedVisibility = localStorage.getItem('sidebarVisibility');
    return savedVisibility ? JSON.parse(savedVisibility) : {
      dashboard: true,
      proyectos: true,
      tareas: true,
      usuarios: true,
      bitacora: true,
      hitos: true,
      itracker: true,
      tabulaciones: true,
      incidencias: true,
      stats: true,
      admin: true,
      reports: true,
      calendar: true,
      messages: true,
      notifications: true,
    };
  });
  
  // Función para actualizar estado y guardar en localStorage
  const setVisibility = (newState: SidebarItemVisibility) => {
    setVisibilityState(newState);
    localStorage.setItem('sidebarVisibility', JSON.stringify(newState));
  };

  return (
    <SidebarVisibilityContext.Provider value={{ visibility, setVisibility }}>
      {children}
    </SidebarVisibilityContext.Provider>
  );
};