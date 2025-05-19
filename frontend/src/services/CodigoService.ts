// src/services/CodigoService.ts
import axios from 'axios';

// Añadir la URL base
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Codigo {
  id?: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  dias_aplicables: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  factor_multiplicador: number;
  fecha_vigencia_desde: Date | string;
  fecha_vigencia_hasta?: Date | string | null;
  estado: string;
}

// Servicio para operaciones con códigos de facturación
const CodigoService = {
  // Obtener todos los códigos
  fetchCodigos: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/codigos`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener códigos:', error);
      throw error;
    }
  },
  
  // Obtener un código por ID
  fetchCodigoById: async (id: number | string) => {
    try {
      const response = await axios.get(`${API_URL}/codigos/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener código con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Obtener códigos aplicables a una fecha y horario
  fetchCodigosAplicables: async (fecha: string, horaInicio: string, horaFin: string) => {
    try {
      const response = await axios.get(`${API_URL}/codigos/aplicables`, {
        params: { fecha, hora_inicio: horaInicio, hora_fin: horaFin }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener códigos aplicables:', error);
      throw error;
    }
  },
  
  // Crear un nuevo código
  createCodigo: async (codigo: Codigo) => {
    try {
      const response = await axios.post(`${API_URL}/codigos`, codigo);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear código:', error);
      throw error;
    }
  },
  
  // Actualizar un código existente
  updateCodigo: async (codigo: Codigo) => {
    if (!codigo.id) {
      throw new Error('ID de código no proporcionado para actualización');
    }
    
    try {
      const response = await axios.put(`${API_URL}/codigos/${codigo.id}`, codigo);
      return response.data.data;
    } catch (error) {
      console.error(`Error al actualizar código con ID ${codigo.id}:`, error);
      throw error;
    }
  },
  
  // Desactivar un código
  deactivateCodigo: async (id: number | string) => {
    try {
      const response = await axios.patch(`${API_URL}/codigos/${id}/deactivate`);
      return response.data;
    } catch (error) {
      console.error(`Error al desactivar código con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Eliminar un código
  deleteCodigo: async (id: number | string) => {
    try {
      const response = await axios.delete(`${API_URL}/codigos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar código con ID ${id}:`, error);
      throw error;
    }
  }
};

export default CodigoService;