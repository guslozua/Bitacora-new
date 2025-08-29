// src/services/GuardiaService.ts

// Importaciones al inicio del archivo
import { API_BASE_URL } from './apiConfig';

export interface Guardia {
  id: number;
  fecha: string;
  usuario: string;
  notas?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GuardiaCreateRequest {
  fecha: string;
  usuario: string;
  notas?: string | null; // CORREGIDO: Permitir null
}

export interface GuardiaUpdateRequest {
  id: number;
  fecha?: string;
  usuario?: string;
  notas?: string | null; // CORREGIDO: Permitir null
}

export interface GuardiaResponse {
  success: boolean;
  message: string;
  data?: Guardia | Guardia[];
  error?: string;
}

export interface ImportResult {
  totalImportadas: number;
  totalErrores: number;
  totalOmitidas?: number;
  errors?: string[];
}

// URL base de la API
class GuardiaServiceClass {
  private readonly baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL || 'http://localhost:5000/api';
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP Error: ${response.status} ${response.statusText}`
      }));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
  }

  // Obtener todas las guardias
  async fetchGuardias(): Promise<Guardia[]> {
    try {
      console.log('🛡️ Obteniendo guardias desde:', `${this.baseURL}/guardias`);
      
      const response = await fetch(`${this.baseURL}/guardias`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await this.handleResponse<GuardiaResponse>(response);
      
      // Manejar diferentes formatos de respuesta del backend
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      } else if (Array.isArray(result)) {
        // Si la respuesta es directamente un array
        return result as unknown as Guardia[];
      } else {
        console.warn('Formato de respuesta inesperado:', result);
        return [];
      }
    } catch (error) {
      console.error('Error fetching guardias:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al obtener guardias'
      );
    }
  }

  // Obtener guardias con filtros
  async getGuardiasByFilter(params: {
    year?: string;
    month?: string;
    usuario?: string;
  }): Promise<Guardia[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.year) queryParams.append('year', params.year);
      if (params.month) queryParams.append('month', params.month);
      if (params.usuario && params.usuario !== 'Todos') {
        queryParams.append('usuario', params.usuario);
      }

      const url = queryParams.toString() 
        ? `${this.baseURL}/guardias?${queryParams.toString()}`
        : `${this.baseURL}/guardias`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await this.handleResponse<GuardiaResponse>(response);
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error('Error fetching filtered guardias:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error al filtrar guardias'
      );
    }
  }

  // Crear nueva guardia - CORREGIDO para manejar null
  async createGuardia(guardiaData: GuardiaCreateRequest): Promise<Guardia> {
    try {
      // Validación básica
      if (!guardiaData.fecha || !guardiaData.usuario) {
        throw new Error('Fecha y usuario son requeridos');
      }

      // Normalizar notas: convertir null a undefined y strings vacíos a null
      const normalizedData = {
        ...guardiaData,
        notas: guardiaData.notas === null ? null : (guardiaData.notas || null)
      };

      const response = await fetch(`${this.baseURL}/guardias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });

      const result = await this.handleResponse<GuardiaResponse>(response);
      
      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      } else {
        throw new Error(result.message || 'Error al crear la guardia');
      }
    } catch (error) {
      console.error('Error creating guardia:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al crear guardia'
      );
    }
  }

  // Actualizar guardia - CORREGIDO para manejar null
  async updateGuardia(guardiaData: GuardiaUpdateRequest): Promise<Guardia> {
    try {
      if (!guardiaData.id) {
        throw new Error('ID de guardia requerido para actualización');
      }

      // Normalizar notas: convertir strings vacíos a null
      const normalizedData = {
        ...guardiaData,
        notas: guardiaData.notas === '' ? null : guardiaData.notas
      };

      const response = await fetch(`${this.baseURL}/guardias/${guardiaData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });

      const result = await this.handleResponse<GuardiaResponse>(response);
      
      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      } else {
        throw new Error(result.message || 'Error al actualizar la guardia');
      }
    } catch (error) {
      console.error('Error updating guardia:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al actualizar guardia'
      );
    }
  }

  // Eliminar guardia
  async deleteGuardia(guardiaId: number): Promise<boolean> {
    try {
      if (!guardiaId || guardiaId <= 0) {
        throw new Error('ID de guardia inválido');
      }

      const response = await fetch(`${this.baseURL}/guardias/${guardiaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await this.handleResponse<GuardiaResponse>(response);
      return result.success;
    } catch (error) {
      console.error('Error deleting guardia:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al eliminar guardia'
      );
    }
  }

  // Obtener guardia por ID
  async fetchGuardiaById(guardiaId: number): Promise<Guardia | null> {
    try {
      if (!guardiaId || guardiaId <= 0) {
        throw new Error('ID de guardia inválido');
      }

      const response = await fetch(`${this.baseURL}/guardias/${guardiaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      const result = await this.handleResponse<GuardiaResponse>(response);
      return result.success && result.data && !Array.isArray(result.data) ? result.data : null;
    } catch (error) {
      console.error('Error fetching guardia by ID:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al obtener guardia'
      );
    }
  }

  // Importar guardias desde Excel
  async importGuardiasFromExcel(file: File): Promise<ImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/guardias/import`, {
        method: 'POST',
        body: formData,
      });

      const result = await this.handleResponse<{
        success: boolean;
        message: string;
        errors?: string[];
        totalImportadas: number;
        totalErrores: number;
        totalOmitidas?: number;
      }>(response);

      return {
        totalImportadas: result.totalImportadas || 0,
        totalErrores: result.totalErrores || 0,
        totalOmitidas: result.totalOmitidas || 0,
        errors: result.errors || []
      };
    } catch (error) {
      console.error('Error importing guardias from Excel:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error desconocido al importar guardias'
      );
    }
  }

  // Obtener estadísticas de guardias
  async getGuardiasStats(): Promise<{
    totalGuardias: number;
    usuariosUnicos: number;
    ultimaFecha: string;
    primeraFecha: string;
    guardiasPorMes: Record<string, number>;
  }> {
    try {
      const guardias = await this.fetchGuardias();
      
      if (guardias.length === 0) {
        return {
          totalGuardias: 0,
          usuariosUnicos: 0,
          ultimaFecha: '',
          primeraFecha: '',
          guardiasPorMes: {}
        };
      }

      // Calcular usuarios únicos - CORREGIDO: usando Array.from con new Set
      const usuariosUnicos = Array.from(new Set(guardias.map(g => g.usuario))).length;

      // Ordenar por fecha para obtener primera y última
      const fechasOrdenadas = guardias
        .map(g => new Date(g.fecha))
        .sort((a, b) => a.getTime() - b.getTime());

      const primeraFecha = fechasOrdenadas[0].toISOString().split('T')[0];
      const ultimaFecha = fechasOrdenadas[fechasOrdenadas.length - 1].toISOString().split('T')[0];

      // Contar guardias por mes
      const guardiasPorMes: Record<string, number> = {};
      guardias.forEach(guardia => {
        const fecha = new Date(guardia.fecha);
        const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
        guardiasPorMes[mesKey] = (guardiasPorMes[mesKey] || 0) + 1;
      });

      return {
        totalGuardias: guardias.length,
        usuariosUnicos,
        ultimaFecha,
        primeraFecha,
        guardiasPorMes
      };
    } catch (error) {
      console.error('Error getting guardias stats:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener estadísticas'
      );
    }
  }

  // Convertir formato de Guardia a Event para el calendario
  convertirGuardiaAEvento(guardia: Guardia): any {
    console.log('🔄 Convirtiendo guardia a evento:', {
      id: guardia.id,
      fecha: guardia.fecha,
      usuario: guardia.usuario
    });
    
    // Detectar si estamos en Railway por hostname
    const isRailway = window.location.hostname.includes('railway.app');
    
    let fechaConvertida: Date;
    
    if (isRailway) {
      // Fix específico para Railway: forzar UTC
      const fechaOriginal = new Date(guardia.fecha);
      fechaConvertida = new Date(
        fechaOriginal.getUTCFullYear(),
        fechaOriginal.getUTCMonth(), 
        fechaOriginal.getUTCDate(),
        0, 0, 0, 0 // Hora fija a medianoche
      );
      console.log(`Railway fix aplicado - Original: ${guardia.fecha}, Corregida: ${fechaConvertida}`);
    } else {
      // Local: usar método original que ya funciona
      fechaConvertida = new Date(guardia.fecha);
      console.log(`Local - Fecha: ${fechaConvertida}`);
    }
    
    const evento = {
      id: `guardia-${guardia.id}`,
      title: `Guardia: ${guardia.usuario}`,
      start: fechaConvertida,
      end: fechaConvertida,
      allDay: true,
      type: 'guardia',
      color: '#9c27b0', // Color para guardias
      description: guardia.notas || ''
    };
    
    console.log('✅ Evento generado:', evento);
    return evento;
  }
}

// Exportar instancia singleton
export const GuardiaService = new GuardiaServiceClass();

// Exportar funciones compatibles con el código existente
export const {
  fetchGuardias,
  fetchGuardiaById,
  createGuardia,
  updateGuardia,
  deleteGuardia,
  importGuardiasFromExcel,
  convertirGuardiaAEvento
} = GuardiaService;

// Exportar servicio como default
export default GuardiaService;