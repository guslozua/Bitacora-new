// =============================================
// TIPOS E INTERFACES: types/contactos.ts
// =============================================

export interface Equipo {
  id: number;
  nombre: string;
  descripcion?: string;
  telefono_guardia?: string;
  email_grupo?: string;
  color: string;
  estado: 'activo' | 'inactivo';
  orden_visualizacion: number;
  total_integrantes: number;
  total_sistemas: number;
  integrantes_disponibles: number;
  integrantes?: Integrante[];
  sistemas?: Sistema[];
  created_at: string;
  updated_at: string;
}

export interface Integrante {
  id: number;
  nombre: string;
  apellido: string;
  rol?: string;
  telefono_personal?: string;
  email?: string;
  whatsapp?: string;
  disponibilidad: 'disponible' | 'ocupado' | 'inactivo';
  es_coordinador: boolean;
  notas?: string;
  equipos_nombres?: string;
  total_equipos?: number;
  es_responsable_principal?: boolean;
  fecha_asignacion?: string;
  created_at: string;
  updated_at: string;
}

export interface Sistema {
  id: number;
  nombre: string;
  descripcion?: string;
  criticidad: 'alta' | 'media' | 'baja';
  categoria?: string;
  estado: 'operativo' | 'mantenimiento' | 'inactivo';
  url_monitoreo?: string;
  documentacion_url?: string;
  orden_visualizacion: number;
  equipos_responsables?: string;
  total_equipos?: number;
  es_responsable_principal?: boolean;
  nivel_responsabilidad?: 'primario' | 'secundario' | 'soporte';
  created_at: string;
  updated_at: string;
}

export interface FlujoEscalamiento {
  id: number;
  sistema_id: number;
  sistema_nombre: string;
  criticidad: 'alta' | 'media' | 'baja';
  equipo_primario_id: number;
  equipo_primario_nombre: string;
  equipo_primario_telefono?: string;
  equipo_primario_color: string;
  equipo_escalamiento_id?: number;
  equipo_escalamiento_nombre?: string;
  equipo_escalamiento_telefono?: string;
  equipo_escalamiento_color?: string;
  condicion_escalamiento?: string;
  tiempo_escalamiento_minutos: number;
  integrantes_primarios: Integrante[];
  integrantes_escalamiento?: Integrante[];
}

export interface SimulacionRespuesta {
  paso1: {
    titulo: string;
    descripcion: string;
    sistema: {
      nombre: string;
      criticidad: string;
    };
  };
  paso2: {
    titulo: string;
    descripcion: string;
  };
  paso3: {
    titulo: string;
    descripcion: string;
    equipo: {
      nombre: string;
      telefono?: string;
      color: string;
      integrantes: Integrante[];
    };
  };
  paso4: {
    titulo: string;
    descripcion: string;
  };
  paso5?: {
    titulo: string;
    descripcion: string;
    condicion: string;
    equipo_escalamiento: {
      nombre: string;
      telefono?: string;
      color: string;
      integrantes: Integrante[];
    };
  };
}

export interface ResultadoBusqueda {
  tipo: 'equipo' | 'integrante' | 'sistema';
  id: number;
  titulo: string;
  descripcion?: string;
  telefono?: string;
  email?: string;
  color: string;
  rol?: string;
}

export interface ContactoHistorial {
  id: number;
  sistema_id: number;
  sistema_nombre: string;
  equipo_contactado_id: number;
  equipo_nombre: string;
  integrante_contactado_id?: number;
  integrante_nombre?: string;
  fecha_incidente: string;
  medio_contacto: 'telefono' | 'whatsapp' | 'email' | 'presencial';
  tiempo_respuesta_minutos?: number;
  resuelto: boolean;
  observaciones?: string;
  created_by?: number;
  created_by_nombre?: string;
  created_at: string;
}