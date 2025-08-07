// src/services/permissionService.ts
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Interfaces
export interface Permission {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  fecha_creacion: string;
}

export interface CreatePermissionData {
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface UpdatePermissionData {
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface PermissionsByCategory {
  categoria: string;
  permisos: Permission[];
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
// SERVICIOS PARA PERMISOS
// ============================================

/**
 * Obtener todos los permisos
 */
export const fetchAllPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permissions`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener permisos');
    }
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    throw new Error(error.response?.data?.message || 'Error al conectar con el servidor');
  }
};

/**
 * Obtener permisos agrupados por categoría
 */
export const fetchPermissionsByCategory = async (): Promise<PermissionsByCategory[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permissions/by-category`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      // Los datos ya vienen en el formato correcto desde el backend
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener permisos por categoría');
    }
  } catch (error: any) {
    console.error('Error fetching permissions by category:', error);
    throw new Error(error.response?.data?.message || 'Error al conectar con el servidor');
  }
};

/**
 * Crear un nuevo permiso
 */
export const createPermission = async (permissionData: CreatePermissionData): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/permissions`, permissionData, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al crear permiso');
    }
  } catch (error: any) {
    console.error('Error creating permission:', error);
    throw new Error(error.response?.data?.message || 'Error al crear permiso');
  }
};

/**
 * Actualizar un permiso existente
 */
export const updatePermission = async (permissionId: number, permissionData: UpdatePermissionData): Promise<any> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/permissions/${permissionId}`, permissionData, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al actualizar permiso');
    }
  } catch (error: any) {
    console.error('Error updating permission:', error);
    throw new Error(error.response?.data?.message || 'Error al actualizar permiso');
  }
};

/**
 * Eliminar un permiso
 */
export const deletePermission = async (permissionId: number): Promise<any> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/permissions/${permissionId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al eliminar permiso');
    }
  } catch (error: any) {
    console.error('Error deleting permission:', error);
    throw new Error(error.response?.data?.message || 'Error al eliminar permiso');
  }
};

/**
 * Obtener permisos de un rol específico
 */
export const getPermissionsByRole = async (roleId: number): Promise<Permission[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permissions/role/${roleId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error al obtener permisos del rol');
    }
  } catch (error: any) {
    console.error('Error fetching permissions by role:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener permisos del rol');
  }
};

/**
 * Asignar un permiso a un rol
 */
export const assignPermissionToRole = async (roleId: number, permissionId: number): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/permissions/assign`, {
      id_rol: roleId,
      id_permiso: permissionId
    }, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al asignar permiso');
    }
  } catch (error: any) {
    console.error('Error assigning permission to role:', error);
    throw new Error(error.response?.data?.message || 'Error al asignar permiso');
  }
};

/**
 * Quitar un permiso de un rol
 */
export const removePermissionFromRole = async (roleId: number, permissionId: number): Promise<any> => {
  try {
    // 🔧 FIX: Usar configuración correcta para DELETE con body
    const response = await axios({
      method: 'DELETE',
      url: `${API_BASE_URL}/permissions/remove`,
      data: {
        id_rol: roleId,
        id_permiso: permissionId
      },
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Error al quitar permiso');
    }
  } catch (error: any) {
    console.error('Error removing permission from role:', error);
    throw new Error(error.response?.data?.message || 'Error al quitar permiso');
  }
};

/**
 * Obtener matriz completa de roles vs permisos
 */
export const getRolePermissionMatrix = async (): Promise<any> => {
  try {
    // Obtener todos los roles y permisos en paralelo
    const [rolesResponse, permissionsResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/roles`, { headers: getAuthHeaders() }),
      axios.get(`${API_BASE_URL}/permissions`, { headers: getAuthHeaders() })
    ]);

    if (!rolesResponse.data.success || !permissionsResponse.data.success) {
      throw new Error('Error al obtener datos para la matriz');
    }

    const roles = rolesResponse.data.data;
    const permissions = permissionsResponse.data.data;

    // Obtener todas las asignaciones de permisos
    const assignmentsPromises = roles.map((role: any) => 
      axios.get(`${API_BASE_URL}/permissions/role/${role.id}`, { headers: getAuthHeaders() })
    );

    const assignmentsResponses = await Promise.all(assignmentsPromises);
    
    // Construir matriz
    const matrix = roles.map((role: any, index: number) => ({
      role,
      permissions: assignmentsResponses[index].data.success ? assignmentsResponses[index].data.data : []
    }));

    return {
      roles,
      permissions,
      matrix
    };
  } catch (error: any) {
    console.error('Error fetching role permission matrix:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener matriz de permisos');
  }
};
