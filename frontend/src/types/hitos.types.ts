// types/hitos.types.ts
// Tipos centralizados para toda la funcionalidad de Hitos (incluye Timeline)

export interface HitoBase {
  id: number;
  nombre: string;
  descripcion?: string;
  impacto?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  id_proyecto_origen?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface HitoCompleto extends HitoBase {
  proyecto_origen_nombre?: string;
  usuarios?: HitoUsuario[];
  tareas?: HitoTarea[];
}

export interface HitoUsuario {
  id?: number;
  id_hito?: number;
  id_usuario: number;
  nombre: string;
  email: string;
  rol: HitoRol;
  fecha_asignacion?: string;
}

export interface HitoTarea {
  id: number;
  id_hito?: number;
  nombre_tarea: string;
  descripcion?: string;
  estado: TareaEstado;
  fecha_inicio?: string;
  fecha_fin?: string;
  id_tarea_origen?: number;
}

export interface HitoFormData {
  nombre: string;
  descripcion?: string;
  impacto?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  id_proyecto_origen?: number | null;
  usuarios?: Array<{
    id_usuario: number;
    rol: HitoRol;
  }>;
}

export interface HitoFilters {
  nombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
  idProyectoOrigen?: string;
  usuario?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  estado?: string | number; // 🔧 MANTENER: Para filtrar usuarios activos
  roles?: string[];
}

export interface Proyecto {
  id: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

// 🆕 NUEVA INTERFAZ: Para manejar información de hitos existentes
export interface HitoExistente {
  id: number;
  nombre: string;
  id_proyecto_origen: number | null;
  fecha_creacion: string;
}

// 🔧 EXTENDER la interfaz de Proyecto si es necesario
export interface ProyectoConHito extends Proyecto {
  progreso?: number;
  total_tareas?: number;
  tareas_completadas?: number;
  yaEsHito?: boolean; // 🆕 NUEVA: Indica si ya fue convertido a hito
  hitoId?: number; // 🆕 NUEVA: ID del hito asociado si existe
}

// 🆕 NUEVA INTERFAZ: Para la respuesta de verificación de hitos
export interface VerificacionHitosResponse {
  success: boolean;
  data: HitoExistente[];
  proyectosConvertidos: number[];
}

// Enums para tipos específicos
export type HitoRol = 'colaborador' | 'responsable' | 'supervisor';

export type TareaEstado = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export type HitoAccion = 'add' | 'update' | 'remove';

// Interfaces para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  errors?: any[];
}

// 🔧 ACTUALIZAR ConversionData para incluir más campos opcionales
export interface ConversionData {
  impacto?: string;
  descripcion_adicional?: string;
  fecha_conversion?: string;
  notas?: string;
}

// Interfaces para componentes de UI
export interface HitoFormProps {
  show: boolean;
  onHide: () => void;
  onSave: (hitoData: HitoFormData) => void;
  hito?: HitoCompleto | null;
}

// 🔧 ACTUALIZAR ConvertToHitoProps con nuevas opciones de renderizado
export interface ConvertToHitoProps {
  projectId: number;
  projectName: string;
  onConversionComplete?: () => void;
  buttonVariant?: 'outline-warning' | 'warning' | 'outline-primary' | 'primary';
  buttonSize?: 'sm' | 'lg';
  showText?: boolean; // 🆕 NUEVA: Controla si mostrar texto o solo ícono
  className?: string;
}

export interface HitoRowProps {
  hito: HitoCompleto;
  onEdit: (hito: HitoCompleto) => void;
  onDelete: (hito: HitoCompleto) => void;
  onExportPDF: (id: number) => void;
}

// Estados del componente de lista
export interface HitosListState {
  hitos: HitoCompleto[];
  loading: boolean;
  showForm: boolean;
  currentHito: HitoCompleto | null;
  showDeleteModal: boolean;
  hitoToDelete: HitoCompleto | null;
  showFilters: boolean;
  filters: HitoFilters;
  message: {
    type: 'success' | 'danger' | 'warning' | 'info';
    text: string;
  } | null;
}

// Configuración de paginación
export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

// Tipos para estadísticas
export interface HitosStats {
  total: number;
  completados: number;
  en_progreso: number;
  por_mes: Array<{
    mes: string;
    cantidad: number;
  }>;
  por_usuario: Array<{
    usuario: string;
    cantidad: number;
  }>;
}

// =====================================
// TIPOS ESPECÍFICOS PARA TIMELINE
// =====================================

// Hito específico para la línea de tiempo con posiciones calculadas
export interface TimelineHito {
  id: number;
  nombre: string;
  fecha_inicio: Date;
  fecha_fin?: Date;
  descripcion?: string;
  impacto?: string;
  usuarios?: HitoUsuario[];
  tareas?: HitoTarea[];
  proyecto_origen_nombre?: string;
  x: number; // Posición X calculada en la timeline
  y: number; // Posición Y calculada (nivel para evitar solapamiento)
  width: number; // Ancho calculado
  color?: string; // Color asignado
}

// Marcadores de tiempo en la timeline
export interface TimelineMarker {
  position: number;
  label: string;
  isQuarter: boolean;
  date: Date;
}

// Niveles de posicionamiento para evitar solapamiento
export interface TimelineLevel {
  start: number;
  end: number;
  level: number;
  hitoId: number;
}

// Props para el componente Timeline
export interface TimelineProps {
  className?: string;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  onHitoClick?: (hito: TimelineHito) => void;
  showControls?: boolean;
  height?: number;
  animationSpeed?: number;
}

// Estadísticas específicas de timeline
export interface TimelineStats {
  totalHitos: number;
  hitosDeProyectos: number;
  hitosManuales: number;
  nivelMaximo: number;
  duracionPromedio: number; // en días
  mesConMasHitos: string;
}

// Configuración visual de timeline
export interface TimelineConfig {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    background: string;
    axis: string;
    gridLines: string;
    defaultHito: string;
    projectHito: string;
    manualHito: string;
  };
  animation: {
    duration: number;
    staggerDelay: number;
    easing: string;
  };
}

// Eventos de interacción en timeline
export interface TimelineEvent {
  type: 'hover' | 'click' | 'zoom' | 'scroll';
  hito?: TimelineHito;
  position?: { x: number; y: number };
  data?: any;
}

// 🆕 NUEVAS INTERFACES PARA PROYECTO CON INFORMACIÓN DE HITOS
export interface ProyectoCompleto {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: 'activo' | 'completado' | 'pausado' | 'cancelado' | 'finalizado' | 'en progreso';
  fecha_inicio?: string;
  fecha_fin?: string;
  progreso?: number;
  total_tareas?: number;
  tareas_completadas?: number;
  // 🆕 Información relacionada con hitos
  yaEsHito?: boolean;
  hitoId?: number;
  hitoNombre?: string;
  fechaConversion?: string;
}

// 🆕 NUEVA INTERFAZ: Estados de conversión de hito
export interface EstadoConversionHito {
  puedeConvertirse: boolean;
  yaConvertido: boolean;
  razon?: string; // Si no puede convertirse, explica por qué
  hitoExistente?: HitoExistente;
}

// 🆕 NUEVA INTERFAZ: Props extendidas para componentes de proyectos
export interface ProyectoConAccionesProps {
  proyecto: ProyectoCompleto;
  onEdit: (proyecto: ProyectoCompleto) => void;
  onDelete: (proyecto: ProyectoCompleto) => void;
  onView: (proyecto: ProyectoCompleto) => void;
  onConvertToHito?: (proyecto: ProyectoCompleto) => void;
  onUpdateUsers?: (projectId: number) => void;
  estadoConversion?: EstadoConversionHito;
}

// =====================================
// CONSTANTES ÚTILES
// =====================================

export const HITO_ROLES: HitoRol[] = ['colaborador', 'responsable', 'supervisor'];

export const TAREA_ESTADOS: TareaEstado[] = ['pendiente', 'en_progreso', 'completada', 'cancelada'];

export const ESTADO_COLORS = {
  pendiente: 'warning',
  en_progreso: 'info', 
  completada: 'success',
  cancelada: 'danger'
} as const;

export const ROL_COLORS = {
  colaborador: 'primary',
  responsable: 'success',
  supervisor: 'warning'
} as const;

// 🆕 NUEVOS COLORES para estados de conversión de hito
export const CONVERSION_COLORS = {
  canConvert: 'warning',      // Puede convertirse - amarillo
  alreadyConverted: 'success', // Ya convertido - verde
  cannotConvert: 'secondary'   // No puede convertirse - gris
} as const;

// 🆕 NUEVOS ICONOS para estados de conversión
export const CONVERSION_ICONS = {
  canConvert: 'bi-star',         // Estrella vacía
  alreadyConverted: 'bi-star-fill', // Estrella llena
  cannotConvert: 'bi-star',      // Estrella vacía (deshabilitada)
} as const;

// Colores para timeline basados en proyecto origen
export const TIMELINE_COLORS = [
  '#e3f2fd', // Azul claro
  '#f3e5f5', // Púrpura claro
  '#e8f5e8', // Verde claro
  '#fff3e0', // Naranja claro
  '#fce4ec', // Rosa claro
  '#e0f2f1', // Verde agua claro
  '#fff8e1', // Amarillo claro
  '#f1f8e9', // Verde lima claro
  '#ffeaa7', // Dorado claro
  '#fab1a0'  // Salmón claro
] as const;

// Configuración predeterminada para timeline
export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  width: 1000,
  height: 400,
  margin: {
    top: 20,
    right: 40,
    bottom: 40,
    left: 40
  },
  colors: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    axis: 'linear-gradient(90deg, #4a90e2 0%, #50c878 50%, #ff6b6b 100%)',
    gridLines: 'rgba(0,0,0,0.1)',
    defaultHito: '#f5f5f5',
    projectHito: '#e3f2fd',
    manualHito: '#f5f5f5'
  },
  animation: {
    duration: 400,
    staggerDelay: 100,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
};

// Tipo de pestaña en la página de hitos
export type HitoTab = 'lista' | 'timeline' | 'roadmap';

// Props para la página principal de hitos
export interface HitosPageProps {
  defaultTab?: HitoTab;
}