// src/services/GuardiaService.ts - Versión actualizada
import axios from 'axios';
import { Event, EventType } from '../models/Event';

// URL base de la API
import { API_BASE_URL } from './apiConfig';
const API_URL = API_BASE_URL;

// Clase para manejar errores de la API
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Interfaz para el modelo de Guardia
export interface Guardia {
  id: number;
  fecha: string;
  usuario: string;
  notas?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para el resultado de importación
export interface ImportResult {
  totalImportadas: number;
  totalErrores: number;
  totalOmitidas?: number; // Nuevo campo para guardias omitidas por duplicados
  errors?: string[];
}

// Convertir formato de Guardia a Event para el calendario
export const convertirGuardiaAEvento = (guardia: Guardia): Event => {
  console.log('🔄 Convirtiendo guardia a evento:', {
    id: guardia.id,
    fecha: guardia.fecha,
    usuario: guardia.usuario,
    fechaConvertida: new Date(guardia.fecha)
  });
  
  const evento: Event = {
    id: `guardia-${guardia.id}`,
    title: `Guardia: ${guardia.usuario}`,
    start: new Date(guardia.fecha),
    end: new Date(guardia.fecha),
    allDay: true,
    type: 'guardia' as EventType,
    color: '#9c27b0', // Color para guardias
    description: guardia.notas || ''
  };
  
  console.log('✅ Evento generado:', evento);
  return evento;
};

// Obtener todas las guardias
export const fetchGuardias = async (): Promise<Guardia[]> => {
  try {
    console.log('🛡️ Obteniendo guardias desde:', `${API_URL}/guardias`);
    console.log('🌐 API_URL:', API_URL);
    
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.get(`${API_URL}/guardias`, config);
    console.log('✅ Respuesta de guardias:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error al obtener guardias:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Response:', error.response.data);
      throw new ApiError(
        error.response.data.message || 'Error al obtener guardias',
        error.response.status
      );
    }
    throw new Error('Error de conexión al obtener guardias');
  }
};

// Obtener una guardia por ID
export const fetchGuardiaById = async (id: number): Promise<Guardia> => {
  try {
    console.log('🛡️ Obteniendo guardia por ID:', id);
    
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios.get(`${API_URL}/guardias/${id}`, config);
    console.log('✅ Respuesta guardia por ID:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error al obtener guardia por ID:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Response:', error.response.data);
      throw new ApiError(
        error.response.data.message || 'Error al obtener la guardia',
        error.response.status
      );
    }
    throw new Error('Error de conexión al obtener la guardia');
  }
};

// Crear una nueva guardia
export const createGuardia = async (guardia: Omit<Guardia, 'id'>): Promise<Guardia> => {
  try {
    const response = await axios.post(`${API_URL}/guardias`, guardia);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al crear la guardia',
        error.response.status
      );
    }
    throw new Error('Error de conexión al crear la guardia');
  }
};

// Actualizar una guardia existente
export const updateGuardia = async (guardia: Guardia): Promise<Guardia> => {
  try {
    const response = await axios.put(`${API_URL}/guardias/${guardia.id}`, guardia);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al actualizar la guardia',
        error.response.status
      );
    }
    throw new Error('Error de conexión al actualizar la guardia');
  }
};

// Eliminar una guardia
export const deleteGuardia = async (id: number): Promise<boolean> => {
  try {
    await axios.delete(`${API_URL}/guardias/${id}`);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al eliminar la guardia',
        error.response.status
      );
    }
    throw new Error('Error de conexión al eliminar la guardia');
  }
};

// Importar guardias desde archivo Excel
export const importGuardiasFromExcel = async (file: File): Promise<ImportResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/guardias/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      totalImportadas: response.data.totalImportadas || 0,
      totalErrores: response.data.totalErrores || 0,
      totalOmitidas: response.data.totalOmitidas || 0, // Nuevo campo
      errors: response.data.errors
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al importar guardias',
        error.response.status
      );
    }
    throw new Error('Error de conexión al importar guardias');
  }
};

export default {
  fetchGuardias,
  fetchGuardiaById,
  createGuardia,
  updateGuardia,
  deleteGuardia,
  importGuardiasFromExcel,
  convertirGuardiaAEvento
};