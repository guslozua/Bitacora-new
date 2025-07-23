// frontend/src/services/kpiService.ts
import axios from 'axios';
import { KpiConfig } from './DashboardKpiVisibilityContext';

import { API_DOMAIN } from './apiConfig';
const API_BASE_URL = API_DOMAIN;

export interface KpiData {
  id: string;
  value: number;
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

class KpiService {
  private cache: Map<string, { data: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Obtener token de autenticación
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Verificar si el cache es válido
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  // Obtener datos de un KPI específico
  async fetchKpiData(config: KpiConfig): Promise<number> {
    const cacheKey = `${config.endpoint}_${config.dataKey}`;
    const cached = this.cache.get(cacheKey);

    // Retornar datos del cache si son válidos
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Construir URL con parámetros de año actual
      let url = `${API_BASE_URL}${config.endpoint}`;
      const params = new URLSearchParams();
      
      // Agregar filtros de año para endpoints que lo soporten
      if (config.endpoint.includes('/abm/stats') || 
          config.endpoint.includes('/placas/stats') || 
          config.endpoint.includes('/itracker/stats') ||
          config.endpoint.includes('/tabulaciones/stats')) {
        params.append('year', currentYear.toString());
      }

      // Para informes de incidentes, agregar filtros de año
      if (config.endpoint.includes('/informes/incidentes')) {
        const startOfYear = `${currentYear}-01-01`;
        const endOfYear = `${currentYear}-12-31`;
        params.append('desde', startOfYear);
        params.append('hasta', endOfYear);
      }

      // Para eventos del mes, agregar filtro de mes
      if (config.id === 'eventos_mes') {
        params.append('month', currentMonth.toString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: this.getAuthHeaders()
      });

      let value = 0;

      // Extraer valor según el endpoint y dataKey
      switch (config.id) {
        // 🔥 KPIS PRINCIPALES DEL DASHBOARD
        case 'proyectos_activos':
          if (Array.isArray(response.data)) {
            value = response.data.length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            value = response.data.data.length;
          } else {
            value = response.data.total_proyectos || 0;
          }
          break;
        case 'tareas_pendientes':
          if (Array.isArray(response.data)) {
            // Filtrar tareas no completadas
            value = response.data.filter((tarea: any) => 
              tarea.estado !== 'completada' && tarea.estado !== 'completado'
            ).length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Filtrar tareas no completadas
            value = response.data.data.filter((tarea: any) => 
              tarea.estado !== 'completada' && tarea.estado !== 'completado'
            ).length;
          } else {
            value = response.data.tareas_pendientes || 0;
          }
          break;
        case 'usuarios_activos':
          if (Array.isArray(response.data)) {
            value = response.data.length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            value = response.data.data.length;
          } else {
            value = response.data.total_usuarios || 0;
          }
          break;
        case 'eventos_hoy':
          // Usar el endpoint correcto /api/eventos y filtrar por hoy
          if (Array.isArray(response.data)) {
            const today = new Date().toDateString();
            value = response.data.filter((evento: any) => {
              const eventDate = new Date(evento.start || evento.fecha);
              return eventDate.toDateString() === today;
            }).length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            const today = new Date().toDateString();
            value = response.data.data.filter((evento: any) => {
              const eventDate = new Date(evento.start || evento.fecha);
              return eventDate.toDateString() === today;
            }).length;
          } else {
            value = response.data.eventos_hoy || 0;
          }
          break;
        // 🆕 KPIS ADICIONALES DEL SISTEMA
        case 'altas_pic':
          value = response.data.total_altas_pic || 0;
          break;
        case 'altas_social':
          value = response.data.total_altas_social || 0;
          break;
        case 'tabulaciones':
          value = response.data.total || 0;
          break;
        case 'placas':
          value = response.data.total || 0;
          break;
        case 'itracker':
          value = response.data.total || 0;
          break;
        case 'incidentes_guardias':
          // Usar el endpoint correcto /api/informes/incidentes
          if (response.data && response.data.success && response.data.data) {
            // La respuesta tiene estadísticas
            value = response.data.data.estadisticas?.totalIncidentes || 0;
          } else if (response.data && response.data.estadisticas) {
            // Respuesta directa con estadísticas
            value = response.data.estadisticas.totalIncidentes || 0;
          } else if (Array.isArray(response.data)) {
            // Array directo de incidentes
            value = response.data.length;
          } else {
            value = response.data.total_incidentes || 0;
          }
          break;
        case 'hitos_totales':
          // Contar total de hitos
          if (Array.isArray(response.data)) {
            value = response.data.length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            value = response.data.data.length;
          } else {
            value = response.data.total || 0;
          }
          break;
        // DEPRECATED: mantener compatibilidad con hitos_completados
        case 'hitos_completados':
          // Filtrar hitos completados (por compatibilidad)
          if (Array.isArray(response.data.data)) {
            value = response.data.data.filter((hito: any) => 
              hito.estado === 'completado' || hito.completado === true
            ).length;
          } else {
            value = response.data.completados || 0;
          }
          break;
        case 'eventos_mes':
          // Contar eventos del mes actual
          if (Array.isArray(response.data)) {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            value = response.data.filter((evento: any) => {
              const eventoDate = new Date(evento.start || evento.fecha);
              return eventoDate.getMonth() === currentMonth && 
                     eventoDate.getFullYear() === currentYear;
            }).length;
          } else {
            value = response.data.eventos_mes || 0;
          }
          break;
        default:
          // Usar dataKey genérico
          value = response.data[config.dataKey] || 0;
      }

      // Actualizar cache
      this.cache.set(cacheKey, { data: value, timestamp: Date.now() });
      
      return value;
    } catch (error) {
      console.error(`Error fetching KPI ${config.id}:`, error);
      
      // Si hay error, retornar valor del cache si existe
      if (cached) {
        return cached.data;
      }
      
      throw error;
    }
  }

  // Obtener datos de múltiples KPIs
  async fetchMultipleKpis(configs: KpiConfig[]): Promise<KpiData[]> {
    const promises = configs.map(async (config) => {
      try {
        const value = await this.fetchKpiData(config);
        return {
          id: config.id,
          value,
          loading: false,
          lastUpdated: new Date()
        };
      } catch (error: any) {
        return {
          id: config.id,
          value: 0,
          loading: false,
          error: error.message || 'Error al cargar datos',
          lastUpdated: new Date()
        };
      }
    });

    return Promise.all(promises);
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
  }

  // Limpiar cache expirado - CORREGIDO para compatibilidad con TypeScript
  clearExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Usar forEach en lugar de for...of para evitar problemas de iteración
    this.cache.forEach((cached, key) => {
      if (!this.isCacheValid(cached.timestamp)) {
        keysToDelete.push(key);
      }
    });
    
    // Eliminar las claves expiradas
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }
}

export const kpiService = new KpiService();