// services/NotificacionService.ts
import axios from 'axios';

import { API_BASE_URL } from './apiConfig';
const API_URL = API_BASE_URL;

export interface Notificacion {
  id: number;
  id_usuario: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  referencia_id?: number;
  referencia_tipo?: string;
  leida: boolean;
  fecha_creacion: string;
}

const NotificacionService = {
  // Obtener notificaciones de un usuario con mejor manejo de errores
  obtenerNotificaciones: async (idUsuario: number, soloNoLeidas: boolean = false): Promise<Notificacion[]> => {
    try {
      console.log('🔔 Obteniendo notificaciones para usuario:', idUsuario, 'soloNoLeidas:', soloNoLeidas);
      console.log('🌐 API_URL:', API_URL);
      
      const config = {
        params: { solo_no_leidas: soloNoLeidas },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(`${API_URL}/notificaciones/usuario/${idUsuario}`, config);
      console.log('✅ Respuesta de notificaciones:', response.data);
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ Error al obtener notificaciones:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Response:', error.response?.data);
      
      // Si es 404, devolver array vacío en lugar de lanzar error
      if (error.response?.status === 404) {
        console.warn('Usuario no encontrado o sin notificaciones');
        return [];
      }
      
      // Para otros errores, devolver array vacío también para evitar romper la UI
      console.error('Error en servidor de notificaciones:', error.message);
      return [];
    }
  },

  // Obtener contador de notificaciones no leídas con mejor manejo de errores
  obtenerContadorNoLeidas: async (idUsuario: number): Promise<number> => {
    try {
      console.log('🔢 Obteniendo contador para usuario:', idUsuario);
      
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(`${API_URL}/notificaciones/usuario/${idUsuario}/contador`, config);
      console.log('✅ Respuesta contador:', response.data);
      return response.data.data?.total || 0;
    } catch (error: any) {
      console.error('❌ Error al obtener contador:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Response:', error.response?.data);
      
      // Si es 404, devolver 0 en lugar de lanzar error
      if (error.response?.status === 404) {
        console.warn('Usuario no encontrado o sin notificaciones');
        return 0;
      }
      
      // Para otros errores, devolver 0 también
      return 0;
    }
  },

  // Marcar notificación como leída
  marcarComoLeida: async (idNotificacion: number): Promise<void> => {
    try {
      await axios.patch(`${API_URL}/notificaciones/${idNotificacion}/leida`);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      throw error;
    }
  },

  // Marcar todas como leídas
  marcarTodasComoLeidas: async (idUsuario: number): Promise<void> => {
    try {
      await axios.patch(`${API_URL}/notificaciones/usuario/${idUsuario}/marcar-todas-leidas`);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      throw error;
    }
  },

  // Crear una nueva notificación
  crearNotificacion: async (datos: {
    id_usuario: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    referencia_id?: number;
    referencia_tipo?: string;
  }): Promise<Notificacion> => {
    try {
      const response = await axios.post(`${API_URL}/notificaciones`, datos);
      return response.data.data;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  },

  // Obtener una notificación específica
  obtenerNotificacionPorId: async (id: number): Promise<Notificacion> => {
    try {
      const response = await axios.get(`${API_URL}/notificaciones/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener notificación:', error);
      throw error;
    }
  },

  // Obtener estadísticas básicas con mejor manejo de errores
  obtenerEstadisticas: async (idUsuario: number) => {
    try {
      const todasNotificaciones = await NotificacionService.obtenerNotificaciones(idUsuario, false);
      const noLeidas = await NotificacionService.obtenerContadorNoLeidas(idUsuario);
      
      // Calcular estadísticas por tipo
      const porTipo: Record<string, number> = {};
      todasNotificaciones.forEach(n => {
        porTipo[n.tipo] = (porTipo[n.tipo] || 0) + 1;
      });
      
      return {
        total: todasNotificaciones.length,
        no_leidas: noLeidas,
        por_tipo: porTipo
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      // Devolver estadísticas vacías en caso de error
      return {
        total: 0,
        no_leidas: 0,
        por_tipo: {}
      };
    }
  },

  // Verificar si el endpoint está disponible
  verificarConexion: async (): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_URL}/test`);
      return response.status === 200;
    } catch (error) {
      console.error('Servidor de notificaciones no disponible:', error);
      return false;
    }
  },

  // Configurar notificaciones en tiempo real
  configurarNotificacionesEnTiempoReal: (
    userId: number,
    callback: (notificacion: Notificacion) => void
  ) => {
    // Polling cada 30 segundos para verificar nuevas notificaciones
    let ultimaRevision = new Date();
    
    const verificarNuevas = async () => {
      try {
        const notificaciones = await NotificacionService.obtenerNotificaciones(userId, true);
        
        // Filtrar notificaciones nuevas desde la última revisión
        const nuevas = notificaciones.filter(n => 
          new Date(n.fecha_creacion) > ultimaRevision
        );
        
        if (nuevas.length > 0) {
          nuevas.forEach(callback);
          ultimaRevision = new Date();
        }
      } catch (error) {
        console.error('Error en notificaciones en tiempo real:', error);
      }
    };
    
    // Verificar inmediatamente y luego cada 30 segundos
    verificarNuevas();
    const intervalo = setInterval(verificarNuevas, 30000);
    
    // Retornar función para cancelar
    return () => clearInterval(intervalo);
  },

  // Solicitar permisos para notificaciones push
  solicitarPermisosNotificacion: async (): Promise<boolean> => {
    if ('Notification' in window) {
      try {
        const permiso = await Notification.requestPermission();
        return permiso === 'granted';
      } catch (error) {
        console.error('Error al solicitar permisos:', error);
        return false;
      }
    }
    return false;
  }
};

export default NotificacionService;