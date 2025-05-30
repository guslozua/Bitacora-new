// =============================================
// SERVICIO EXTENDIDO: services/ContactosService.ts
// =============================================

import axios from 'axios';
import { Equipo, Integrante, Sistema, SimulacionRespuesta, ResultadoBusqueda, ContactoHistorial } from '../types/contactos';

const API_BASE_URL = 'http://localhost:5000/api/contactos';

class ContactosService {
  
  // ===============================
  // EQUIPOS TÉCNICOS
  // ===============================
  
  static async fetchEquipos(): Promise<Equipo[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/equipos`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  }

  static async fetchEquipoById(id: number): Promise<Equipo> {
    try {
      const response = await axios.get(`${API_BASE_URL}/equipos/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener equipo:', error);
      throw error;
    }
  }

  static async createEquipo(equipoData: Partial<Equipo>): Promise<number> {
    try {
      const response = await axios.post(`${API_BASE_URL}/equipos`, equipoData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data.id;
    } catch (error) {
      console.error('Error al crear equipo:', error);
      throw error;
    }
  }

  static async updateEquipo(id: number, equipoData: Partial<Equipo>): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/equipos/${id}`, equipoData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      throw error;
    }
  }

  static async deleteEquipo(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/equipos/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      throw error;
    }
  }

  // ===============================
  // INTEGRANTES/CONTACTOS
  // ===============================
  
  static async fetchIntegrantes(): Promise<Integrante[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/integrantes`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener integrantes:', error);
      throw error;
    }
  }

  static async createIntegrante(integranteData: Partial<Integrante>): Promise<number> {
    try {
      const response = await axios.post(`${API_BASE_URL}/integrantes`, integranteData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data.id;
    } catch (error) {
      console.error('Error al crear integrante:', error);
      throw error;
    }
  }

  static async updateIntegrante(id: number, integranteData: Partial<Integrante>): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/integrantes/${id}`, integranteData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al actualizar integrante:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Eliminar integrante/contacto
  static async deleteIntegrante(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/integrantes/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al eliminar integrante:', error);
      throw error;
    }
  }

  // ===============================
  // SISTEMAS
  // ===============================
  
  static async fetchSistemas(): Promise<Sistema[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sistemas`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener sistemas:', error);
      throw error;
    }
  }

  static async createSistema(sistemaData: Partial<Sistema>): Promise<number> {
    try {
      const response = await axios.post(`${API_BASE_URL}/sistemas`, sistemaData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data.id;
    } catch (error) {
      console.error('Error al crear sistema:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Actualizar sistema
  static async updateSistema(id: number, sistemaData: Partial<Sistema>): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/sistemas/${id}`, sistemaData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al actualizar sistema:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Eliminar sistema
  static async deleteSistema(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/sistemas/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al eliminar sistema:', error);
      throw error;
    }
  }

  // ===============================
  // ASIGNACIONES (TODO: Implementar en backend)
  // ===============================

  // ✅ NUEVO: Asignar integrantes a equipo
  static async asignarIntegrantes(equipoId: number, integranteIds: number[]): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/equipos/${equipoId}/integrantes`, {
        integrante_ids: integranteIds
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al asignar integrantes:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Asignar sistemas a equipo
  static async asignarSistemas(equipoId: number, sistemaIds: number[]): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/equipos/${equipoId}/sistemas`, {
        sistema_ids: sistemaIds
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al asignar sistemas:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Asignar equipos a sistema
  static async asignarEquiposASistema(sistemaId: number, equipoIds: number[]): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/sistemas/${sistemaId}/equipos`, {
        equipo_ids: equipoIds
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Error al asignar equipos a sistema:', error);
      throw error;
    }
  }

  // ===============================
  // SIMULADOR DE RESPUESTA
  // ===============================
  
  static async simularRespuesta(sistemaId: number): Promise<{ flujo_escalamiento: any; simulacion: SimulacionRespuesta }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/simulador/${sistemaId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al simular respuesta:', error);
      throw error;
    }
  }

  // ===============================
  // BÚSQUEDA
  // ===============================
  
  static async buscarContactos(termino: string): Promise<ResultadoBusqueda[]> {
    try {
      if (termino.length < 2) return [];
      
      const response = await axios.get(`${API_BASE_URL}/buscar`, {
        params: { q: termino }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error en búsqueda:', error);
      return [];
    }
  }

  // ===============================
  // HISTORIAL DE CONTACTOS
  // ===============================
  
  static async registrarContacto(contactoData: Partial<ContactoHistorial>): Promise<number> {
    try {
      const response = await axios.post(`${API_BASE_URL}/historial`, contactoData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data.id;
    } catch (error) {
      console.error('Error al registrar contacto:', error);
      throw error;
    }
  }

  static async fetchHistorialContactos(sistemaId?: number, equipoId?: number, limit: number = 50): Promise<ContactoHistorial[]> {
    try {
      const params: any = { limit };
      if (sistemaId) params.sistema_id = sistemaId;
      if (equipoId) params.equipo_id = equipoId;
      
      const response = await axios.get(`${API_BASE_URL}/historial`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }

  // ===============================
  // UTILIDADES
  // ===============================
  
  static getColorByCriticidad(criticidad: string): string {
    switch (criticidad) {
      case 'alta': return '#dc3545';
      case 'media': return '#ffc107';
      case 'baja': return '#28a745';
      default: return '#6c757d';
    }
  }

  static getColorByDisponibilidad(disponibilidad: string): string {
    switch (disponibilidad) {
      case 'disponible': return '#28a745';
      case 'ocupado': return '#ffc107';
      case 'inactivo': return '#6c757d';
      default: return '#6c757d';
    }
  }

  static formatearTelefono(telefono?: string): string {
    if (!telefono) return '';
    // Formatear teléfono argentino
    return telefono.replace(/(\+54)\s?(\d{3})\s?(\d{3})-?(\d{4})/, '$1 $2 $3-$4');
  }

  static abrirWhatsApp(numero?: string, mensaje?: string): void {
    if (!numero) return;
    
    // Limpiar número de WhatsApp
    const numeroLimpio = numero.replace(/\D/g, '');
    const mensajeCodificado = encodeURIComponent(mensaje || 'Hola, me comunico por un incidente técnico.');
    
    const url = `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`;
    window.open(url, '_blank');
  }

  static abrirLlamada(numero?: string): void {
    if (!numero) return;
    window.open(`tel:${numero}`, '_self');
  }
}

export default ContactosService;