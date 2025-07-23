// =============================================
// SERVICIO: announcementsService.ts
// Cliente para la API de gestión de anuncios CON AUTENTICACIÓN
// =============================================

import api from './api';

// Tipos TypeScript para anuncios
export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  icon: string;
  priority: number;
  active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  action_text?: string | null;
  action_url?: string | null;
  target_audience: string;
  created_by: number;
  created_by_name?: string;
  created_by_email?: string;
  views_count: number;
  clicks_count: number;
  created_at: string;
  updated_at: string;
  status?: 'vigente' | 'programado' | 'expirado';
  days_until_expiry?: number;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  icon: string;
  priority: number;
  active: boolean;
  start_date: string;
  end_date: string;
  action_text: string;
  action_url: string;
  target_audience: string;
}

export interface AnnouncementFilters {
  page?: number;
  limit?: number;
  active?: number | null;
  type?: string | null;
  target_audience?: string | null;
  search?: string | null;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AnnouncementStats {
  total_announcements: number;
  active_announcements: number;
  inactive_announcements: number;
  scheduled_announcements: number;
  expired_announcements: number;
  total_views: number;
  total_clicks: number;
  avg_views_per_announcement: number;
  last_created_at: string | null;
}

export interface StatsByType {
  type: string;
  total: number;
  active: number;
  total_views: number;
  total_clicks: number;
  avg_views: number;
}

class AnnouncementsService {
  private readonly baseUrl = '/announcements'; // Sin /api/ porque ya está en api.ts
  
  /**
   * 🔐 OBTENER HEADERS CON TOKEN DE AUTENTICACIÓN
   */
  private getAuthHeaders() {
    // NO NECESARIO - api.ts ya agrega el token automáticamente
    return {};
  }

  /**
   * 🔐 CONFIGURACIÓN DE API CON TOKEN
   */
  private getApiConfig() {
    return {
      headers: this.getAuthHeaders()
    };
  }

  // ===============================
  // MÉTODOS PÚBLICOS (SIN AUTENTICACIÓN)
  // ===============================

  /**
   * Obtener anuncios activos para el carrusel
   */
  async getActiveAnnouncements(target_audience: string = 'all'): Promise<ApiResponse<Announcement[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/active`, {
        params: { target_audience }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Registrar clic en anuncio
   */
  async recordClick(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/click`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Registrar clic en anuncio (alias para compatibilidad)
   */
  async registerClick(id: number): Promise<ApiResponse<void>> {
    return this.recordClick(id);
  }

  /**
   * Verificar estado del módulo
   */
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===============================
  // MÉTODOS ADMINISTRATIVOS (CON AUTENTICACIÓN)
  // ===============================

  /**
   * Obtener todos los anuncios con filtros
   */
  async getAllAnnouncements(filters: AnnouncementFilters = {}): Promise<ApiResponse<Announcement[]>> {
    try {
      const response = await api.get(`${this.baseUrl}`, {
        params: filters,
        ...this.getApiConfig()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtener anuncio por ID
   */
  async getAnnouncementById(id: number): Promise<ApiResponse<Announcement>> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Crear nuevo anuncio
   */
  async createAnnouncement(data: AnnouncementFormData): Promise<ApiResponse<{ id: number }>> {
    try {
      const response = await api.post(`${this.baseUrl}`, data, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar anuncio existente
   */
  async updateAnnouncement(id: number, data: Partial<AnnouncementFormData>): Promise<ApiResponse<void>> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar anuncio
   */
  async deleteAnnouncement(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Activar/Desactivar anuncio
   */
  async toggleStatus(id: number, active: boolean): Promise<ApiResponse<void>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/toggle`, { active }, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Activar/Desactivar anuncio (alias para compatibilidad)
   */
  async toggleAnnouncementStatus(id: number, active: boolean): Promise<ApiResponse<void>> {
    return this.toggleStatus(id, active);
  }

  /**
   * Actualizar prioridad de un anuncio
   */
  async updatePriority(id: number, priority: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/priority`, { priority }, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Duplicar anuncio
   */
  async duplicateAnnouncement(id: number): Promise<ApiResponse<{ id: number }>> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/duplicate`, {}, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===============================
  // MÉTODOS DE ESTADÍSTICAS (CON AUTENTICACIÓN)
  // ===============================

  /**
   * Obtener estadísticas generales
   */
  async getStatistics(): Promise<ApiResponse<AnnouncementStats>> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`, this.getApiConfig());
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtener anuncios próximos a expirar
   */
  async getExpiringAnnouncements(days: number = 30): Promise<ApiResponse<Announcement[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/expiring`, {
        params: { days },
        ...this.getApiConfig()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Buscar anuncios por texto
   */
  async searchAnnouncements(searchTerm: string, limit: number = 20): Promise<ApiResponse<Announcement[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/search`, {
        params: { q: searchTerm, limit },
        ...this.getApiConfig()
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===============================
  // MÉTODOS UTILITARIOS
  // ===============================

  /**
   * Preparar datos para formulario
   */
  prepareFormData(announcement?: Announcement): AnnouncementFormData {
    return {
      title: announcement?.title || '',
      content: announcement?.content || '',
      type: announcement?.type || 'info',
      icon: announcement?.icon || 'bi bi-info-circle',
      priority: announcement?.priority || 0,
      active: announcement?.active ?? true,
      start_date: announcement?.start_date 
        ? new Date(announcement.start_date).toISOString().slice(0, 16)
        : '',
      end_date: announcement?.end_date 
        ? new Date(announcement.end_date).toISOString().slice(0, 16)
        : '',
      action_text: announcement?.action_text || '',
      action_url: announcement?.action_url || '',
      target_audience: announcement?.target_audience || 'all'
    };
  }

  /**
   * Validar datos del formulario
   */
  validateFormData(data: AnnouncementFormData): string[] {
    const errors: string[] = [];

    if (!data.title.trim()) {
      errors.push('El título es obligatorio');
    }

    if (!data.content.trim()) {
      errors.push('El contenido es obligatorio');
    }

    if (data.title.length > 255) {
      errors.push('El título no puede exceder 255 caracteres');
    }

    if (data.content.length > 2000) {
      errors.push('El contenido no puede exceder 2000 caracteres');
    }

    if (data.action_text && !data.action_url) {
      errors.push('Si especificas un texto de acción, debes incluir una URL');
    }

    if (data.action_url && !data.action_text) {
      errors.push('Si especificas una URL de acción, debes incluir un texto');
    }

    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
    }

    return errors;
  }

  /**
   * Validar datos de anuncio (alias para compatibilidad)
   */
  validateAnnouncementData(data: AnnouncementFormData): { valid: boolean; errors: string[] } {
    const errors = this.validateFormData(data);
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener color según tipo de anuncio
   */
  getTypeColor(type: string): string {
    const colors = {
      info: '#0dcaf0',
      success: '#198754',
      warning: '#ffc107',
      danger: '#dc3545'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  /**
   * Obtener iconos por defecto según el tipo
   */
  getDefaultIcon(type: string): string {
    const icons = {
      info: 'bi bi-info-circle',
      warning: 'bi bi-exclamation-triangle',
      success: 'bi bi-check-circle',
      danger: 'bi bi-x-circle'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }

  /**
   * Obtener el texto del estado según las fechas
   */
  getStatusText(announcement: Announcement): { text: string; color: string } {
    const now = new Date();
    const startDate = announcement.start_date ? new Date(announcement.start_date) : null;
    const endDate = announcement.end_date ? new Date(announcement.end_date) : null;

    if (!announcement.active) {
      return { text: 'Inactivo', color: '#6c757d' };
    }

    if (startDate && startDate > now) {
      return { text: 'Programado', color: '#fd7e14' };
    }

    if (endDate && endDate < now) {
      return { text: 'Expirado', color: '#dc3545' };
    }

    return { text: 'Activo', color: '#198754' };
  }

  /**
   * Obtener gradiente según tipo de anuncio
   */
  getTypeGradient(type: string): string {
    const gradients = {
      info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      danger: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    };
    return gradients[type as keyof typeof gradients] || gradients.info;
  }

  /**
   * Manejo de errores centralizado
   */
  private handleError(error: any): Error {
    console.error('Error en AnnouncementsService:', error);
    
    if (error.response) {
      const message = error.response.data?.message || 'Error en el servidor';
      return new Error(message);
    }
    
    if (error.request) {
      return new Error('Error de conexión con el servidor');
    }
    
    return new Error(error.message || 'Error desconocido');
  }
}

// Exportar instancia única del servicio
const announcementsService = new AnnouncementsService();
export default announcementsService;