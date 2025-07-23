// services/hitoService.ts - Versión corregida con tipos
import axios from 'axios';
import type { 
  HitoFormData, 
  HitoFilters, 
  ApiResponse, 
  HitoCompleto,
  ConversionData,
  Usuario // 🔧 IMPORTAR: Usuario desde hitos.types.ts
} from '../types/hitos.types';
import { API_BASE_URL } from './apiConfig';

// Configuración de axios consistente con el resto del proyecto
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autorización automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO');
    
    if (token) {
      // IMPORTANTE: Usar el mismo formato que el resto de tu aplicación
      config.headers['x-auth-token'] = token;
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Headers de autenticación agregados');
    } else {
      console.warn('⚠️ No se encontró token en localStorage');
    }
    
    console.log('📡 Request URL:', config.url);
    console.log('📋 Headers finales:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa de API:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Error en respuesta de API:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.warn('🔒 Token expirado o inválido, redirigiendo al login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

class HitoService {
  // Obtener todos los hitos con filtros opcionales
  async getHitos(filters: HitoFilters = {}): Promise<ApiResponse<HitoCompleto[]>> {
    try {
      console.log('🔍 Obteniendo hitos con filtros:', filters);
      
      const params = new URLSearchParams();
      
      if (filters.nombre) params.append('nombre', filters.nombre);
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
      if (filters.idProyectoOrigen) params.append('idProyectoOrigen', filters.idProyectoOrigen);
      if (filters.usuario) params.append('usuario', filters.usuario);
      
      const response = await api.get(`/hitos?${params.toString()}`);
      console.log('✅ Hitos obtenidos exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener hitos:', error);
      throw error;
    }
  }

  // Obtener un hito por ID
  async getHitoById(hitoId: number): Promise<ApiResponse<HitoCompleto>> {
    try {
      console.log('🔍 Obteniendo hito por ID:', hitoId);
      const response = await api.get(`/hitos/${hitoId}`);
      console.log('✅ Hito obtenido exitosamente');
      return response.data;
    } catch (error) {
      console.error(`❌ Error al obtener hito con ID ${hitoId}:`, error);
      throw error;
    }
  }

  // Crear un nuevo hito
  async createHito(hitoData: HitoFormData): Promise<ApiResponse<HitoCompleto>> {
    try {
      console.log('🔨 Creando nuevo hito:', hitoData);
      const response = await api.post('/hitos', hitoData);
      console.log('✅ Hito creado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear hito:', error);
      throw error;
    }
  }

  // Actualizar un hito existente
  async updateHito(hitoId: number, hitoData: HitoFormData): Promise<ApiResponse<HitoCompleto>> {
    try {
      console.log('🔧 Actualizando hito:', hitoId, hitoData);
      const response = await api.put(`/hitos/${hitoId}`, hitoData);
      console.log('✅ Hito actualizado exitosamente');
      return response.data;
    } catch (error) {
      console.error(`❌ Error al actualizar hito con ID ${hitoId}:`, error);
      throw error;
    }
  }

  // Eliminar un hito
  async deleteHito(hitoId: number): Promise<ApiResponse<void>> {
    try {
      console.log('🗑️ Eliminando hito:', hitoId);
      const response = await api.delete(`/hitos/${hitoId}`);
      console.log('✅ Hito eliminado exitosamente');
      return response.data;
    } catch (error) {
      console.error(`❌ Error al eliminar hito con ID ${hitoId}:`, error);
      throw error;
    }
  }

  // Convertir un proyecto a hito
  async convertProjectToHito(projectId: number, additionalData: ConversionData = {}): Promise<ApiResponse<HitoCompleto>> {
    try {
      console.log('🔄 Iniciando conversión de proyecto a hito:', {
        projectId,
        additionalData,
        token: localStorage.getItem('token') ? 'Presente' : 'Ausente'
      });
      
      const response = await api.post(`/hitos/proyecto/${projectId}`, additionalData);
      console.log('✅ Proyecto convertido a hito exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error al convertir proyecto con ID ${projectId} a hito:`, error);
      throw error;
    }
  }

  // Gestionar usuarios de un hito (agregar/eliminar)
  async manageHitoUsers(hitoId: number, action: 'add' | 'remove', userId: number, rol: string = 'colaborador'): Promise<ApiResponse<any>> {
    try {
      console.log('👥 Gestionando usuarios de hito:', { hitoId, action, userId, rol });
      const response = await api.post(`/hitos/${hitoId}/usuarios`, {
        action,
        userId,
        rol
      });
      console.log('✅ Usuarios de hito gestionados exitosamente');
      return response.data;
    } catch (error) {
      console.error(`❌ Error al gestionar usuarios del hito con ID ${hitoId}:`, error);
      throw error;
    }
  }

  // Gestionar tareas de un hito (agregar/actualizar/eliminar)
  async manageHitoTasks(hitoId: number, action: 'add' | 'update' | 'remove', taskId: number | null = null, taskData: any = null): Promise<ApiResponse<any>> {
    try {
      console.log('📋 Gestionando tareas de hito:', { hitoId, action, taskId, taskData });
      const response = await api.post(`/hitos/${hitoId}/tareas`, {
        action,
        taskId,
        taskData
      });
      console.log('✅ Tareas de hito gestionadas exitosamente');
      return response.data;
    } catch (error) {
      console.error(`❌ Error al gestionar tareas del hito con ID ${hitoId}:`, error);
      throw error;
    }
  }

  // Exportar hito a PDF
  async exportHitoToPDF(hitoId: number): Promise<{ success: boolean }> {
    try {
      console.log('📄 Exportando hito a PDF:', hitoId);
      
      const response = await api.get(`/hitos/${hitoId}/exportar`, {
        responseType: 'blob'
      });
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Crear elemento <a> para descarga
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hito_${hitoId}_${Date.now()}.pdf`);
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Limpiar URL del blob
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF exportado exitosamente');
      return { success: true };
    } catch (error) {
      console.error(`❌ Error al exportar hito con ID ${hitoId} a PDF:`, error);
      throw error;
    }
  }

  // 🔧 CORREGIDO: Obtener todos los usuarios (para el formulario) con tipos correctos
  async getUsers(): Promise<Usuario[]> {
    try {
      console.log('👥 Obteniendo lista de usuarios');
      
      // Usar limit=all para obtener todos los usuarios
      const response = await api.get('/users?limit=all');
      console.log('📥 Respuesta usuarios:', response.data);
      
      // Manejar diferentes formatos de respuesta
      let usuarios: Usuario[] = [];
      
      if (Array.isArray(response.data)) {
        usuarios = response.data;
      } else if (response.data.success && Array.isArray(response.data.data)) {
        usuarios = response.data.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        usuarios = response.data.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        usuarios = response.data.users;
      } else if (response.data.usuarios && Array.isArray(response.data.usuarios)) {
        usuarios = response.data.usuarios;
      } else {
        console.warn('⚠️ Formato de respuesta inesperado para usuarios:', response.data);
        return [];
      }
      
      console.log(`✅ Usuarios obtenidos: ${usuarios.length} usuarios disponibles`);
      
      // 🔧 CORREGIDO: Filtrar solo usuarios activos con tipado explícito
      const usuariosActivos = usuarios.filter((usuario: Usuario) => 
        usuario.estado === 'activo' || usuario.estado === 1 || !usuario.estado
      );
      
      console.log(`📋 Usuarios activos para selección: ${usuariosActivos.length}`);
      
      return usuariosActivos;
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      
      // Si falla con limit=all, intentar sin parámetros
      try {
        console.log('🔄 Reintentando sin parámetros...');
        const fallbackResponse = await api.get('/users');
        
        if (fallbackResponse.data?.data && Array.isArray(fallbackResponse.data.data)) {
          console.log(`📥 Fallback exitoso: ${fallbackResponse.data.data.length} usuarios`);
          return fallbackResponse.data.data.filter((usuario: Usuario) => 
            usuario.estado === 'activo' || usuario.estado === 1 || !usuario.estado
          );
        }
      } catch (fallbackError) {
        console.error('❌ Fallback también falló:', fallbackError);
      }
      
      return [];
    }
  }

  // Obtener todos los proyectos (para el formulario)
  async getProjects(): Promise<any[]> {
    try {
      console.log('📊 Obteniendo lista de proyectos');
      const response = await api.get('/projects');
      console.log('📥 Respuesta proyectos:', response.data);
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data.success && Array.isArray(response.data.projects)) {
        return response.data.projects;
      } else {
        console.warn('⚠️ Formato de respuesta inesperado para proyectos:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Error al obtener proyectos:', error);
      return [];
    }
  }
}

export default new HitoService();