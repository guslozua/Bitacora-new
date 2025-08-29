// =============================================
// CONTROLADOR: announcementsController.js
// Sistema completo de gestión de anuncios dinámicos
// =============================================

const AnnouncementModel = require('../models/AnnouncementModel');
const { logEvento } = require('../utils/logEvento');

class AnnouncementsController {
  
  // ===============================
  // ENDPOINTS PÚBLICOS (LECTURA)
  // ===============================
  
  /**
   * Obtener anuncios activos para el carrusel del dashboard
   * GET /api/announcements/active
   */
  static async getActiveAnnouncements(req, res) {
    try {
      const { target_audience = 'all' } = req.query;
      
      console.log(`🔍 Obteniendo anuncios activos para audiencia: ${target_audience}`);
      
      const announcements = await AnnouncementModel.getActiveAnnouncements(target_audience);
      
      res.json({
        success: true,
        data: announcements,
        total: announcements.length,
        message: announcements.length === 0 ? 'No hay anuncios activos disponibles' : undefined
      });
    } catch (error) {
      console.error('❌ Error obteniendo anuncios activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener anuncios activos',
        error: error.message
      });
    }
  }
  
  /**
   * Incrementar contador de clics en un anuncio
   * POST /api/announcements/:id/click
   */
  static async incrementClick(req, res) {
    try {
      const { id } = req.params;
      
      const success = await AnnouncementModel.incrementClicksCount(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Anuncio no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Clic registrado correctamente'
      });
    } catch (error) {
      console.error('❌ Error registrando clic:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar clic',
        error: error.message
      });
    }
  }
  
  // ===============================
  // ENDPOINTS ADMINISTRATIVOS (REQUIEREN AUTENTICACIÓN)
  // ===============================
  
  /**
   * Obtener todos los anuncios con filtros y paginación
   * GET /api/announcements
   */
  static async getAllAnnouncements(req, res) {
    try {
      const filters = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        active: req.query.active !== undefined ? parseInt(req.query.active) : null,
        type: req.query.type || null,
        target_audience: req.query.target_audience || null,
        search: req.query.search || null,
        sortBy: req.query.sortBy || 'priority',
        sortOrder: req.query.sortOrder || 'DESC'
      };
      
      console.log('🔍 Filtros aplicados:', filters);
      
      const result = await AnnouncementModel.getAllAnnouncements(filters);
      
      res.json({
        success: true,
        data: result.announcements,
        pagination: result.pagination,
        total: result.pagination.total
      });
    } catch (error) {
      console.error('❌ Error obteniendo todos los anuncios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener anuncios',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener un anuncio por ID
   * GET /api/announcements/:id
   */
  static async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;
      
      const announcement = await AnnouncementModel.getAnnouncementById(id);
      
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Anuncio no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: announcement
      });
    } catch (error) {
      console.error('❌ Error obteniendo anuncio por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener anuncio',
        error: error.message
      });
    }
  }
  
  /**
   * Crear nuevo anuncio
   * POST /api/announcements
   */
  static async createAnnouncement(req, res) {
    try {
      const announcementData = {
        ...req.body,
        created_by: req.user?.id // Del middleware de autenticación
      };
      
      // Validaciones básicas
      if (!announcementData.title || !announcementData.content) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: title y content'
        });
      }
      
      if (!announcementData.created_by) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }
      
      console.log('📝 Creando nuevo anuncio:', {
        title: announcementData.title,
        type: announcementData.type,
        created_by: announcementData.created_by
      });
      
      const announcementId = await AnnouncementModel.createAnnouncement(announcementData);
      
      // Registrar en bitácora
      await logEvento({
        tipo_evento: 'ANNOUNCEMENT_CREATED',
        descripcion: `Nuevo anuncio creado: "${announcementData.title}"`,
        id_usuario: announcementData.created_by,
        nombre_usuario: req.user?.nombre || 'Usuario'
      });
      
      res.status(201).json({
        success: true,
        message: 'Anuncio creado correctamente',
        data: { id: announcementId }
      });
    } catch (error) {
      console.error('❌ Error creando anuncio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear anuncio',
        error: error.message
      });
    }
  }
  
  /**
   * Actualizar anuncio existente
   * PUT /api/announcements/:id
   */
  static async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const announcementData = req.body;
      
      // 🔍 LOGS DE DEBUG
      console.log('🔍 DEBUG - updateAnnouncement called');
      console.log('📝 ID recibido:', id);
      console.log('📝 Datos recibidos:', JSON.stringify(announcementData, null, 2));
      console.log('📝 Tipo de cada campo:');
      Object.keys(announcementData).forEach(key => {
        console.log(`   ${key}: ${typeof announcementData[key]} = ${announcementData[key]}`);
      });
      
      // Verificar que el anuncio existe
      const existingAnnouncement = await AnnouncementModel.getAnnouncementById(id);
      if (!existingAnnouncement) {
        return res.status(404).json({
          success: false,
          message: 'Anuncio no encontrado'
        });
      }
      
      console.log('📝 Anuncio existente encontrado:', existingAnnouncement.title);
      
      console.log('📝 Llamando a AnnouncementModel.updateAnnouncement...');
      const success = await AnnouncementModel.updateAnnouncement(id, announcementData);
      
      console.log('📝 Resultado del modelo:', success);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo actualizar el anuncio'
        });
      }
      
      // Registrar en bitácora
      await logEvento({
        tipo_evento: 'ANNOUNCEMENT_UPDATED',
        descripcion: `Anuncio actualizado: "${announcementData.title || existingAnnouncement.title}"`,
        id_usuario: req.user?.id,
        nombre_usuario: req.user?.nombre || 'Usuario'
      });
      
      console.log('✅ updateAnnouncement exitoso');
      
      res.json({
        success: true,
        message: 'Anuncio actualizado correctamente'
      });
    } catch (error) {
      console.error('❌ Error en updateAnnouncement controller:', error);
      console.error('📝 Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar anuncio',
        error: error.message
      });
    }
  }
  
  /**
   * Eliminar anuncio
   * DELETE /api/announcements/:id
   */
  static async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el anuncio existe antes de eliminar
      const existingAnnouncement = await AnnouncementModel.getAnnouncementById(id);
      if (!existingAnnouncement) {
        return res.status(404).json({
          success: false,
          message: 'Anuncio no encontrado'
        });
      }
      
      console.log('🗑️ Eliminando anuncio:', {
        id,
        title: existingAnnouncement.title
      });
      
      const success = await AnnouncementModel.deleteAnnouncement(id);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo eliminar el anuncio'
        });
      }
      
      // Registrar en bitácora
      await logEvento({
        tipo_evento: 'ANNOUNCEMENT_DELETED',
        descripcion: `Anuncio eliminado: "${existingAnnouncement.title}"`,
        id_usuario: req.user?.id,
        nombre_usuario: req.user?.nombre || 'Usuario'
      });
      
      res.json({
        success: true,
        message: 'Anuncio eliminado correctamente'
      });
    } catch (error) {
      console.error('❌ Error eliminando anuncio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar anuncio',
        error: error.message
      });
    }
  }
  
  // ===============================
  // ENDPOINTS DE GESTIÓN DE ESTADO
  // ===============================
  
  /**
   * Activar/Desactivar anuncio
   * PATCH /api/announcements/:id/toggle
   */
  static async toggleAnnouncementStatus(req, res) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      
      if (typeof active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "active" debe ser un booleano'
        });
      }
      
      const announcement = await AnnouncementModel.getAnnouncementById(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Anuncio no encontrado'
        });
      }
      
      const success = await AnnouncementModel.toggleActiveStatus(id, active);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo cambiar el estado del anuncio'
        });
      }
      
      // Registrar en bitácora
      await logEvento({
        tipo_evento: 'ANNOUNCEMENT_STATUS_CHANGED',
        descripcion: `Anuncio ${active ? 'activado' : 'desactivado'}: "${announcement.title}"`,
        id_usuario: req.user?.id,
        nombre_usuario: req.user?.nombre || 'Usuario'
      });
      
      res.json({
        success: true,
        message: `Anuncio ${active ? 'activado' : 'desactivado'} correctamente`
      });
    } catch (error) {
      console.error('❌ Error cambiando estado del anuncio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del anuncio',
        error: error.message
      });
    }
  }
  
  /**
   * Actualizar prioridad de un anuncio
   * PATCH /api/announcements/:id/priority
   */
  static async updatePriority(req, res) {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      
      if (typeof priority !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'El campo "priority" debe ser un número'
        });
      }
      
      const announcement = await AnnouncementModel.getAnnouncementById(id);
      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Anuncio no encontrado'
        });
      }
      
      const success = await AnnouncementModel.updatePriority(id, priority);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo actualizar la prioridad'
        });
      }
      
      res.json({
        success: true,
        message: 'Prioridad actualizada correctamente'
      });
    } catch (error) {
      console.error('❌ Error actualizando prioridad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar prioridad',
        error: error.message
      });
    }
  }
  
  /**
   * Duplicar un anuncio
   * POST /api/announcements/:id/duplicate
   */
  static async duplicateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const created_by = req.user?.id;
      
      if (!created_by) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }
      
      const newAnnouncementId = await AnnouncementModel.duplicateAnnouncement(id, created_by);
      
      res.status(201).json({
        success: true,
        message: 'Anuncio duplicado correctamente',
        data: { id: newAnnouncementId }
      });
    } catch (error) {
      console.error('❌ Error duplicando anuncio:', error);
      res.status(500).json({
        success: false,
        message: 'Error al duplicar anuncio',
        error: error.message
      });
    }
  }
  
  // ===============================
  // ENDPOINTS DE ESTADÍSTICAS
  // ===============================
  
  /**
   * Obtener estadísticas generales de anuncios
   * GET /api/announcements/stats
   */
  static async getStatistics(req, res) {
    try {
      const stats = await AnnouncementModel.getStatistics();
      const statsByType = await AnnouncementModel.getStatsByType();
      
      res.json({
        success: true,
        data: {
          general: stats,
          byType: statsByType
        }
      });
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener anuncios próximos a expirar
   * GET /api/announcements/expiring
   */
  static async getExpiringAnnouncements(req, res) {
    try {
      const { days = 7 } = req.query;
      
      const announcements = await AnnouncementModel.getExpiringAnnouncements(parseInt(days));
      
      res.json({
        success: true,
        data: announcements,
        total: announcements.length,
        message: announcements.length === 0 ? 'No hay anuncios próximos a expirar' : undefined
      });
    } catch (error) {
      console.error('❌ Error obteniendo anuncios próximos a expirar:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener anuncios próximos a expirar',
        error: error.message
      });
    }
  }
  
  // ===============================
  // ENDPOINTS DE BÚSQUEDA
  // ===============================
  
  /**
   * Buscar anuncios por texto
   * GET /api/announcements/search
   */
  static async searchAnnouncements(req, res) {
    try {
      const { q: searchTerm, limit = 20 } = req.query;
      
      if (!searchTerm || searchTerm.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }
      
      const announcements = await AnnouncementModel.searchAnnouncements(searchTerm, parseInt(limit));
      
      res.json({
        success: true,
        data: announcements,
        total: announcements.length,
        searchTerm
      });
    } catch (error) {
      console.error('❌ Error en búsqueda de anuncios:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la búsqueda',
        error: error.message
      });
    }
  }
  
  // ===============================
  // ENDPOINTS UTILITARIOS
  // ===============================
  
  /**
   * Verificar estado de salud del módulo
   * GET /api/announcements/health
   */
  static async healthCheck(req, res) {
    try {
      const stats = await AnnouncementModel.getStatistics();
      
      res.json({
        success: true,
        message: 'Módulo de anuncios funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          total_announcements: stats.total_announcements,
          active_announcements: stats.active_announcements
        }
      });
    } catch (error) {
      console.error('❌ Error en health check:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el módulo de anuncios',
        error: error.message
      });
    }
  }
}

module.exports = AnnouncementsController;