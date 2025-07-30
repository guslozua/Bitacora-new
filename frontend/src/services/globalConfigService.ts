// services/globalConfigService.ts
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

export interface GlobalConfiguration {
  id: number;
  tipo_configuracion: 'sidebar' | 'dashboard_sections' | 'dashboard_kpis';
  clave: string;
  valor: any;
  activo: boolean;
  orden?: number;
  descripcion?: string;
  usuario_creacion: number;
  usuario_nombre?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CreateConfigurationRequest {
  tipo_configuracion: 'sidebar' | 'dashboard_sections' | 'dashboard_kpis';
  clave: string;
  valor: any;
  descripcion?: string;
  orden?: number;
}

export interface ApplyGlobalConfigRequest {
  tipo_configuracion: 'sidebar' | 'dashboard_sections' | 'dashboard_kpis';
  configuracion_local: any;
}

class GlobalConfigService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }
    return { 'x-auth-token': token };
  }

  // Obtener configuraciones por tipo
  async getConfigurationsByType(tipo: string): Promise<GlobalConfiguration[]> {
    try {
      console.log(`🔍 Obteniendo configuraciones globales del tipo: ${tipo}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/configuraciones-globales/tipo/${tipo}`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log(`✅ ${response.data.data.length} configuraciones del tipo ${tipo} obtenidas`);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error obteniendo configuraciones');
      }
    } catch (error: any) {
      console.error(`❌ Error obteniendo configuraciones del tipo ${tipo}:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Error obteniendo configuraciones');
    }
  }

  // Obtener configuración específica por tipo y clave
  async getConfigurationByKey(tipo: string, clave: string): Promise<GlobalConfiguration | null> {
    try {
      console.log(`🔍 Obteniendo configuración: ${tipo} - ${clave}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/configuraciones-globales/tipo/${tipo}/clave/${clave}`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log(`✅ Configuración ${tipo} - ${clave} obtenida`);
        return response.data.data;
      } else {
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`ℹ️ No se encontró configuración ${tipo} - ${clave}`);
        return null;
      }
      console.error(`❌ Error obteniendo configuración ${tipo} - ${clave}:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Error obteniendo configuración');
    }
  }

  // Obtener todas las configuraciones del usuario autenticado
  async getUserConfigurations(): Promise<{ [tipo: string]: GlobalConfiguration[] }> {
    try {
      console.log('👤 Obteniendo todas las configuraciones del usuario...');
      
      const response = await axios.get(
        `${API_BASE_URL}/configuraciones-globales/usuario`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log('✅ Configuraciones del usuario obtenidas:', Object.keys(response.data.data));
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error obteniendo configuraciones del usuario');
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo configuraciones del usuario:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error obteniendo configuraciones del usuario');
    }
  }

  // Aplicar configuración local como global (solo SuperAdmin)
  async applyGlobalConfiguration(request: ApplyGlobalConfigRequest): Promise<GlobalConfiguration> {
    try {
      console.log(`🌐 Aplicando configuración global:`, request.tipo_configuracion);
      
      const response = await axios.post(
        `${API_BASE_URL}/configuraciones-globales/aplicar-global`,
        request,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log(`✅ Configuración ${request.tipo_configuracion} aplicada globalmente`);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error aplicando configuración global');
      }
    } catch (error: any) {
      console.error(`❌ Error aplicando configuración global:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Error aplicando configuración global');
    }
  }

  // Crear nueva configuración global (solo SuperAdmin)
  async createConfiguration(request: CreateConfigurationRequest): Promise<GlobalConfiguration> {
    try {
      console.log('📝 Creando nueva configuración global:', request.tipo_configuracion, request.clave);
      
      const response = await axios.post(
        `${API_BASE_URL}/configuraciones-globales`,
        request,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log(`✅ Configuración ${request.tipo_configuracion} - ${request.clave} creada`);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error creando configuración global');
      }
    } catch (error: any) {
      console.error('❌ Error creando configuración global:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error creando configuración global');
    }
  }

  // Actualizar configuración existente (solo SuperAdmin)
  async updateConfiguration(id: number, data: Partial<GlobalConfiguration>): Promise<GlobalConfiguration> {
    try {
      console.log(`📝 Actualizando configuración ID: ${id}`);
      
      const response = await axios.put(
        `${API_BASE_URL}/configuraciones-globales/${id}`,
        data,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log(`✅ Configuración ID: ${id} actualizada`);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error actualizando configuración global');
      }
    } catch (error: any) {
      console.error(`❌ Error actualizando configuración ID: ${id}:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Error actualizando configuración global');
    }
  }

  // Eliminar configuración (solo SuperAdmin)
  async deleteConfiguration(id: number): Promise<void> {
    try {
      console.log(`🗑️ Eliminando configuración ID: ${id}`);
      
      const response = await axios.delete(
        `${API_BASE_URL}/configuraciones-globales/${id}`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log(`✅ Configuración ID: ${id} eliminada`);
      } else {
        throw new Error(response.data.message || 'Error eliminando configuración global');
      }
    } catch (error: any) {
      console.error(`❌ Error eliminando configuración ID: ${id}:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Error eliminando configuración global');
    }
  }

  // Resetear configuraciones de un tipo (solo SuperAdmin)
  async resetConfigurations(tipo: string): Promise<void> {
    try {
      console.log(`🔄 Reseteando configuraciones del tipo: ${tipo}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/configuraciones-globales/reset/${tipo}`,
        {},
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success) {
        console.log(`✅ Configuraciones del tipo ${tipo} reseteadas`);
      } else {
        throw new Error(response.data.message || 'Error reseteando configuraciones');
      }
    } catch (error: any) {
      console.error(`❌ Error reseteando configuraciones del tipo ${tipo}:`, error);
      throw new Error(error.response?.data?.message || error.message || 'Error reseteando configuraciones');
    }
  }

  // Verificar si el usuario es SuperAdmin
  isSuperAdmin(): boolean {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload.roles || [];
      return roles.includes('SuperAdmin');
    } catch (error) {
      console.error('Error verificando rol de SuperAdmin:', error);
      return false;
    }
  }

  // Obtener información del usuario actual
  getCurrentUser(): { id?: number; nombre?: string; roles?: string[] } | null {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        nombre: payload.nombre,
        roles: payload.roles || []
      };
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      return null;
    }
  }

  // Cargar configuración por defecto para un tipo específico
  async loadDefaultConfiguration(tipo: 'sidebar' | 'dashboard_sections' | 'dashboard_kpis'): Promise<any> {
    try {
      // Intentar cargar configuración global
      const configuraciones = await this.getConfigurationsByType(tipo);
      
      if (configuraciones.length > 0) {
        // Buscar configuración por defecto
        const defaultConfig = configuraciones.find(config => 
          config.clave === 'default_visibility' || 
          config.clave === 'default_sections' || 
          config.clave === 'default_kpis' ||
          config.clave.startsWith('global_')
        );

        if (defaultConfig) {
          console.log(`🌐 Configuración global por defecto cargada para ${tipo}`);
          return defaultConfig.valor;
        }
      }

      console.log(`📱 No hay configuración global para ${tipo}, usando fallback local`);
      return null;

    } catch (error) {
      console.error(`❌ Error cargando configuración por defecto para ${tipo}:`, error);
      return null;
    }
  }
}

// Instancia singleton del servicio
export const globalConfigService = new GlobalConfigService();

// Export por defecto
export default globalConfigService;