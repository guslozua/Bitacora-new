// services/InformeService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Interfaz para los parámetros de filtro de informes de incidentes
export interface InformeIncidentesParams {
  desde?: string;
  hasta?: string;
  usuario?: string;
  estado?: string;
  codigo?: string;
  orderBy?: string;
  orderDir?: string;
}

// Interfaz para los parámetros de filtro de informes de guardias
export interface InformeGuardiasParams {
  desde?: string;
  hasta?: string;
  usuario?: string;
  conIncidentes?: boolean;
  orderBy?: string;
  orderDir?: string;
}

// Interfaz para los parámetros de filtro de informes de liquidaciones
export interface InformeLiquidacionesParams {
  periodo?: string;
  usuario?: string;
  estado?: string;
  orderBy?: string;
  orderDir?: string;
}

// Clase de servicio para interactuar con la API de informes
class InformeService {
  // Obtener informe de incidentes
  async getInformeIncidentes(filtros: InformeIncidentesParams = {}) {
    try {
      const response = await axios.get(`${API_URL}/informes/incidentes`, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Error al obtener informe de incidentes:', error);
      throw error;
    }
  }

  // Obtener informe de guardias
  async getInformeGuardias(filtros: InformeGuardiasParams = {}) {
    try {
      const response = await axios.get(`${API_URL}/informes/guardias`, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Error al obtener informe de guardias:', error);
      throw error;
    }
  }

  // Obtener informe de liquidaciones
  async getInformeLiquidaciones(filtros: InformeLiquidacionesParams = {}) {
    try {
      const response = await axios.get(`${API_URL}/informes/liquidaciones`, { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Error al obtener informe de liquidaciones:', error);
      throw error;
    }
  }

  // Obtener informe resumen
  async getInformeResumen(periodo?: string) {
    try {
      const response = await axios.get(`${API_URL}/informes/resumen`, { 
        params: periodo ? { periodo } : {} 
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener informe resumen:', error);
      throw error;
    }
  }

  // Exportar informe de incidentes
  exportarInformeIncidentes(formato: 'excel' | 'pdf' | 'csv', filtros: InformeIncidentesParams = {}) {
    const queryParams = new URLSearchParams();
    
    // Añadir filtros a los parámetros de la URL
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    // Generar URL de exportación
    const url = `${API_URL}/informes/incidentes/exportar/${formato}?${queryParams.toString()}`;
    
    // Abrir la URL en una nueva ventana para descargar el archivo
    window.open(url, '_blank');
  }

  // Exportar informe de guardias
  exportarInformeGuardias(formato: 'excel' | 'pdf' | 'csv', filtros: InformeGuardiasParams = {}) {
    const queryParams = new URLSearchParams();
    
    // Añadir filtros a los parámetros de la URL
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    // Generar URL de exportación
    const url = `${API_URL}/informes/guardias/exportar/${formato}?${queryParams.toString()}`;
    
    // Abrir la URL en una nueva ventana para descargar el archivo
    window.open(url, '_blank');
  }

  // Exportar informe de liquidaciones
  exportarInformeLiquidaciones(formato: 'excel' | 'pdf' | 'csv', filtros: InformeLiquidacionesParams = {}) {
    const queryParams = new URLSearchParams();
    
    // Añadir filtros a los parámetros de la URL
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    // Generar URL de exportación
    const url = `${API_URL}/informes/liquidaciones/exportar/${formato}?${queryParams.toString()}`;
    
    // Abrir la URL en una nueva ventana para descargar el archivo
    window.open(url, '_blank');
  }
}

export default new InformeService();