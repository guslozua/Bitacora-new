// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Obtener tema inicial del localStorage o usar 'light' por defecto
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  // Aplicar el tema al cargar
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (newTheme === 'dark') {
      // Aplicar tema oscuro
      htmlElement.setAttribute('data-bs-theme', 'dark');
      htmlElement.classList.add('dark-mode');
      htmlElement.classList.remove('light-mode');
      bodyElement.classList.add('dark-mode');
      bodyElement.classList.remove('light-mode');
      
      // Aplicar estilos CSS personalizados para modo oscuro
      document.body.style.backgroundColor = '#212529';
      document.body.style.color = '#ffffff';
    } else {
      // Aplicar tema claro
      htmlElement.setAttribute('data-bs-theme', 'light');
      htmlElement.classList.add('light-mode');
      htmlElement.classList.remove('dark-mode');
      bodyElement.classList.add('light-mode');
      bodyElement.classList.remove('dark-mode');
      
      // Aplicar estilos CSS personalizados para modo claro
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#212529';
    }
    
    // Configurar SweetAlert2 según el tema
    configureSweetAlert(newTheme);
  };

  const configureSweetAlert = (currentTheme: Theme) => {
    // Configuración global de SweetAlert2 según el tema
    const Swal = (window as any).Swal;
    if (Swal) {
      const darkConfig = {
        background: '#343a40',
        color: '#ffffff',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d'
      };
      
      const lightConfig = {
        background: '#ffffff',
        color: '#212529',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d'
      };
      
      // Aplicar configuración por defecto
      Swal.mixin(currentTheme === 'dark' ? darkConfig : lightConfig);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDarkMode: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};