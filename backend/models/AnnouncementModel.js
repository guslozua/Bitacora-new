// MODELO COMPLETO Y CORREGIDO para AnnouncementModel
const db = require('../config/db');

class AnnouncementModel {
  
  /**
   * Obtener anuncios activos para el carrusel (FUNCIONANDO)
   */
  static async getActiveAnnouncements(target_audience = 'all') {
    try {
      const query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.type,
          a.icon,
          a.priority,
          a.active,
          a.start_date,
          a.end_date,
          a.action_text,
          a.action_url,
          a.target_audience,
          a.views_count,
          a.clicks_count,
          a.created_by,
          a.created_at,
          a.updated_at,
          u.nombre as created_by_name
        FROM taskmanagementsystem.announcements a
        LEFT JOIN taskmanagementsystem.usuarios u ON a.created_by = u.id
        WHERE a.active = 1 
          AND (a.start_date IS NULL OR a.start_date <= GETDATE())
          AND (a.end_date IS NULL OR a.end_date >= GETDATE())
          AND (a.target_audience = ? OR a.target_audience = 'all')
        ORDER BY a.priority DESC, a.created_at DESC
      `;
      
      const result = await db.query(query, [target_audience]);
      const announcements = result[0] || [];
      
      console.log(`🔍 Query ejecutada para audiencia: ${target_audience}`);
      console.log(`📊 Anuncios encontrados: ${announcements.length}`);
      
      if (announcements.length > 0) {
        try {
          const announcementIds = announcements.map(a => a.id);
          await this.incrementViewsCount(announcementIds);
        } catch (viewError) {
          console.error('⚠️ Error incrementando views:', viewError.message);
        }
      }
      
      return announcements;
    } catch (error) {
      console.error('❌ Error al obtener anuncios activos:', error);
      throw error;
    }
  }
  
  /**
   * Obtener todos los anuncios con filtros (PARA ADMIN)
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
      
      // Filtros
      if (active !== null) {
        whereClause += ' AND a.active = ?';
        params.push(active);
      }
      
      if (type) {
        whereClause += ' AND a.type = ?';
        params.push(type);
      }
      
      if (target_audience) {
        whereClause += ' AND a.target_audience = ?';
        params.push(target_audience);
      }
      
      if (search) {
        whereClause += ' AND (a.title LIKE ? OR a.content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Query principal
      const query = `
        SELECT 
          a.*,
          u.nombre as created_by_name,
          u.email as created_by_email,
          CASE 
            WHEN a.start_date IS NULL OR a.start_date <= GETDATE() THEN
              CASE 
                WHEN a.end_date IS NULL OR a.end_date >= GETDATE() THEN 'vigente'
                ELSE 'expirado'
              END
            ELSE 'programado'
          END as status
        FROM taskmanagementsystem.announcements a
        LEFT JOIN taskmanagementsystem.usuarios u ON a.created_by = u.id
        WHERE ${whereClause}
        ORDER BY a.${sortBy} ${sortOrder}, a.created_at DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
      `;
      
      params.push(offset, parseInt(limit));
      
      const result = await db.query(query, params);
      const announcements = result[0] || [];
      
      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM taskmanagementsystem.announcements a
        WHERE ${whereClause}
      `;
      
      const countParams = params.slice(0, -2); // Sin offset y limit
      const countResult = await db.query(countQuery, countParams);
      const total = countResult[0][0].total;
      
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
      console.error('❌ Error al obtener todos los anuncios:', error);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas generales (PARA ADMIN)
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_announcements,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_announcements,
          SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive_announcements,
          SUM(CASE WHEN active = 1 AND start_date > GETDATE() THEN 1 ELSE 0 END) as scheduled_announcements,
          SUM(CASE WHEN active = 1 AND end_date < GETDATE() THEN 1 ELSE 0 END) as expired_announcements,
          ISNULL(SUM(views_count), 0) as total_views,
          ISNULL(SUM(clicks_count), 0) as total_clicks,
          CASE 
            WHEN COUNT(*) > 0 
            THEN CAST(ISNULL(SUM(views_count), 0) AS FLOAT) / COUNT(*)
            ELSE 0.0 
          END as avg_views_per_announcement,
          MAX(created_at) as last_created_at
        FROM taskmanagementsystem.announcements
      `;
      
      const result = await db.query(query);
      const stats = result[0][0] || {
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
      
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
  
  /**
   * Obtener anuncios próximos a expirar (PARA ADMIN)
   */
  static async getExpiringAnnouncements(days = 7) {
    try {
      const query = `
        SELECT 
          a.*,
          u.nombre as created_by_name,
          DATEDIFF(day, GETDATE(), a.end_date) as days_until_expiry
        FROM taskmanagementsystem.announcements a
        LEFT JOIN taskmanagementsystem.usuarios u ON a.created_by = u.id
        WHERE a.active = 1 
          AND a.end_date IS NOT NULL 
          AND a.end_date BETWEEN GETDATE() AND DATEADD(day, ?, GETDATE())
        ORDER BY a.end_date ASC
      `;
      
      const result = await db.query(query, [days]);
      return result[0] || [];
    } catch (error) {
      console.error('❌ Error al obtener anuncios próximos a expirar:', error);
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
        FROM taskmanagementsystem.announcements a
        LEFT JOIN taskmanagementsystem.usuarios u ON a.created_by = u.id
        WHERE a.id = ?
      `;
      
      const result = await db.query(query, [id]);
      const announcements = result[0] || [];
      
      return announcements.length > 0 ? announcements[0] : null;
    } catch (error) {
      console.error('❌ Error al obtener anuncio por ID:', error);
      throw error;
    }
  }
  
  /**
   * Crear nuevo anuncio
   */
  static async createAnnouncement(announcementData) {
    try {
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
      
      if (!title || !content || !created_by) {
        throw new Error('Faltan campos requeridos: title, content, created_by');
      }
      
      const query = `
        INSERT INTO taskmanagementsystem.announcements (
          title, content, type, icon, priority, active, 
          start_date, end_date, action_text, action_url, 
          target_audience, created_by, created_at, updated_at
        ) 
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
      `;
      
      const result = await db.query(query, [
        title, content, type, icon, priority, active,
        start_date, end_date, action_text, action_url,
        target_audience, created_by
      ]);
      
      return result[0].insertId;
    } catch (error) {
      console.error('❌ Error al crear anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar anuncio existente
   */
  static async updateAnnouncement(id, announcementData) {
    try {
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
      
      const query = `
        UPDATE taskmanagementsystem.announcements SET
          title = ?, content = ?, type = ?, icon = ?,
          priority = ?, active = ?, start_date = ?, end_date = ?,
          action_text = ?, action_url = ?, target_audience = ?,
          updated_at = GETDATE()
        WHERE id = ?
      `;
      
      const result = await db.query(query, [
        title, content, type, icon, priority, active,
        start_date, end_date, action_text, action_url,
        target_audience, id
      ]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al actualizar anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Eliminar anuncio
   */
  static async deleteAnnouncement(id) {
    try {
      const query = 'DELETE FROM taskmanagementsystem.announcements WHERE id = ?';
      const result = await db.query(query, [id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al eliminar anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Activar/Desactivar anuncio
   */
  static async toggleActiveStatus(id, active) {
    try {
      const query = 'UPDATE taskmanagementsystem.announcements SET active = ? WHERE id = ?';
      const result = await db.query(query, [active ? 1 : 0, id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al cambiar estado del anuncio:', error);
      throw error;
    }
  }
  
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
        UPDATE taskmanagementsystem.announcements 
        SET views_count = ISNULL(views_count, 0) + 1 
        WHERE id IN (${placeholders})
      `;
      
      await db.query(query, announcementIds);
      return true;
    } catch (error) {
      console.error('❌ Error al incrementar visualizaciones:', error);
      return false;
    }
  }
  
  /**
   * Incrementar contador de clics
   */
  static async incrementClicksCount(id) {
    try {
      const query = `
        UPDATE taskmanagementsystem.announcements 
        SET clicks_count = ISNULL(clicks_count, 0) + 1 
        WHERE id = ?
      `;
      
      await db.query(query, [id]);
      return true;
    } catch (error) {
      console.error('❌ Error al incrementar clics:', error);
      return false;
    }
  }
  
  /**
   * Crear nuevo anuncio (CORREGIDO - FECHAS)
   */
  static async createAnnouncement(announcementData) {
    try {
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
      
      if (!title || !content || !created_by) {
        throw new Error('Faltan campos requeridos: title, content, created_by');
      }
      
      // Función para procesar fechas correctamente
      const processDate = (dateValue) => {
        if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
          return null;
        }
        
        // Si ya es un objeto Date, convertirlo a ISO string
        if (dateValue instanceof Date) {
          return dateValue.toISOString();
        }
        
        // Si es string, intentar parsearlo
        if (typeof dateValue === 'string') {
          try {
            const parsedDate = new Date(dateValue);
            // Verificar que la fecha es válida
            if (isNaN(parsedDate.getTime())) {
              console.warn(`⚠️ Fecha inválida recibida: ${dateValue}, usando null`);
              return null;
            }
            return parsedDate.toISOString();
          } catch (error) {
            console.warn(`⚠️ Error parseando fecha: ${dateValue}, usando null`);
            return null;
          }
        }
        
        return null;
      };
      
      // Procesar fechas
      const processedStartDate = processDate(start_date);
      const processedEndDate = processDate(end_date);
      
      const query = `
        INSERT INTO taskmanagementsystem.announcements (
          title, content, type, icon, priority, active, 
          start_date, end_date, action_text, action_url, 
          target_audience, created_by, created_at, updated_at
        ) 
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
      `;
      
      const result = await db.query(query, [
        title, content, type, icon, priority, active,
        processedStartDate, processedEndDate, action_text, action_url,
        target_audience, created_by
      ]);
      
      return result[0].insertId;
    } catch (error) {
      console.error('❌ Error al crear anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar anuncio existente (CORREGIDO - FECHAS)
   */
  static async updateAnnouncement(id, announcementData) {
    try {
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
      
      // Función para procesar fechas correctamente
      const processDate = (dateValue) => {
        if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
          return null;
        }
        
        // Si ya es un objeto Date, convertirlo a ISO string
        if (dateValue instanceof Date) {
          return dateValue.toISOString();
        }
        
        // Si es string, intentar parsearlo
        if (typeof dateValue === 'string') {
          try {
            const parsedDate = new Date(dateValue);
            // Verificar que la fecha es válida
            if (isNaN(parsedDate.getTime())) {
              console.warn(`⚠️ Fecha inválida recibida: ${dateValue}, usando null`);
              return null;
            }
            return parsedDate.toISOString();
          } catch (error) {
            console.warn(`⚠️ Error parseando fecha: ${dateValue}, usando null`);
            return null;
          }
        }
        
        return null;
      };
      
      // Procesar fechas
      const processedStartDate = processDate(start_date);
      const processedEndDate = processDate(end_date);
      
      console.log('📝 Fechas procesadas:');
      console.log(`   start_date: ${start_date} → ${processedStartDate}`);
      console.log(`   end_date: ${end_date} → ${processedEndDate}`);
      
      const query = `
        UPDATE taskmanagementsystem.announcements SET
          title = ?, content = ?, type = ?, icon = ?,
          priority = ?, active = ?, start_date = ?, end_date = ?,
          action_text = ?, action_url = ?, target_audience = ?,
          updated_at = GETDATE()
        WHERE id = ?
      `;
      
      const result = await db.query(query, [
        title, content, type, icon, priority, active,
        processedStartDate, processedEndDate, action_text, action_url,
        target_audience, id
      ]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al actualizar anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Eliminar anuncio (AGREGADO)
   */
  static async deleteAnnouncement(id) {
    try {
      const query = 'DELETE FROM taskmanagementsystem.announcements WHERE id = ?';
      const result = await db.query(query, [id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al eliminar anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Activar/Desactivar anuncio (AGREGADO)
   */
  static async toggleActiveStatus(id, active) {
    try {
      const query = 'UPDATE taskmanagementsystem.announcements SET active = ? WHERE id = ?';
      const result = await db.query(query, [active ? 1 : 0, id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al cambiar estado del anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar prioridad (AGREGADO)
   */
  static async updatePriority(id, priority) {
    try {
      const query = 'UPDATE taskmanagementsystem.announcements SET priority = ? WHERE id = ?';
      const result = await db.query(query, [priority, id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('❌ Error al actualizar prioridad:', error);
      throw error;
    }
  }
  
  /**
   * Duplicar anuncio (AGREGADO)
   */
  static async duplicateAnnouncement(id, created_by) {
    try {
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
      return newId;
    } catch (error) {
      console.error('❌ Error al duplicar anuncio:', error);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas por tipo (AGREGADO)
   */
  static async getStatsByType() {
    try {
      const query = `
        SELECT 
          type,
          COUNT(*) as total,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
          ISNULL(SUM(views_count), 0) as total_views,
          ISNULL(SUM(clicks_count), 0) as total_clicks,
          CASE 
            WHEN COUNT(*) > 0 
            THEN CAST(ISNULL(SUM(views_count), 0) AS FLOAT) / COUNT(*)
            ELSE 0.0 
          END as avg_views
        FROM taskmanagementsystem.announcements
        GROUP BY type
        ORDER BY total DESC
      `;
      
      const result = await db.query(query);
      return result[0] || [];
    } catch (error) {
      console.error('❌ Error al obtener estadísticas por tipo:', error);
      throw error;
    }
  }
}

module.exports = AnnouncementModel;
