import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

type SidebarItemVisibility = {
  [key: string]: boolean;
};

type SidebarVisibilityContextType = {
  visibility: SidebarItemVisibility;
  setVisibility: (newState: SidebarItemVisibility) => void;
  isGlobalConfig: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  aplicarConfiguracionGlobal: (configuracion: SidebarItemVisibility) => Promise<boolean>;
  error: string | null;
};

const SidebarVisibilityContext = createContext<SidebarVisibilityContextType | undefined>(undefined);

export const useSidebarVisibility = () => {
  const context = useContext(SidebarVisibilityContext);
  if (!context) {
    throw new Error('useSidebarVisibility must be used within SidebarVisibilityProvider');
  }
  return context;
};

// Configuración por defecto del sidebar
const defaultSidebarConfig: SidebarItemVisibility = {
  dashboard: true,
  proyectos: true,
  tareas: true,
  usuarios: true,
  bitacora: true,
  hitos: true,
  itracker: true,
  tabulaciones: true,
  sessionanalysis: true,
  aternity: true,
  incidencias: true,
  contactos: true,
  stats: true,
  admin: true,
  reports: true,
  calendar: true,
  messages: true,
  notifications: true,
  links: true,
  glosario: true,
  placas: true,
};

export const SidebarVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [visibility, setVisibilityState] = useState<SidebarItemVisibility>(defaultSidebarConfig);
  const [isGlobalConfig, setIsGlobalConfig] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si el usuario es SuperAdmin
  const checkUserRole = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Decodificar el token para obtener la información del usuario
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.roles || [];
        setIsSuperAdmin(roles.includes('SuperAdmin'));
        return roles.includes('SuperAdmin');
      }
    } catch (error) {
      console.error('Error verificando rol de usuario:', error);
    }
    return false;
  };

  // Cargar configuraciones globales desde el servidor
  const loadGlobalConfiguration = async (): Promise<SidebarItemVisibility | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 No hay token, usando configuración local');
        return null;
      }

      console.log('🔍 Cargando configuración global del sidebar...');
      
      const response = await axios.get(
        `${API_BASE_URL}/configuraciones-globales/tipo/sidebar`,
        {
          headers: { 'x-auth-token': token }
        }
      );

      if (response.data.success && response.data.data.length > 0) {
        // Buscar la configuración por defecto
        const defaultConfig = response.data.data.find((config: any) => 
          config.clave === 'default_visibility' || config.clave === 'global_sidebar'
        );

        if (defaultConfig && defaultConfig.valor) {
          console.log('✅ Configuración global del sidebar cargada:', defaultConfig.valor);
          
          // Verificar si el valor es un objeto de configuración directa o contiene estructuras anidadas
          let sidebarData;
          if (typeof defaultConfig.valor === 'object' && !Array.isArray(defaultConfig.valor)) {
            // Verificar si es un objeto con propiedades de visibilidad directas
            const hasDirectProps = Object.keys(defaultConfig.valor).some(key => 
              typeof defaultConfig.valor[key] === 'boolean'
            );
            
            if (hasDirectProps) {
              // Es un objeto con propiedades de visibilidad directas (formato correcto)
              sidebarData = defaultConfig.valor;
            } else if (defaultConfig.valor.sidebar && typeof defaultConfig.valor.sidebar === 'object') {
              // Es un objeto con propiedad sidebar anidada
              sidebarData = defaultConfig.valor.sidebar;
            } else {
              // Es otro tipo de objeto, intentar extraer configuración válida
              console.warn('⚠️ Formato de configuración global inesperado:', defaultConfig.valor);
              const validConfig = Object.values(defaultConfig.valor).find(value => 
                typeof value === 'object' && value !== null && !Array.isArray(value)
              );
              sidebarData = validConfig || defaultSidebarConfig;
            }
          } else {
            // Fallback a configuración por defecto
            console.error('❌ Formato de configuración global inválido, usando por defecto');
            sidebarData = defaultSidebarConfig;
          }
          
          setIsGlobalConfig(true);
          return sidebarData;
        }
      }

      console.log('ℹ️ No se encontró configuración global del sidebar');
      return null;

    } catch (error) {
      console.error('❌ Error cargando configuración global del sidebar:', error);
      setError('Error cargando configuración global');
      return null;
    }
  };

  // Cargar configuración desde localStorage como fallback
  const loadLocalConfiguration = (): SidebarItemVisibility => {
    try {
      const savedVisibility = localStorage.getItem('sidebarVisibility');
      if (savedVisibility) {
        const parsed = JSON.parse(savedVisibility);
        console.log('📱 Configuración local del sidebar cargada');
        return { ...defaultSidebarConfig, ...parsed };
      }
    } catch (error) {
      console.error('Error cargando configuración local:', error);
    }
    
    console.log('🔧 Usando configuración por defecto del sidebar');
    return defaultSidebarConfig;
  };

  // Inicializar configuración
  const initializeConfiguration = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar rol de usuario
      const superAdmin = checkUserRole();
      
      // Intentar cargar configuración global
      const globalConfig = await loadGlobalConfiguration();
      
      if (globalConfig) {
        // Usar configuración global
        setVisibilityState(globalConfig);
        setIsGlobalConfig(true);
        console.log('🌐 Usando configuración global del sidebar');
      } else {
        // Usar configuración local como fallback
        const localConfig = loadLocalConfiguration();
        setVisibilityState(localConfig);
        setIsGlobalConfig(false);
        console.log('📱 Usando configuración local del sidebar');
      }

    } catch (error) {
      console.error('❌ Error inicializando configuración del sidebar:', error);
      setError('Error inicializando configuración');
      
      // En caso de error, usar configuración local
      const localConfig = loadLocalConfiguration();
      setVisibilityState(localConfig);
      setIsGlobalConfig(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar visibilidad
  const setVisibility = (newState: SidebarItemVisibility) => {
    setVisibilityState(newState);
    
    // Si no hay configuración global, guardar en localStorage
    if (!isGlobalConfig) {
      localStorage.setItem('sidebarVisibility', JSON.stringify(newState));
      console.log('💾 Configuración del sidebar guardada localmente');
    }
  };

  // Función para aplicar configuración como global (solo SuperAdmin)
  const aplicarConfiguracionGlobal = async (configuracion: SidebarItemVisibility): Promise<boolean> => {
    if (!isSuperAdmin) {
      console.error('❌ Solo los SuperAdmin pueden aplicar configuraciones globales');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      console.log('🔄 Aplicando configuración del sidebar globalmente...');

      const response = await axios.post(
        `${API_BASE_URL}/configuraciones-globales/aplicar-global`,
        {
          tipo_configuracion: 'sidebar',
          configuracion_local: configuracion
        },
        {
          headers: { 'x-auth-token': token }
        }
      );

      if (response.data.success) {
        console.log('✅ Configuración del sidebar aplicada globalmente');
        
        // Actualizar estado local
        setVisibilityState(configuracion);
        setIsGlobalConfig(true);
        
        // Limpiar localStorage ya que ahora es global
        localStorage.removeItem('sidebarVisibility');
        
        return true;
      } else {
        throw new Error(response.data.message || 'Error aplicando configuración global');
      }

    } catch (error: any) {
      console.error('❌ Error aplicando configuración global del sidebar:', error);
      setError(error.response?.data?.message || error.message || 'Error aplicando configuración global');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para inicializar configuración al montar el componente
  useEffect(() => {
    initializeConfiguration();
  }, []);

  // Efecto para recargar configuración cuando cambia el token
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        console.log('🔄 Token cambió, recargando configuración del sidebar...');
        initializeConfiguration();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Efecto adicional para monitorear la presencia del token después del login
  useEffect(() => {
    let tokenCheckInterval: NodeJS.Timeout;
    
    // Solo verificar si no estamos cargando y no hay configuración global
    if (!isLoading && !isGlobalConfig) {
      tokenCheckInterval = setInterval(() => {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔄 Token detectado después del login, recargando configuración del sidebar...');
          clearInterval(tokenCheckInterval);
          initializeConfiguration();
        }
      }, 1000); // Verificar cada segundo
    }

    // Limpiar intervalo después de 10 segundos para evitar verificaciones infinitas
    const cleanupTimer = setTimeout(() => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    }, 10000);

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
      clearTimeout(cleanupTimer);
    };
  }, [isLoading, isGlobalConfig]);

  const value: SidebarVisibilityContextType = {
    visibility,
    setVisibility,
    isGlobalConfig,
    isLoading,
    isSuperAdmin,
    aplicarConfiguracionGlobal,
    error
  };

  return (
    <SidebarVisibilityContext.Provider value={value}>
      {children}
    </SidebarVisibilityContext.Provider>
  );
};