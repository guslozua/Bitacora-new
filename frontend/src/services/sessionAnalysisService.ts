// services/sessionAnalysisService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class SessionAnalysisService {
  
  // Subir archivo de sesiones
  async uploadSessionFile(file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append('sessionFile', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await axios.post(`${API_URL}/api/session-analysis/upload`, formData, config);
    return response.data;
  }

  // Obtener estadísticas actuales
  async getCurrentStats(): Promise<any> {
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    };

    const response = await axios.get(`${API_URL}/api/session-analysis/stats/current`, config);
    // Extraer los datos del wrapper de respuesta
    return response.data.success ? response.data.data : null;
  }

  // Obtener datos históricos
  async getHistoricalData(days: number = 30): Promise<any> {
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    };

    const response = await axios.get(`${API_URL}/api/session-analysis/stats/historical?dias=${days}`, config);
    return response.data;
  }

  // Obtener rangos IP configurados
  async getIpRanges(): Promise<any> {
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    };

    const response = await axios.get(`${API_URL}/api/session-analysis/ip-ranges`, config);
    return response.data;
  }

  // Guardar nuevo rango IP
  async saveIpRange(rangeData: any): Promise<any> {
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.post(`${API_URL}/api/session-analysis/ip-ranges`, rangeData, config);
    return response.data;
  }

  // Actualizar rango IP
  async updateIpRange(id: number, rangeData: any): Promise<any> {
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.put(`${API_URL}/api/session-analysis/ip-ranges/${id}`, rangeData, config);
    return response.data;
  }

  // Eliminar rango IP
  async deleteIpRange(id: number): Promise<any> {
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    };

    const response = await axios.delete(`${API_URL}/api/session-analysis/ip-ranges/${id}`, config);
    return response.data;
  }

  // Validar formato IP
  validateIpFormat(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validar archivo antes de subir
  validateFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo de archivo
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExt)) {
      return {
        valid: false,
        error: 'Tipo de archivo no válido. Solo se permiten archivos CSV y Excel (.csv, .xlsx, .xls)'
      };
    }
    
    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. El tamaño máximo permitido es 50MB.'
      };
    }

    return { valid: true };
  }

  // Obtener información del archivo
  getFileInfo(file: File) {
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleDateString('es-ES'),
      extension: file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    };
  }

  // Manejo de errores centralizado
  handleError(error: any): string {
    if (error.response) {
      // Error de respuesta del servidor
      if (error.response.status === 401) {
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (error.response.status === 403) {
        return 'No tienes permisos para realizar esta acción.';
      } else if (error.response.status === 413) {
        return 'El archivo es demasiado grande. Máximo 50MB permitido.';
      } else if (error.response.data?.message) {
        return error.response.data.message;
      }
    } else if (error.request) {
      // Error de red
      return 'Error de conexión. Verifica tu conexión a internet.';
    }
    
    return error.message || 'Error desconocido al procesar la solicitud.';
  }
}

export const sessionAnalysisService = new SessionAnalysisService();