// services/LiquidacionService.ts
import axios from 'axios';

import { API_BASE_URL } from './apiConfig';
const API_URL = API_BASE_URL;

export interface Liquidacion {
  id: number;
  periodo: string;
  fecha_generacion: string;
  estado: string;
  observaciones?: string;
  detalles?: LiquidacionDetalle[];
}

export interface LiquidacionDetalle {
  id: number;
  usuario: string;
  fecha: string;
  total_minutos: number;
  total_importe: number;
}

const LiquidacionService = {
  // Generar nueva liquidación
  generarLiquidacion: async (periodo: string): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/liquidaciones/generar`, { periodo });
      return response.data;
    } catch (error) {
      console.error('Error al generar liquidación:', error);
      throw error;
    }
  },

  // Obtener liquidaciones
  obtenerLiquidaciones: async (): Promise<Liquidacion[]> => {
    try {
      const response = await axios.get(`${API_URL}/liquidaciones`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener liquidaciones:', error);
      throw error;
    }
  },

  // Obtener liquidación por ID
  obtenerLiquidacionPorId: async (id: number): Promise<Liquidacion> => {
    try {
      const response = await axios.get(`${API_URL}/liquidaciones/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener liquidación:', error);
      throw error;
    }
  },

  // Cambiar estado de liquidación
  cambiarEstado: async (id: number, estado: string): Promise<void> => {
    try {
      await axios.patch(`${API_URL}/liquidaciones/${id}/estado`, { estado });
    } catch (error) {
      console.error('Error al cambiar estado de liquidación:', error);
      throw error;
    }
  }
};

export default LiquidacionService;