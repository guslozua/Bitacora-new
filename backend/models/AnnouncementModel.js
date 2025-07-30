// =============================================
// MODELO: AnnouncementModel.js
// Sistema completo de gestión de anuncios dinámicos
// =============================================

const db = require('../config/db');

class AnnouncementModel {
  
  // ===============================
  // MÉTODOS PARA OBTENER ANUNCIOS
  // ===============================
  
  /**
   * Obtener todos los anuncios con filtros y paginación
   */
  static async getAllAnnouncements(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        active = null,
        type = null,
        target_audience = null,
        search = null,
        sortBy = 'priority',
        sortOrder = 'DESC'
      } = filters;
      
      let whereClause = '1=1';
      let params = [];
      
      // Filtro por estado activo
      if (active !== null) {
        whereClause += ' AND a.active = ?';
        params.push(active);
      }
      
      // Filtro por tipo
      if (type) {
        whereClause += ' AND a.type = ?';
        params.push(type);
      }
      
      // Filtro por audiencia
      if (target_audience) {
        whereClause += ' AND a.target_audience = ?';
        params.push(target_audience);
      }
      
      // Búsqueda en título y contenido
      if (search) {
        whereClause += ' AND (a.title LIKE ? OR a.content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      // Calcular offset para paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Consulta principal con información del creador
      const query = `
        SELECT 
          a.*,
          u.nombre as created_by_name,
          u.email as created_by_email,
          CASE 
            WHEN a.start_date IS NULL OR a.start_date <= NOW() THEN
              CASE 
                WHEN a.end_date IS NULL OR a.end_date >= NOW() THEN 'vigente'
                ELSE 'expirado'
              END
            ELSE 'programado'
          END as status
        FROM announcements a
        LEFT JOIN usuarios u ON a.created_by = u.id
        WHERE ${whereClause}
        ORDER BY a.${sortBy} ${sortOrder}, a.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      params.push(parseInt(limit), offset);
      
      // Ejecutar consulta principal
      const [announcements] = await db.query(query, params);
      
      // Consulta para total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM announcements a
        WHERE ${whereClause}
      `;
      
      const [countResult] = await db.query(countQuery, params.slice(0, -2));
      const total = countResult[0].total;
      
      return {
        announcements,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasMore: offset + announcements.length < total
        }
      };
    } catch (error) {
      console.error('Error al obtener anuncios:', error);
      throw error;
    }
  }
  
  /**
   * Obtener solo anuncios activos y vigentes (para el carrusel)
   */
  static async getActiveAnnouncements(target_audience = 'all') {
    try {
      const query = `
        SELECT 
          a.*,
          u.nombre as created_by_name
        FROM announcements a
        LEFT JOIN usuarios u ON a.created_by = u.id
        WHERE a.active = 1 
          AND (a.start_date IS NULL OR a.start_date <= NOW())
          AND (a.end_date IS NULL OR a.end_date >= NOW())
          AND (a.target_audience = ? OR a.target_audience = 'all')
        ORDER BY a.priority DESC, a.created_at DESC
      `;
      
      const [announcements] = await db.query(query, [target_audience]);
      
      // Incrementar contador de visualizaciones
      if (announcements.length > 0) {
        const announcementIds = announcements.map(a => a.id);
        await this.incrementViewsCount(announcementIds);
      }
      
      return announcements;
    } catch (error) {
      console.error('Error al obtener anuncios activos:', error);
      throw error;
    }
  }
  
  /**
   * Obtener un anuncio por ID
   */
  static async getAnnouncementById(id) {
    try {
      const query = `
        SELECT 
          a.*,
          u.nombre as created_by_name,
          u.email as created_by_email
        FROM announcements a
        LEFT JOIN usuarios u ON a.created_by = u.id
        WHERE a.id = ?
      `;
      
      const [announcements] = await db.query(query, [id]);
      
      if (announcements.length === 0) {
        return null;
      }
      
      return announcements[0];
    } catch (error) {
      console.error('Error al obtener anuncio por ID:', error);
      throw error;
    }
  }
  
  // ===============================
  // MÉTODOS PARA CREAR/ACTUALIZAR
  // ===============================
  
  /**
   * Crear nuevo anuncio
   */
  static async createAnnouncement(announcementData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        title,
        content,
        type = 'info',
        icon = 'bi bi-info-circle',
        priority = 0,
        active = 1,
        start_date = null,
        end_date = null,
        action_text = null,
        action_url = null,
        target_audience = 'all',
        created_by
      } = announcementData;
      
      // Validaciones básicas
      if (!title || !content || !created_by) {
        throw new Error('Faltan campos requeridos: title, content, created_by');
      }
      
      // Convertir strings vacíos a NULL para fechas
      const processedStartDate = start_date === '' || start_date === null || start_date === undefined ? null : start_date;
      const processedEndDate = end_date === '' || end_date === null || end_date === undefined ? null : end_date;
      
      const query = `
        INSERT INTO announcements (
          title, content, type, icon, priority, active, 
          start_date, end_date, action_text, action_url, 
          target_audience, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.query(query, [
        title, content, type, icon, priority, active,
        processedStartDate, processedEndDate, action_text, action_url,
        target_audience, created_by
      ]);
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear anuncio:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Actualizar anuncio existente
   */
  static async updateAnnouncement(id, announcementData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const {
        title,
        content,
        type,
        icon,
        priority,
        active,
        start_date,
        end_date,
        action_text,
        action_url,
        target_audience
      } = announcementData;
      
      // Convertir strings vacíos a NULL para fechas
      const processedStartDate = start_date === '' || start_date === null || start_date === undefined ? null : start_date;
      const processedEndDate = end_date === '' || end_date === null || end_date === undefined ? null : end_date;
      
      const query = `
        UPDATE announcements SET
          title = ?, content = ?, type = ?, icon = ?, 
          priority = ?, active = ?, start_date = ?, end_date = ?,
          action_text = ?, action_url = ?, target_audience = ?
        WHERE id = ?
      `;
      
      const [result] = await connection.query(query, [
        title, content, type, icon, priority, active,
        processedStartDate, processedEndDate, action_text, action_url,
        target_audience, id
      ]);
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar anuncio:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Eliminar anuncio
   */
  static async deleteAnnouncement(id) {
    try {
      const query = 'DELETE FROM announcements WHERE id = ?';
      const [result] = await db.query(query, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar anuncio:', error);
      throw error;
    }
  }
  
  // ===============================
  // MÉTODOS PARA ESTADÍSTICAS
  // ===============================
  
  /**
   * Incrementar contador de visualizaciones
   */
  static async incrementViewsCount(announcementIds) {
    try {
      if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
        return false;
      }
      
      const placeholders = announcementIds.map(() => '?').join(',');
      const query = `
        UPDATE announcements 
        SET views_count = views_count + 1 
        WHERE id IN (${placeholders})
      `;
      
      const [result] = await db.query(query, announcementIds);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al incrementar visualizaciones:', error);
      throw error;
    }
  }
  
  /**
   * Incrementar contador de clics
   */
  static async incrementClicksCount(id) {
    try {
      const query = 'UPDATE announcements SET clicks_count = clicks_count + 1 WHERE id = ?';
      const [result] = await db.query(query, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al incrementar clics:', error);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas generales
   */
  static async getStatistics() {
    try {
      const query = 'SELECT * FROM v_announcements_stats';
      const [stats] = await db.query(query);
      
      return stats[0] || {
        total_announcements: 0,
        active_announcements: 0,
        inactive_announcements: 0,
        scheduled_announcements: 0,
        expired_announcements: 0,
        total_views: 0,
        total_clicks: 0,
        avg_views_per_announcement: 0,
        last_created_at: null
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas por tipo
   */
  static async getStatsByType() {
    try {
      const query = `
        SELECT 
          type,
          COUNT(*) as total,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
          SUM(views_count) as total_views,
          SUM(clicks_count) as total_clicks,
          AVG(views_count) as avg_views
        FROM announcements
        GROUP BY type
        ORDER BY total DESC
      `;
      
      const [stats] = await db.query(query);
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas por tipo:', error);
      throw error;
    }
  }
  
  // ===============================
  // MÉTODOS PARA GESTIÓN DE ESTADO
  // ===============================
  
  /**
   * Activar/Desactivar anuncio
   */
  static async toggleActiveStatus(id, active) {
    try {
      const query = 'UPDATE announcements SET active = ? WHERE id = ?';
      const [result] = await db.query(query, [active ? 1 : 0, id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al cambiar estado del anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar prioridad de un anuncio
   */
  static async updatePriority(id, priority) {
    try {
      const query = 'UPDATE announcements SET priority = ? WHERE id = ?';
      const [result] = await db.query(query, [priority, id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar prioridad:', error);
      throw error;
    }
  }
  
  /**
   * Obtener anuncios que van a expirar pronto
   */
  static async getExpiringAnnouncements(days = 7) {
    try {
      const query = `
        SELECT 
          a.*,
          u.nombre as created_by_name,
          DATEDIFF(a.end_date, NOW()) as days_until_expiry
        FROM announcements a
        LEFT JOIN usuarios u ON a.created_by = u.id
        WHERE a.active = 1 
          AND a.end_date IS NOT NULL 
          AND a.end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
        ORDER BY a.end_date ASC
      `;
      
      const [announcements] = await db.query(query, [days]);
      return announcements;
    } catch (error) {
      console.error('Error al obtener anuncios próximos a expirar:', error);
      throw error;
    }
  }
  
  // ===============================
  // MÉTODOS UTILITARIOS
  // ===============================
  
  /**
   * Buscar anuncios por texto
   */
  static async searchAnnouncements(searchTerm, limit = 20) {
    try {
      const query = `
        SELECT 
          a.*,
          u.nombre as created_by_name,
          MATCH(a.title, a.content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
        FROM announcements a
        LEFT JOIN usuarios u ON a.created_by = u.id
        WHERE MATCH(a.title, a.content) AGAINST(? IN NATURAL LANGUAGE MODE)
           OR a.title LIKE ? 
           OR a.content LIKE ?
        ORDER BY relevance DESC, a.priority DESC
        LIMIT ?
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const [announcements] = await db.query(query, [
        searchTerm, searchTerm, searchPattern, searchPattern, limit
      ]);
      
      return announcements;
    } catch (error) {
      console.error('Error en búsqueda de anuncios:', error);
      throw error;
    }
  }
  
  /**
   * Duplicar un anuncio
   */
  static async duplicateAnnouncement(id, created_by) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Obtener el anuncio original
      const original = await this.getAnnouncementById(id);
      if (!original) {
        throw new Error('Anuncio no encontrado');
      }
      
      // Crear copia con título modificado
      const duplicateData = {
        title: `${original.title} (Copia)`,
        content: original.content,
        type: original.type,
        icon: original.icon,
        priority: original.priority,
        active: 0, // Crear desactivado por defecto
        start_date: original.start_date,
        end_date: original.end_date,
        action_text: original.action_text,
        action_url: original.action_url,
        target_audience: original.target_audience,
        created_by
      };
      
      const newId = await this.createAnnouncement(duplicateData);
      
      await connection.commit();
      return newId;
    } catch (error) {
      await connection.rollback();
      console.error('Error al duplicar anuncio:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = AnnouncementModel;