// src/models/Event.ts - Actualización con nuevos tipos de eventos

// Definición del tipo de evento con los nuevos tipos añadidos
export type EventType = 'task' | 'event' | 'holiday' | 'guardia' | 'birthday' | 'dayoff' | 'gconect' | 'vacation';

// Interfaz principal para eventos
export interface Event {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: EventType;  // Usando el tipo EventType actualizado
  color?: string;
  description?: string;
  location?: string;
  completed?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para formularios (sin id)
export interface EventFormData {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: EventType;
  color?: string;
  description?: string;
  location?: string;
  completed?: boolean;
}

// Interfaz para filtrado de eventos
export interface EventFilters {
  tasks: boolean;
  events: boolean;
  holidays: boolean;
  guardias: boolean;
  birthdays: boolean;
  daysoff: boolean;
  gconect: boolean;   // Añadido filtro para Guardia Conectividad
  vacation: boolean;  // Añadido filtro para Vacaciones
  startDate?: Date;
  endDate?: Date;
  searchTerm: string;
}

// Colores recomendados para cada tipo de evento
export const EVENT_COLORS = {
  task: '#0d6efd',     // Azul (Bootstrap primary)
  event: '#198754',    // Verde (Bootstrap success)
  holiday: '#dc3545',  // Rojo (Bootstrap danger)
  guardia: '#9c27b0',  // Púrpura
  birthday: '#ff9800', // Naranja
  dayoff: '#4caf50',   // Verde claro
  gconect: '#00bcd4',  // Azul celeste para Guardia Conectividad
  vacation: '#9e9e9e'  // Gris para Vacaciones
};

// Función utilidad para obtener el texto del tipo de evento en español
export const getEventTypeText = (type: EventType): string => {
  switch (type) {
    case 'task':
      return 'Tarea';
    case 'event':
      return 'Evento';
    case 'holiday':
      return 'Feriado';
    case 'guardia':
      return 'Guardia';
    case 'birthday':
      return 'Cumpleaños';
    case 'dayoff':
      return 'Día a Favor';
    case 'gconect':
      return 'Guardia Conectividad';
    case 'vacation':
      return 'Vacaciones';
    default:
      return type;
  }
};