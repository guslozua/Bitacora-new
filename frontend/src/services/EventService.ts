// src/services/EventService.ts
import { Event, EventType, Incidente } from '../models/Event';
import axios from 'axios';
import moment from 'moment';
// Importar el servicio de guardias
import GuardiaService, { convertirGuardiaAEvento } from './GuardiaService';

// URL base de la API - Ajusta según la configuración de tu proyecto
import { API_BASE_URL } from './apiConfig';
const API_URL = API_BASE_URL;

// Definir interfaz para incidentes obtenidos de la API
interface ApiIncidente {
  id: number;
  id_guardia: number;
  inicio: string;
  fin: string;
  descripcion: string;
  estado: string;
  observaciones?: string;
  duracion_minutos?: number;
}

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

// Función para obtener color según estado del incidente
const getIncidenteStatusColor = (estado: string) => {
  switch (estado) {
    case 'registrado': return '#5c6bc0'; // Indigo
    case 'revisado': return '#26c6da';   // Cyan
    case 'aprobado': return '#66bb6a';   // Verde claro
    case 'rechazado': return '#ef5350';  // Rojo claro
    case 'liquidado': return '#78909c';  // Gris azulado
    default: return '#9c27b0';           // Color de guardia por defecto
  }
};

// Nueva función para obtener todos los elementos del calendario (eventos + guardias + incidentes) - OPTIMIZADA
export const fetchAllCalendarItems = async (): Promise<Event[]> => {
  try {
    console.log('📅 Iniciando carga optimizada del calendario...');
    
    // Ejecutar peticiones en paralelo para mayor velocidad
    const [eventsResponse, guardiasResponse] = await Promise.all([
      fetchEvents().catch(error => {
        console.warn('Error al cargar eventos regulares:', error);
        return []; // Devolver array vacío si falla
      }),
      GuardiaService.fetchGuardias().catch(error => {
        console.warn('Error al cargar guardias:', error);
        return []; // Devolver array vacío si falla
      })
    ]);
    
    console.log('✅ Eventos regulares cargados:', eventsResponse.length);
    console.log('✅ Guardias cargadas:', guardiasResponse.length);
    
    // DEBUG: Mostrar las primeras 3 guardias para verificar el formato
    if (guardiasResponse.length > 0) {
      console.log('🔍 DEBUG - Primeras 3 guardias RAW:', guardiasResponse.slice(0, 3));
    }
    
    // Convertir guardias al formato de eventos
    const guardiasComoEventos = guardiasResponse.map(convertirGuardiaAEvento);
    
    // DEBUG: Mostrar las primeras 3 guardias convertidas
    if (guardiasComoEventos.length > 0) {
      console.log('🔍 DEBUG - Primeras 3 guardias CONVERTIDAS:', guardiasComoEventos.slice(0, 3));
    }
    
    // OPTIMIZACIÓN: Solo cargar incidentes si hay guardias y no son demasiadas
    let incidentes: Event[] = [];
    
    if (guardiasResponse.length > 0 && guardiasResponse.length <= 50) {
      console.log('📋 Cargando incidentes para', guardiasResponse.length, 'guardias...');
      
      // Cargar incidentes en lotes más pequeños para evitar sobrecarga
      const incidentesPromises = guardiasResponse.map(async (guardia) => {
        try {
          const guardiaIncidentes = await axios.get(`${API_URL}/incidentes/guardia/${guardia.id}`, {
            timeout: 5000 // Timeout de 5 segundos por petición
          });
          
          if (guardiaIncidentes.data.success && guardiaIncidentes.data.data) {
            return guardiaIncidentes.data.data.map((incidente: ApiIncidente) => ({
              id: `incidente-${incidente.id}`,
              title: `Incidente: ${incidente.descripcion.substring(0, 20)}${incidente.descripcion.length > 20 ? '...' : ''}`,
              start: new Date(incidente.inicio),
              end: new Date(incidente.fin),
              allDay: false,
              type: 'guardia' as EventType,
              color: getIncidenteStatusColor(incidente.estado),
              description: incidente.descripcion,
              incidenteId: incidente.id,
              guardiaId: incidente.id_guardia,
              incidenteEstado: incidente.estado,
              isIncidente: true
            }));
          }
          return [];
        } catch (error) {
          console.warn(`⚠️ Error al obtener incidentes para guardia ${guardia.id}:`, error);
          return []; // Continuar aunque falle una guardia
        }
      });
      
      // Esperar a que terminen todas las peticiones de incidentes
      const incidentesArrays = await Promise.all(incidentesPromises);
      incidentes = incidentesArrays.flat();
      
      console.log('✅ Incidentes cargados:', incidentes.length);
    } else if (guardiasResponse.length > 50) {
      console.log('⚠️ Demasiadas guardias (', guardiasResponse.length, '), omitiendo incidentes para mejorar performance');
    }
    
    // Combinar todos los elementos
    const allItems = [...eventsResponse, ...guardiasComoEventos, ...incidentes];
    console.log('🎉 Calendario cargado completamente:', allItems.length, 'elementos');
    
    return allItems;
  } catch (error) {
    console.error('❌ Error al obtener elementos del calendario:', error);
    
    // En caso de error, intentar devolver al menos las guardias
    try {
      const guardias = await GuardiaService.fetchGuardias();
      const guardiasComoEventos = guardias.map(convertirGuardiaAEvento);
      console.log('⚡ Devolviendo solo guardias como fallback:', guardiasComoEventos.length);
      return guardiasComoEventos;
    } catch (fallbackError) {
      console.error('❌ Error en fallback:', fallbackError);
      throw error;
    }
  }
};

// Obtener un evento por ID
export const fetchEventById = async (id: string | number): Promise<Event> => {
  try {
    // Convertir id a string si es un número
    const idString = String(id);
    
    // Si es un incidente (comienza con 'incidente-')
    if (idString.startsWith('incidente-')) {
      const incidenteId = parseInt(idString.replace('incidente-', ''));
      
      // Obtener el incidente
      const response = await axios.get(`${API_URL}/incidentes/${incidenteId}`);
      
      if (response.data.success) {
        const incidente = response.data.data;
        
        // Obtener la guardia relacionada
        const guardiaResponse = await axios.get(`${API_URL}/guardias/${incidente.id_guardia}`);
        const guardia = guardiaResponse.data.data;
        
        // Convertir a formato de evento con la marca isIncidente
        return {
          id: `incidente-${incidente.id}`,
          title: `Incidente: ${incidente.descripcion}`,
          start: new Date(incidente.inicio),
          end: new Date(incidente.fin),
          allDay: false,
          type: 'guardia' as EventType, // Usar el mismo tipo para filtrado
          color: getIncidenteStatusColor(incidente.estado),
          description: incidente.descripcion,
          incidenteId: incidente.id,
          guardiaId: incidente.id_guardia,
          incidenteEstado: incidente.estado,
          isIncidente: true,
          guardiaUsuario: guardia.usuario
        };
      }
    }
    
    // Si el ID comienza con "guardia-", obtener de guardias
    if (idString.startsWith('guardia-')) {
      const guardiaId = parseInt(idString.replace('guardia-', ''));
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
    // Asegurarnos de que start y end sean strings en formato ISO
    const formattedData = {
      ...eventData,
      start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
      end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end
    };

    console.log('Creando evento con datos:', formattedData);
    
    const response = await axios.post(`${API_URL}/eventos`, formattedData);
    return parseDates(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error de respuesta del servidor:', error.response.data);
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
    // Asegurarnos de que start y end sean strings en formato ISO
    const formattedData = {
      ...event,
      start: event.start instanceof Date ? event.start.toISOString() : event.start,
      end: event.end instanceof Date ? event.end.toISOString() : event.end
    };

    console.log('Actualizando evento con datos:', formattedData);
    
    const response = await axios.put(`${API_URL}/eventos/${event.id}`, formattedData);
    return parseDates(response.data.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error de respuesta del servidor:', error.response.data);
      throw new ApiError(
        error.response.data.message || 'Error al actualizar el evento',
        error.response.status
      );
    }
    throw new Error('Error de conexión al actualizar el evento');
  }
};

// Marcar un evento como completado/pendiente (para tareas)
export const markEventAsCompleted = async (id: string | number, completed: boolean): Promise<Event> => {
  try {
    console.log(`Marcando evento ${id} como ${completed ? 'completado' : 'pendiente'}`);
    
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
export const deleteEvent = async (id: string | number): Promise<boolean> => {
  try {
    console.log(`Intentando eliminar evento con ID: ${id}, tipo: ${typeof id}`);
    
    // Convertir id a string si es un número para poder usar startsWith
    const idString = String(id);
    
    // Si es un incidente
    if (idString.startsWith('incidente-')) {
      console.log(`Eliminando incidente: ${idString}`);
      const incidenteId = parseInt(idString.replace('incidente-', ''));
      const response = await axios.delete(`${API_URL}/incidentes/${incidenteId}`);
      return response.data.success;
    }
    
    // Si el ID comienza con "guardia-", eliminar de guardias
    if (idString.startsWith('guardia-')) {
      console.log(`Eliminando guardia: ${idString}`);
      const guardiaId = parseInt(idString.replace('guardia-', ''));
      await GuardiaService.deleteGuardia(guardiaId);
      return true;
    }
    
    // Para todos los demás tipos de eventos (evento, tarea, feriado, cumpleaños, día a favor)
    console.log(`Eliminando evento regular: ${id}`);
    const response = await axios.delete(`${API_URL}/eventos/${id}`);
    
    // Verificar explícitamente el resultado
    if (response.status === 200 && response.data.success) {
      console.log(`Evento ${id} eliminado con éxito`);
      return true;
    } else {
      console.error('Respuesta inesperada al eliminar evento:', response.data);
      throw new Error(response.data.message || 'Error al eliminar el evento');
    }
  } catch (error) {
    console.error('Error en deleteEvent:', error);
    
    // Manejar errores de red o del servidor
    if (axios.isAxiosError(error)) {
      // Si tenemos una respuesta del servidor
      if (error.response) {
        console.error('Respuesta de error del servidor:', error.response.data);
        throw new ApiError(
          error.response.data.message || 'Error al eliminar el evento',
          error.response.status
        );
      } 
      // Si hay un error de red (sin respuesta)
      else {
        console.error('Error de red:', error.message);
        throw new Error(`Error de conexión: ${error.message}`);
      }
    }
    
    // Para otros tipos de error
    throw new Error('Error al eliminar el evento: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// Obtener eventos por tipo
export const fetchEventsByType = async (type: EventType): Promise<Event[]> => {
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
    
    // Obtener incidentes para todas las guardias en rango
    const incidentes: Event[] = [];
    for (const guardia of guardiasEnRango) {
      try {
        const guardiaId = typeof guardia.id === 'string' && guardia.id.startsWith('guardia-')
          ? parseInt(guardia.id.replace('guardia-', ''))
          : parseInt(String(guardia.id).replace('guardia-', ''));
        
        const guardiaIncidentes = await axios.get(`${API_URL}/incidentes/guardia/${guardiaId}`);
        
        if (guardiaIncidentes.data.success && guardiaIncidentes.data.data) {
          // Filtrar solo incidentes en el rango de fechas
          const incidentesEnRango = guardiaIncidentes.data.data
            .filter((incidente: ApiIncidente) => {
              const inicioIncidente = new Date(incidente.inicio);
              const finIncidente = new Date(incidente.fin);
              return (inicioIncidente >= start && inicioIncidente <= end) || 
                    (finIncidente >= start && finIncidente <= end);
            })
            .map((incidente: ApiIncidente) => ({
              id: `incidente-${incidente.id}`,
              title: `Incidente: ${incidente.descripcion.substring(0, 20)}${incidente.descripcion.length > 20 ? '...' : ''}`,
              start: new Date(incidente.inicio),
              end: new Date(incidente.fin),
              allDay: false,
              type: 'guardia' as EventType, // Usar el mismo tipo para filtrado
              color: getIncidenteStatusColor(incidente.estado),
              description: incidente.descripcion,
              incidenteId: incidente.id,
              guardiaId: incidente.id_guardia,
              incidenteEstado: incidente.estado,
              isIncidente: true
            }));
          
          incidentes.push(...incidentesEnRango);
        }
      } catch (error) {
        console.error(`Error al obtener incidentes para guardia ${guardia.id}:`, error);
      }
    }
    
    // Combinar y devolver
    return [...eventos, ...guardiasEnRango, ...incidentes];
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