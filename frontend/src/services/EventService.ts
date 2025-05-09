// src/services/EventService.ts
import { Event } from '../models/Event';
import axios from 'axios';
import moment from 'moment';
// Importar el servicio de guardias
import GuardiaService, { convertirGuardiaAEvento } from './GuardiaService';

// URL base de la API - Ajusta según la configuración de tu proyecto
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Clase para manejar errores de la API
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Convertir fechas de string a objetos Date
const parseDates = (event: any): Event => {
  return {
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
    createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
    updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined
  };
};

// Obtener todos los eventos
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const response = await axios.get(`${API_URL}/eventos`);
    return response.data.data.map(parseDates);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al obtener eventos',
        error.response.status
      );
    }
    throw new Error('Error de conexión al obtener eventos');
  }
};

// Nueva función para obtener todos los elementos del calendario (eventos + guardias)
export const fetchAllCalendarItems = async (): Promise<Event[]> => {
  try {
    // Obtener eventos regulares
    const events = await fetchEvents();
    
    // Obtener guardias y convertirlas al formato de eventos
    const guardias = await GuardiaService.fetchGuardias();
    const guardiasComoEventos = guardias.map(convertirGuardiaAEvento);
    
    // Combinar ambos arrays
    return [...events, ...guardiasComoEventos];
  } catch (error) {
    console.error('Error al obtener elementos del calendario:', error);
    throw error;
  }
};

// Obtener un evento por ID
export const fetchEventById = async (id: string): Promise<Event> => {
  try {
    // Si el ID comienza con "guardia-", obtener de guardias
    if (id.startsWith('guardia-')) {
      const guardiaId = parseInt(id.replace('guardia-', ''));
      const guardia = await GuardiaService.fetchGuardiaById(guardiaId);
      return convertirGuardiaAEvento(guardia);
    }
    
    // De lo contrario, obtener de eventos
    const response = await axios.get(`${API_URL}/eventos/${id}`);
    return parseDates(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al obtener el evento',
        error.response.status
      );
    }
    throw new Error('Error de conexión al obtener el evento');
  }
};

// Crear un nuevo evento
export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
  try {
    const response = await axios.post(`${API_URL}/eventos`, eventData);
    return parseDates(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al crear el evento',
        error.response.status
      );
    }
    throw new Error('Error de conexión al crear el evento');
  }
};

// Actualizar un evento existente
export const updateEvent = async (event: Event): Promise<Event> => {
  try {
    const response = await axios.put(`${API_URL}/eventos/${event.id}`, event);
    return parseDates(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al actualizar el evento',
        error.response.status
      );
    }
    throw new Error('Error de conexión al actualizar el evento');
  }
};

// Marcar un evento como completado/pendiente (para tareas)
export const markEventAsCompleted = async (id: string, completed: boolean): Promise<Event> => {
  try {
    const response = await axios.patch(`${API_URL}/eventos/${id}/complete`, { completed });
    return parseDates(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al actualizar el estado de la tarea',
        error.response.status
      );
    }
    throw new Error('Error de conexión al actualizar el estado de la tarea');
  }
};

// Eliminar un evento
export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    // Si el ID comienza con "guardia-", eliminar de guardias
    if (id.startsWith('guardia-')) {
      const guardiaId = parseInt(id.replace('guardia-', ''));
      await GuardiaService.deleteGuardia(guardiaId);
      return true;
    }
    
    // De lo contrario, eliminar de eventos
    await axios.delete(`${API_URL}/eventos/${id}`);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al eliminar el evento',
        error.response.status
      );
    }
    throw new Error('Error de conexión al eliminar el evento');
  }
};

// Obtener eventos por tipo
export const fetchEventsByType = async (type: 'task' | 'event' | 'holiday' | 'guardia'): Promise<Event[]> => {
  try {
    // Si el tipo es 'guardia', obtener de guardias
    if (type === 'guardia') {
      const guardias = await GuardiaService.fetchGuardias();
      return guardias.map(convertirGuardiaAEvento);
    }
    
    // De lo contrario, obtener de eventos
    const response = await axios.get(`${API_URL}/eventos?type=${type}`);
    return response.data.data.map(parseDates);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || `Error al obtener eventos de tipo ${type}`,
        error.response.status
      );
    }
    throw new Error(`Error de conexión al obtener eventos de tipo ${type}`);
  }
};

// Obtener eventos por rango de fechas
export const fetchEventsByDateRange = async (start: Date, end: Date): Promise<Event[]> => {
  try {
    const startStr = moment(start).format('YYYY-MM-DD');
    const endStr = moment(end).format('YYYY-MM-DD');
    
    // Obtener eventos regulares
    const response = await axios.get(`${API_URL}/eventos?start=${startStr}&end=${endStr}`);
    const eventos = response.data.data.map(parseDates);
    
    // Obtener guardias para el mismo rango
    const guardias = await GuardiaService.fetchGuardias();
    const guardiasEnRango = guardias
      .filter(guardia => {
        const fechaGuardia = new Date(guardia.fecha);
        return fechaGuardia >= start && fechaGuardia <= end;
      })
      .map(convertirGuardiaAEvento);
    
    // Combinar y devolver
    return [...eventos, ...guardiasEnRango];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al obtener eventos por rango de fechas',
        error.response.status
      );
    }
    throw new Error('Error de conexión al obtener eventos por rango de fechas');
  }
};

// Importar eventos desde un archivo
export const importEvents = async (file: File): Promise<number> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/eventos/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data.count || 0;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data.message || 'Error al importar eventos',
        error.response.status
      );
    }
    throw new Error('Error de conexión al importar eventos');
  }
};

// Exportar eventos a diferentes formatos (CSV, JSON, Excel)
export const exportEvents = async (format: 'csv' | 'json' | 'excel' = 'csv'): Promise<void> => {
  try {
    // Determinar extensión y tipo MIME según el formato
    let fileExtension: string;
    let mimeType: string;
    
    switch (format) {
      case 'json':
        fileExtension = 'json';
        mimeType = 'application/json';
        break;
      case 'excel':
        fileExtension = 'xlsx';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
      default:
        fileExtension = 'csv';
        mimeType = 'text/csv';
        break;
    }
    
    const response = await axios.get(`${API_URL}/eventos/export/${format}`, {
      responseType: 'blob'
    });
    
    // Crear URL para el blob y descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eventos.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    window.URL.revokeObjectURL(url);
    link.remove();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        'Error al exportar eventos',
        error.response?.status || 500
      );
    }
    throw new Error(`Error de conexión al exportar eventos en formato ${format}`);
  }
};