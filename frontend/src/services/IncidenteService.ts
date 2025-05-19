// src/services/IncidenteService.ts
import axios from 'axios';
import { Incidente } from '../models/Event';

// Servicio para operaciones con incidentes
const IncidenteService = {
  // Obtener todos los incidentes con filtros opcionales
  fetchIncidentes: async (params = {}) => {
    try {
      const response = await axios.get('/api/incidentes', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener incidentes:', error);
      throw error;
    }
  },
  
  // Obtener un incidente por ID
  fetchIncidenteById: async (id: number | string): Promise<Incidente> => {
    try {
      const response = await axios.get(`/api/incidentes/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener el incidente');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener incidente con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Obtener incidentes por guardia
  fetchIncidentesByGuardia: async (guardiaId: number | string) => {
    try {
      const response = await axios.get(`/api/incidentes/guardia/${guardiaId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener incidentes de guardia');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener incidentes para guardia ${guardiaId}:`, error);
      throw error;
    }
  },
  
  // Crear un nuevo incidente
  createIncidente: async (incidente: Incidente) => {
    try {
      const response = await axios.post('/api/incidentes', incidente);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al crear el incidente');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error al crear incidente:', error);
      throw error;
    }
  },
  
  // Actualizar un incidente existente
  updateIncidente: async (incidente: Incidente) => {
    if (!incidente.id) {
      throw new Error('ID de incidente no proporcionado para actualización');
    }
    
    try {
      const response = await axios.put(`/api/incidentes/${incidente.id}`, incidente);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al actualizar el incidente');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error al actualizar incidente con ID ${incidente.id}:`, error);
      throw error;
    }
  },
  
  // Eliminar un incidente
  deleteIncidente: async (id: number | string) => {
    try {
      const response = await axios.delete(`/api/incidentes/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al eliminar el incidente');
      }
      
      return response.data.success;
    } catch (error) {
      console.error(`Error al eliminar incidente con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Cambiar estado de un incidente
  cambiarEstadoIncidente: async (id: number | string, estado: string) => {
    try {
      const response = await axios.patch(`/api/incidentes/${id}/estado`, { estado });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al cambiar estado del incidente');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error al cambiar estado de incidente con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Obtener estadísticas de incidentes (para reportes)
  getEstadisticasIncidentes: async (params = {}) => {
    try {
      const response = await axios.get('/api/incidentes/estadisticas', { params });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener estadísticas de incidentes');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de incidentes:', error);
      throw error;
    }
  },
  
  // Exportar incidentes a diferentes formatos
  exportarIncidentes: async (formato: 'csv' | 'excel' | 'pdf' = 'csv', filtros = {}) => {
    try {
      const response = await axios.get(`/api/incidentes/exportar/${formato}`, {
        params: filtros,
        responseType: 'blob'
      });
      
      // Crear URL para el blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determinar el tipo de archivo y nombre
      let extension;
      switch (formato) {
        case 'excel':
          extension = 'xlsx';
          break;
        case 'pdf':
          extension = 'pdf';
          break;
        case 'csv':
        default:
          extension = 'csv';
          break;
      }
      
      link.setAttribute('download', `incidentes_${new Date().toISOString().slice(0, 10)}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error(`Error al exportar incidentes en formato ${formato}:`, error);
      throw error;
    }
  }
};

export default IncidenteService;