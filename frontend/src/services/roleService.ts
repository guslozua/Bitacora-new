// src/services/roleService.ts
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Interfaces
export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  is_default: number;
  fecha_creacion: string;
}

export interface Permission {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  fecha_creacion: string;
}

export interface CreateRoleData {
  nombre: string;
  descripcion: string;
  is_default: number;
}

export interface UpdateRoleData {
  nombre: string;
  descripcion: string;
  is_default: number;
}

// Configurar interceptor para incluir token automáticamente
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// ============================================
// SERVICIOS PARA ROLES
// ============================================

/**
 * Obtener todos los roles
 */
export const fetchAllRoles = async (): Promise<Role[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener roles');
    }
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    throw new Error(error.response?.data?.message || 'Error al conectar con el servidor');
  }
};

/**
 * Crear un nuevo rol
 */
export const createRole = async (roleData: CreateRoleData): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/roles`, roleData, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al crear rol');
    }
  } catch (error: any) {
    console.error('Error creating role:', error);
    throw new Error(error.response?.data?.message || 'Error al crear rol');
  }
};

/**
 * Actualizar un rol existente
 */
export const updateRole = async (roleId: number, roleData: UpdateRoleData): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/roles/${roleId}`, roleData, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al actualizar rol');
    }
  } catch (error: any) {
    console.error('Error updating role:', error);
    throw new Error(error.response?.data?.message || 'Error al actualizar rol');
  }
};

/**
 * Eliminar un rol
 */
export const deleteRole = async (roleId: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/roles/${roleId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al eliminar rol');
    }
  } catch (error: any) {
    console.error('Error deleting role:', error);
    throw new Error(error.response?.data?.message || 'Error al eliminar rol');
  }
};

/**
 * Obtener usuarios que tienen un rol específico
 */
export const getUsersByRole = async (roleId: number): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users?rol=${roleId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener usuarios');
    }
  } catch (error: any) {
    console.error('Error fetching users by role:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
  }
};

/**
 * Asignar un rol a un usuario
 */
export const assignRoleToUser = async (userId: number, roleId: number): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/roles/assign`, {
      userId,
      roleId
    }, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al asignar rol');
    }
  } catch (error: any) {
    console.error('Error assigning role:', error);
    throw new Error(error.response?.data?.message || 'Error al asignar rol');
  }
};

/**
 * Quitar un rol de un usuario
 */
export const removeRoleFromUser = async (userId: number, roleId: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/roles/assign`, {
      headers: getAuthHeaders(),
      data: {
        userId,
        roleId
      }
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al quitar rol');
    }
  } catch (error: any) {
    console.error('Error removing role:', error);
    throw new Error(error.response?.data?.message || 'Error al quitar rol');
  }
};

// ============================================
// SERVICIOS PARA PERMISOS DE ROLES
// ============================================

/**
 * Obtener todos los permisos disponibles
 */
export const fetchAllPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/../permissions`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener permisos');
    }
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener permisos');
  }
};

/**
 * Obtener permisos de un rol específico
 */
export const getRolePermissions = async (roleId: number): Promise<Permission[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles/${roleId}/permissions`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener permisos del rol');
    }
  } catch (error: any) {
    console.error('Error fetching role permissions:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener permisos del rol');
  }
};

/**
 * Asignar permisos a un rol
 */
export const assignPermissionsToRole = async (roleId: number, permissionIds: number[]): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/roles/${roleId}/permissions`, {
      permisoIds: permissionIds
    }, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al asignar permisos');
    }
  } catch (error: any) {
    console.error('Error assigning permissions:', error);
    throw new Error(error.response?.data?.message || 'Error al asignar permisos');
  }
};

/**
 * Obtener roles de un usuario específico
 */
export const getUserRoles = async (userId: number): Promise<Role[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles/user/${userId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener roles del usuario');
    }
  } catch (error: any) {
    console.error('Error fetching user roles:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener roles del usuario');
  }
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Agrupar permisos por categoría
 */
export const groupPermissionsByCategory = (permissions: Permission[]): { [key: string]: Permission[] } => {
  return permissions.reduce((groups, permission) => {
    const category = permission.categoria || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as { [key: string]: Permission[] });
};

/**
 * Verificar si un rol es el rol por defecto
 */
export const isDefaultRole = (role: Role): boolean => {
  return role.is_default === 1;
};

/**
 * Formatear nombre de categoría
 */
export const formatCategoryName = (category: string): string => {
  const categoryNames: { [key: string]: string } = {
    'sistema': 'Sistema',
    'proyectos': 'Proyectos',
    'tareas': 'Tareas',
    'subtareas': 'Subtareas',
    'informes': 'Informes',
    'general': 'General'
  };
  
  return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
};