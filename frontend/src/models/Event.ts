// src/models/Event.ts
export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: 'task' | 'event' | 'holiday' | 'guardia';
  color?: string;
  description?: string;
  location?: string;
  completed?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipos adicionales que pueden ser útiles
export type EventType = 'task' | 'event' | 'holiday' | 'guardia';

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
  guardias: boolean; // Añadido filtro para guardias
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

// Interfaz para respuesta de conflictos
export interface ConflictResponse {
  hasConflicts: boolean;
  conflicts: Event[];
  message: string;
}