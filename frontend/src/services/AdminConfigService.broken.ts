// ============================================================================
// ARCHIVO: frontend/src/services/AdminConfigService.ts
// ============================================================================
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

export interface AdminConfiguration {
  id: number;
  config_type: 'sidebar_visibility' | 'dashboard_sections' | 'kpi_configs' | 'general_settings';
  config_key: string;
  config_value: any;
  is_global: boolean;
  user_id?: number;
  is_active: boolean;
  created_by: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  source?: 'database' | 'default' | 'localStorage';
}

class AdminConfigService {
  private static instance: AdminConfigService;
  private baseURL = `${API_BASE_URL}/admin-config`;

  // Singleton pattern
  public static getInstance(): AdminConfigService {
    if (!AdminConfigService.instance) {
      AdminConfigService.instance = new AdminConfigService();
    }
    return AdminConfigService.instance;
  }

  // Obtener headers con token de autenticación
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
      }
    };
  }

  // ============================================================================
  // 🆕 MÉTODOS PARA SIDEBAR (ACTUALIZADOS CON RUTAS SIMPLIFICADAS)
  // ============================================================================
  
  async getSidebarConfiguration(isGlobal: boolean = false): Promise<any | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/sidebar${isGlobal ? '?global=true' : ''}`,
        this.getAuthHeaders()
      );
      
      if (response.data?.success && response.data?.data?.config_value) {
        return JSON.parse(response.data.data.config_value);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching sidebar configuration:', error);
      // Fallback a localStorage
      const localConfig = localStorage.getItem('sidebarVisibility');
      if (localConfig) {
        return JSON.parse(localConfig);
      }
      return this.getDefaultSidebarConfig();
    }
  }

  async saveSidebarConfiguration(
    config: any, 
    isGlobal: boolean = false
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseURL}/sidebar`,
        {
          config_value: JSON.stringify(config),
          is_global: isGlobal
        },
        this.getAuthHeaders()
      );
      
      // Siempre guardar también en localStorage como backup
      localStorage.setItem('sidebarVisibility', JSON.stringify(config));
      
      return response.data?.success === true;
    } catch (error) {
      console.error('Error saving sidebar configuration:', error);
      // Al menos guardar localmente si falla el servidor
      localStorage.setItem('sidebarVisibility', JSON.stringify(config));
      return false;
    }
  }

  // ============================================================================
  // 🆕 MÉTODOS PARA DASHBOARD (NUEVOS)
  // ============================================================================
  
  async getDashboardConfiguration(isGlobal: boolean = false): Promise<any[] | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/dashboard${isGlobal ? '?global=true' : ''}`,
        this.getAuthHeaders()
      );
      
      if (response.data?.success && response.data?.data?.config_value) {
        return JSON.parse(response.data.data.config_value);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching dashboard configuration:', error);
      // Fallback a localStorage
      const localConfig = localStorage.getItem('dashboardSections');
      if (localConfig) {
        return JSON.parse(localConfig);
      }
      return this.getDefaultDashboardSections();
    }
  }

  async saveDashboardConfiguration(
    config: any[], 
    isGlobal: boolean = false
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseURL}/dashboard`,
        {
          config_value: JSON.stringify(config),
          is_global: isGlobal
        },
        this.getAuthHeaders()
      );
      
      // Siempre guardar también en localStorage como backup
      localStorage.setItem('dashboardSections', JSON.stringify(config));
      
      return response.data?.success === true;
    } catch (error) {
      console.error('Error saving dashboard configuration:', error);
      // Al menos guardar localmente si falla el servidor
      localStorage.setItem('dashboardSections', JSON.stringify(config));
      return false;
    }
  }

  // ============================================================================
  // 🆕 MÉTODOS PARA KPIs (NUEVOS)
  // ============================================================================
  
  async getKpiConfiguration(isGlobal: boolean = false): Promise<any[] | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/kpis${isGlobal ? '?global=true' : ''}`,
        this.getAuthHeaders()
      );
      
      if (response.data?.success && response.data?.data?.config_value) {
        return JSON.parse(response.data.data.config_value);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching KPI configuration:', error);
      // Fallback a localStorage
      const localConfig = localStorage.getItem('kpiConfigs');
      if (localConfig) {
        return JSON.parse(localConfig);
      }
      return this.getDefaultKpiConfig();
    }
  }

  async saveKpiConfiguration(
    config: any[], 
    isGlobal: boolean = false
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseURL}/kpis`,
        {
          config_value: JSON.stringify(config),
          is_global: isGlobal
        },
        this.getAuthHeaders()
      );
      
      // Siempre guardar también en localStorage como backup
      localStorage.setItem('kpiConfigs', JSON.stringify(config));
      
      return response.data?.success === true;
    } catch (error) {
      console.error('Error saving KPI configuration:', error);
      // Al menos guardar localmente si falla el servidor
      localStorage.setItem('kpiConfigs', JSON.stringify(config));
      return false;
    }
  }

  // ============================================================================
  // MÉTODOS GENERALES DE SINCRONIZACIÓN
  // ============================================================================
  
  async syncConfigurationsFromServer(): Promise<void> {
    try {
      // Limpiar configuraciones locales
      localStorage.removeItem('sidebarVisibility');
      localStorage.removeItem('dashboardSections');
      localStorage.removeItem('kpiConfigs');
      
      console.log('✅ Local configurations cleared for sync');
    } catch (error) {
      console.error('Error syncing configurations:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONFIGURACIONES POR DEFECTO
  // ============================================================================
  
  private getDefaultSidebarConfig(): any {
    return {
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
      sessionanalysis: false,
      aternity: false
    };
  }

  private getDefaultDashboardSections(): any[] {
    return [
      { id: 'kpis-sistema', name: 'KPIs del Sistema', visible: true, order: 1 },
      { id: 'actividad-reciente', name: 'Actividad Reciente', visible: true, order: 2 },
      { id: 'calendario', name: 'Calendario', visible: true, order: 3 },
      { id: 'anuncios', name: 'Anuncios', visible: true, order: 4 },
      { id: 'reportes-rapidos', name: 'Reportes Rápidos', visible: true, order: 5 },
      { id: 'proximos-eventos', name: 'Próximos Eventos', visible: true, order: 6 },
      { id: 'acciones-rapidas', name: 'Acciones Rápidas', visible: true, order: 7 },
      { id: 'resumen-sistema', name: 'Resumen del Sistema', visible: true, order: 8 },
      { id: 'cronograma-proyectos', name: 'Cronograma de Proyectos', visible: true, order: 9 }
    ];
  }

  private getDefaultKpiConfig(): any[] {
    return [
      { id: 'proyectos_activos', name: 'Proyectos Activos', visible: true, order: 1 },
      { id: 'tareas_pendientes', name: 'Tareas Pendientes', visible: true, order: 2 },
      { id: 'usuarios_activos', name: 'Usuarios Activos', visible: true, order: 3 },
      { id: 'eventos_hoy', name: 'Eventos Hoy', visible: true, order: 4 },
      { id: 'altas_pic', name: 'Total Altas PIC', visible: true, order: 5 },
      { id: 'altas_social', name: 'Total Altas Social', visible: true, order: 6 },
      { id: 'tabulaciones', name: 'Árboles de Tabulación', visible: true, order: 7 },
      { id: 'itracker_registros', name: 'Registros iTracker', visible: true, order: 8 },
      { id: 'hitos_completados', name: 'Hitos Completados', visible: true, order: 9 },
      { id: 'placas_generadas', name: 'Placas Generadas', visible: true, order: 10 },
      { id: 'contactos_activos', name: 'Contactos Activos', visible: true, order: 11 },
      { id: 'mensajes_pendientes', name: 'Mensajes Pendientes', visible: true, order: 12 },
      { id: 'sesiones_activas', name: 'Sesiones Activas', visible: false, order: 13 },
      { id: 'alertas_aternity', name: 'Alertas Aternity', visible: false, order: 14 }
    ];
  }
}

// Exportar instancia singleton
export default new AdminConfigService();
