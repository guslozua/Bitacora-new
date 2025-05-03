// src/services/roleService.ts - con manejo de errores mejorado
import axios from 'axios';
import { getToken } from './authService';
import { ApiResponse } from './userService'; // Reusamos la interfaz

// Interfaz para roles
export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  is_default?: number;
  fecha_creacion?: Date | string;
}

// Interfaz para permisos
export interface Permiso {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  fecha_creacion?: Date | string;
}

const API_BASE_URL = 'http://localhost:5000/api';

// Configuración con token de autenticación
const getAuthConfig = () => {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    }
  };
};

// Obtener todos los roles con datos de respaldo
export const fetchAllRoles = async (): Promise<Role[]> => {
  try {
    console.log('Solicitando roles al servidor...');
    
    // Intentar obtener roles del servidor
    try {
      const response = await axios.get<ApiResponse<Role[]> | Role[]>(`${API_BASE_URL}/roles`, getAuthConfig());
      
      console.log('Respuesta del servidor roles:', response.data);
      
      // Manejar ambos formatos de respuesta posibles
      if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.warn('Error al obtener roles:', error.message);
      
      // *** IMPORTANTE: Usar datos de respaldo mientras se corrige el problema en el backend ***
      console.log('Usando datos de respaldo para roles');
      return [
        { id: 1, nombre: 'SuperAdmin', descripcion: 'Administrador con todos los permisos', is_default: 0 },
        { id: 2, nombre: 'Admin', descripcion: 'Administrador del sistema', is_default: 0 },
        { id: 3, nombre: 'Usuario', descripcion: 'Usuario regular', is_default: 1 },
        { id: 4, nombre: 'Editor', descripcion: 'Editor de contenido', is_default: 0 },
        { id: 5, nombre: 'Supervisor', descripcion: 'Supervisor de tareas', is_default: 0 }
      ];
    }
  } catch (generalError: any) {
    console.error('Error general al obtener roles:', generalError);
    
    // Devolver datos de respaldo en caso de error general
    return [
      { id: 1, nombre: 'SuperAdmin', descripcion: 'Administrador con todos los permisos', is_default: 0 },
      { id: 2, nombre: 'Admin', descripcion: 'Administrador del sistema', is_default: 0 },
      { id: 3, nombre: 'Usuario', descripcion: 'Usuario regular', is_default: 1 }
    ];
  }
};

// Asignar rol a usuario
export const assignRoleToUser = async (
  userId: number, 
  roleId: number
): Promise<ApiResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/roles/assign`,
      { userId, roleId },
      getAuthConfig()
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al asignar rol:', error);
    throw error;
  }
};

// Quitar rol a usuario
export const removeRoleFromUser = async (
  userId: number, 
  roleId: number
): Promise<ApiResponse> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/roles/assign`,
      { 
        data: { userId, roleId },
        ...getAuthConfig()
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error al quitar rol:', error);
    throw error;
  }
};

// Obtener roles de un usuario con manejo de errores
export const fetchUserRoles = async (userId: number | string): Promise<Role[]> => {
  try {
    const response = await axios.get<ApiResponse<Role[]> | Role[]>(
      `${API_BASE_URL}/roles/user/${userId}`,
      getAuthConfig()
    );
    
    // Manejar ambos formatos de respuesta posibles
    if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error(`Error al obtener roles para el usuario ${userId}:`, error);
    // Devolver array vacío para evitar errores en componentes
    return [];
  }
};

// Obtener permisos de un rol con manejo de errores
export const fetchRolePermissions = async (roleId: number | string): Promise<Permiso[]> => {
  try {
    const response = await axios.get<ApiResponse<Permiso[]> | Permiso[]>(
      `${API_BASE_URL}/roles/${roleId}/permissions`,
      getAuthConfig()
    );
    
    // Manejar ambos formatos de respuesta posibles
    if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error(`Error al obtener permisos para el rol ${roleId}:`, error);
    // Devolver array vacío para evitar errores en componentes
    return [];
  }
};