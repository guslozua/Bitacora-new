// src/models/Event.ts - Actualización con nuevos tipos de eventos y propiedades para incidentes

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
  
  // Propiedades adicionales para incidentes
  isIncidente?: boolean;
  incidenteId?: number;
  guardiaId?: number;
  incidenteEstado?: string;
  guardiaUsuario?: string;
  openIncidentesTab?: boolean;
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

// Interfaz para incidentes (para uso en componentes)
export interface Incidente {
  id: number;
  id_guardia: number;
  inicio: string | Date;
  fin: string | Date;
  descripcion: string;
  estado: string;
  observaciones?: string;
  duracion_minutos?: number;
  codigos_aplicados?: any[];
  usuario_guardia?: string; // Añadir esta propiedad
  fecha_guardia?: string | Date; // Añadir esta propiedad
}

// Interfaz para códigos de facturación
export interface CodigoFacturacion {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  dias_aplicables: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  factor_multiplicador: number;
  fecha_vigencia_desde: string | Date;
  fecha_vigencia_hasta?: string | Date | null;
  estado: string;
}

// Interfaz para código aplicado a un incidente
export interface CodigoAplicado {
  id_codigo: number;
  codigo?: string;
  descripcion?: string;
  minutos: number;
  importe: number | null;
  observacion?: string;
}