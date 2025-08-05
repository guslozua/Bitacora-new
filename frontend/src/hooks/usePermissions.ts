// src/hooks/usePermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { getUserData } from '../services/authService';
import axios from 'axios';

// 🚀 USAR LA MISMA DETECCIÓN QUE api.ts
const getApiUrl = () => {
  // Verificar si estamos en Railway production
  if (window.location.hostname.includes('railway.app')) {
    return 'https://bitacora-new-production.up.railway.app/api';
  }
  
  // Si estamos en desarrollo local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }
  
  // Por defecto, usar Railway (para cualquier otro dominio)
  return 'https://bitacora-new-production.up.railway.app/api';
};

const API_URL = getApiUrl();

interface UsePermissionsReturn {
  userPermissions: string[];
  userRoles: string[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
  error: string | null;
}

/**
 * Hook personalizado para gestionar permisos de usuario
 * Proporciona funciones para verificar permisos y roles del usuario actual
 */
export const usePermissions = (): UsePermissionsReturn => {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene los permisos del usuario desde el backend
   */
  const fetchUserPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener datos básicos del usuario desde localStorage
      const userData = getUserData();
      if (!userData) {
        setUserPermissions([]);
        setUserRoles([]);
        setIsLoading(false);
        return;
      }

      // Obtener roles del usuario (ya disponibles en localStorage)
      setUserRoles(userData.roles || []);

      // Obtener permisos del usuario desde el backend
      const response = await axios.get(`${API_URL}/users/profile/permisos`);
      
      if (response.data && response.data.success) {
        setUserPermissions(response.data.permissions || []);
      } else {
        console.warn('No se pudieron obtener los permisos del usuario');
        setUserPermissions([]);
      }
    } catch (error: any) {
      console.error('Error obteniendo permisos del usuario:', error);
      setError(error.response?.data?.message || 'Error al obtener permisos');
      setUserPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Efecto para cargar permisos al montar el componente
   */
  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => userPermissions.includes(permission));
  }, [userPermissions]);

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => userPermissions.includes(permission));
  }, [userPermissions]);

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = useCallback((role: string): boolean => {
    return userRoles.includes(role);
  }, [userRoles]);

  /**
   * Verifica si el usuario tiene al menos uno de los roles especificados
   */
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => userRoles.includes(role));
  }, [userRoles]);

  /**
   * Función para refrescar permisos manualmente
   */
  const refreshPermissions = useCallback(async (): Promise<void> => {
    await fetchUserPermissions();
  }, [fetchUserPermissions]);

  return {
    userPermissions,
    userRoles,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    refreshPermissions,
    error
  };
};

export default usePermissions;