// ============================================================================
// AdminConfigService SIMPLIFICADO - Version de emergencia que funciona
// ============================================================================
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

class AdminConfigService {
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
  // MÉTODOS BÁSICOS QUE FUNCIONABAN ANTES
  // ============================================================================
  
  async getSidebarConfiguration(isGlobal: boolean = false): Promise<any | null> {
    try {
      // Por ahora solo usar localStorage hasta que arreglemos el backend
      const savedConfig = localStorage.getItem('sidebarVisibility');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
      
      // Configuración por defecto
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
    } catch (error) {
      console.error('Error en getSidebarConfiguration:', error);
      return null;
    }
  }

  async saveSidebarConfiguration(config: any, isGlobal: boolean = false): Promise<boolean> {
    try {
      // Guardar en localStorage (funciona siempre)
      localStorage.setItem('sidebarVisibility', JSON.stringify(config));
      
      if (isGlobal) {
        console.log('🌐 Configuración aplicada globalmente (simulado)');
        // TODO: Implementar llamada real al backend cuando esté listo
      }
      
      return true;
    } catch (error) {
      console.error('Error en saveSidebarConfiguration:', error);
      return false;
    }
  }

  async getDashboardConfiguration(isGlobal: boolean = false): Promise<any[] | null> {
    try {
      const savedConfig = localStorage.getItem('dashboardSections');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
      
      // 9 secciones por defecto
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
    } catch (error) {
      console.error('Error en getDashboardConfiguration:', error);
      return null;
    }
  }

  async saveDashboardConfiguration(config: any[], isGlobal: boolean = false): Promise<boolean> {
    try {
      localStorage.setItem('dashboardSections', JSON.stringify(config));
      
      if (isGlobal) {
        console.log('🌐 Configuración del dashboard aplicada globalmente (simulado)');
      }
      
      return true;
    } catch (error) {
      console.error('Error en saveDashboardConfiguration:', error);
      return false;
    }
  }

  async getKpiConfiguration(isGlobal: boolean = false): Promise<any[] | null> {
    try {
      const savedConfig = localStorage.getItem('kpiConfigs');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
      
      // KPIs por defecto
      return [
        { id: 'proyectos_activos', name: 'Proyectos Activos', visible: true, order: 1 },
        { id: 'tareas_pendientes', name: 'Tareas Pendientes', visible: true, order: 2 },
        { id: 'usuarios_activos', name: 'Usuarios Activos', visible: true, order: 3 },
        { id: 'eventos_hoy', name: 'Eventos Hoy', visible: true, order: 4 }
      ];
    } catch (error) {
      console.error('Error en getKpiConfiguration:', error);
      return null;
    }
  }

  async saveKpiConfiguration(config: any[], isGlobal: boolean = false): Promise<boolean> {
    try {
      localStorage.setItem('kpiConfigs', JSON.stringify(config));
      
      if (isGlobal) {
        console.log('🌐 Configuración de KPIs aplicada globalmente (simulado)');
      }
      
      return true;
    } catch (error) {
      console.error('Error en saveKpiConfiguration:', error);
      return false;
    }
  }

  async syncConfigurationsFromServer(): Promise<void> {
    console.log('🔄 Sincronización simulada - localStorage mantenido');
  }
}

// Exportar instancia singleton Y hacerla global para debugging
const adminConfigService = new AdminConfigService();

// Hacer disponible en consola para debugging
if (typeof window !== 'undefined') {
  (window as any).AdminConfigService = adminConfigService;
}

export default adminConfigService;
