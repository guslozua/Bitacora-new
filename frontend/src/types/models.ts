// src/types/models.ts
export interface User {
    id: number;
    nombre: string;
    email: string;
    estado: string;
    imagen_perfil?: string;
    ultimo_acceso?: string | Date;
    roles: string[];
  }
  
  export interface Role {
    id: number;
    nombre: string;
    descripcion?: string;
    is_default?: number;
  }
  
  export interface Permiso {
    id: number;
    nombre: string;
    descripcion?: string;
    categoria?: string;
  }
  
  export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
    pagination?: Pagination;
  }