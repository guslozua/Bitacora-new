// src/context/EventContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, EventFilters, EventType } from '../models/Event';
import * as EventService from '../services/EventService';

// Definir la interfaz para el contexto
interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  selectedEvent: Event | null;
  filters: EventFilters;
  fetchAllEvents: () => Promise<void>;
  fetchEventsByType: (type: EventType) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedEvent: (event: Event | null) => void;
  setFilters: (filters: Partial<EventFilters>) => void;
  getFilteredEvents: () => Event[];
  importEvents: (file: File) => Promise<void>;
  exportEvents: (format?: 'csv' | 'json' | 'excel') => Promise<void>;
}

// Crear el contexto
const EventContext = createContext<EventContextType | undefined>(undefined);

// Proveedor del contexto
interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filters, setFiltersState] = useState<EventFilters>({
    tasks: true,
    events: true,
    holidays: true,
    guardias: true, // Añadido filtro para guardias
    searchTerm: ''
  });

  // Cargar eventos al montar el componente
  useEffect(() => {
    fetchAllEvents();
  }, []);

  // Función para obtener todos los eventos
  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Usar fetchAllCalendarItems en lugar de fetchEvents para incluir guardias
      const data = await EventService.fetchAllCalendarItems();
      setEvents(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Obtener eventos por tipo
  const fetchEventsByType = async (type: EventType) => {
    try {
      setLoading(true);
      setError(null);
      const data = await EventService.fetchEventsByType(type);
      setEvents(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Añadir un nuevo evento
  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      await EventService.createEvent(eventData);
      await fetchAllEvents(); // Recargar los eventos
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    } finally {
      setLoading(false);
    }
  };

  // Actualizar un evento existente
  const updateEvent = async (event: Event) => {
    try {
      setLoading(true);
      setError(null);
      await EventService.updateEvent(event);
      await fetchAllEvents(); // Recargar los eventos
      
      // Actualizar el evento seleccionado si es el mismo
      if (selectedEvent && selectedEvent.id === event.id) {
        setSelectedEvent(event);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un evento
  const deleteEvent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await EventService.deleteEvent(id);
      
      // Si el evento eliminado es el seleccionado, resetear
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(null);
      }
      
      // Actualizar la lista de eventos
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar filtros
  const setFilters = (newFilters: Partial<EventFilters>) => {
    setFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  // Obtener eventos filtrados
  const getFilteredEvents = (): Event[] => {
    return events.filter(event => {
      // Filtrar por tipo
      if (
        (event.type === 'task' && !filters.tasks) ||
        (event.type === 'event' && !filters.events) ||
        (event.type === 'holiday' && !filters.holidays) ||
        (event.type === 'guardia' && !filters.guardias) // Añadido filtro para guardias
      ) {
        return false;
      }

      // Filtrar por rango de fechas
      if (filters.startDate && new Date(event.start) < filters.startDate) {
        return false;
      }
      if (filters.endDate && new Date(event.end) > filters.endDate) {
        return false;
      }

      // Filtrar por término de búsqueda
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase();
        return (
          event.title.toLowerCase().includes(term) ||
          (event.description || '').toLowerCase().includes(term) ||
          (event.location || '').toLowerCase().includes(term)
        );
      }

      return true;
    });
  };

  // Importar eventos desde archivo
  const importEvents = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      await EventService.importEvents(file);
      await fetchAllEvents(); // Recargar después de importar
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Exportar eventos a archivo
  const exportEvents = async (format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      setLoading(true);
      setError(null);
      await EventService.exportEvents(format);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Valor del contexto
  const contextValue: EventContextType = {
    events,
    loading,
    error,
    selectedEvent,
    filters,
    fetchAllEvents,
    fetchEventsByType,
    addEvent,
    updateEvent,
    deleteEvent,
    setSelectedEvent,
    setFilters,
    getFilteredEvents,
    importEvents,
    exportEvents
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents debe usarse dentro de un EventProvider');
  }
  return context;
};

export default EventContext;