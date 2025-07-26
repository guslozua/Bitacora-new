// ============================================================================
// ARCHIVO: frontend/src/services/SidebarVisibilityContext.tsx (ACTUALIZADO)
// ============================================================================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AdminConfigService from './AdminConfigService';
import Swal from 'sweetalert2';

type SidebarItemVisibility = {
  [key: string]: boolean;
};

type SidebarVisibilityContextType = {
  visibility: SidebarItemVisibility;
  setVisibility: (newState: SidebarItemVisibility, applyGlobally?: boolean) => Promise<void>;
  isLoading: boolean;
  lastUpdated: Date | null;
  syncFromServer: () => Promise<void>;
  isServerSynced: boolean;
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
  const [visibility, setVisibilityState] = useState<SidebarItemVisibility>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isServerSynced, setIsServerSynced] = useState<boolean>(false);

  // Configuración por defecto (fallback)
  const defaultConfig: SidebarItemVisibility = {
    dashboard: true,
    projects: true,
    hitos: true,
    placasdash: true,
    abmdashboard: true,
    itrackerdash: true,
    tabulacionesdash: true,
    contactos: true,
    calendar: true,
    notificaciones: true,
    links: true,
    glosario: true,
    admin: true,
    sessionanalysis: false, // 🔒 Experimental - oculto por defecto
    aternity: false, // 🔒 Experimental - oculto por defecto  
  };

  // Cargar configuración al inicializar
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🔧 SidebarContext: Cargando configuración...');

      // Intentar obtener configuración desde el servidor
      const config = await AdminConfigService.getSidebarConfiguration(false); // false = configuración personal
      
      if (config) {
        console.log('✅ SidebarContext: Configuración cargada desde servidor');
        setVisibilityState(config);
        setIsServerSynced(true);
        setLastUpdated(new Date());
      } else {
        // Fallback a localStorage si no hay configuración en servidor
        const savedVisibility = localStorage.getItem('sidebarVisibility');
        if (savedVisibility) {
          try {
            const parsed = JSON.parse(savedVisibility);
            console.log('📱 SidebarContext: Usando configuración local');
            setVisibilityState(parsed);
            setIsServerSynced(false);
          } catch (parseError) {
            console.error('❌ Error parsing localStorage config:', parseError);
            setVisibilityState(defaultConfig);
            setIsServerSynced(false);
          }
        } else {
          console.log('🔄 SidebarContext: Usando configuración por defecto');
          setVisibilityState(defaultConfig);
          setIsServerSynced(false);
        }
      }

    } catch (error) {
      console.error('❌ SidebarContext: Error cargando configuración', error);
      
      // Fallback final a localStorage o defaultConfig
      const savedVisibility = localStorage.getItem('sidebarVisibility');
      if (savedVisibility) {
        try {
          const parsed = JSON.parse(savedVisibility);
          console.log('📱 SidebarContext: Usando configuración local como fallback de emergencia');
          setVisibilityState(parsed);
        } catch (parseError) {
          console.error('❌ Error parsing localStorage config:', parseError);
          setVisibilityState(defaultConfig);
        }
      } else {
        setVisibilityState(defaultConfig);
      }
      
      setIsServerSynced(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setVisibility = async (newState: SidebarItemVisibility, applyGlobally: boolean = false): Promise<void> => {
    try {
      console.log('💾 SidebarContext: Guardando configuración...', { applyGlobally });
      
      // Actualizar estado local inmediatamente
      setVisibilityState(newState);
      setLastUpdated(new Date());

      // Guardar en servidor y/o localStorage
      const saved = await AdminConfigService.saveSidebarConfiguration(newState, applyGlobally);
      
      if (saved) {
        setIsServerSynced(true);
        
        // Mostrar notificación de éxito solo si se aplicó globalmente
        if (applyGlobally) {
          Swal.fire({
            title: '¡Configuración aplicada globalmente!',
            text: 'Los cambios se aplicaron para todos los usuarios y se sincronizarán automáticamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            position: 'top-end',
            toast: true
          });
        }
      } else {
        console.warn('⚠️ SidebarContext: Error al guardar en servidor, solo guardado localmente');
        setIsServerSynced(false);
      }

    } catch (error) {
      console.error('❌ SidebarContext: Error guardando configuración', error);
      
      // Al menos mantener el cambio local
      localStorage.setItem('sidebarVisibility', JSON.stringify(newState));
      setIsServerSynced(false);
      
      // Mostrar notificación de error
      Swal.fire({
        title: 'Error al guardar',
        text: 'La configuración se guardó localmente pero no se pudo sincronizar con el servidor',
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    }
  };

  const syncFromServer = async (): Promise<void> => {
    try {
      console.log('🔄 SidebarContext: Sincronizando desde servidor...');
      await AdminConfigService.syncConfigurationsFromServer();
      await loadConfiguration();
      
      Swal.fire({
        title: '¡Sincronizado!',
        text: 'Configuración actualizada desde el servidor',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
      
    } catch (error) {
      console.error('❌ SidebarContext: Error sincronizando', error);
      
      Swal.fire({
        title: 'Error de sincronización',
        text: 'No se pudo conectar con el servidor',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    }
  };

  return (
    <SidebarVisibilityContext.Provider 
      value={{ 
        visibility, 
        setVisibility, 
        isLoading,
        lastUpdated,
        syncFromServer,
        isServerSynced
      }}
    >
      {children}
    </SidebarVisibilityContext.Provider>
  );
};

// ============================================================================
// COMPONENTE DE DEBUG PARA DESARROLLO (OPCIONAL)
// ============================================================================
export const SidebarConfigDebugPanel: React.FC = () => {
  const { visibility, isLoading, lastUpdated, isServerSynced, syncFromServer } = useSidebarVisibility();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        🔧 Sidebar Config Debug
      </div>
      <div>Estado: {isLoading ? '⏳ Cargando...' : '✅ Listo'}</div>
      <div>Servidor: {isServerSynced ? '🟢 Sincronizado' : '🔴 Local'}</div>
      <div>Última actualización: {lastUpdated?.toLocaleTimeString() || 'N/A'}</div>
      <div>Items visibles: {Object.values(visibility).filter(Boolean).length}</div>
      <button 
        onClick={syncFromServer}
        style={{
          marginTop: '5px',
          padding: '2px 5px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        🔄 Sincronizar
      </button>
    </div>
  );
};
