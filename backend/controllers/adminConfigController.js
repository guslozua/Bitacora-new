// controllers/adminConfigController.js
const AdminConfigModel = require('../models/AdminConfigModel');

const adminConfigController = {
  // GET /api/admin/configurations/:type/:key
  // Obtener configuración efectiva específica
  getEffectiveConfiguration: async (req, res) => {
    try {
      const { type, key } = req.params;
      const userId = req.user?.id || null; // Del middleware de autenticación
      
      console.log(`🔧 AdminConfig: Obteniendo configuración efectiva ${type}/${key} para usuario ${userId}`);
      
      const configuration = await AdminConfigModel.getEffectiveConfig(type, key, userId);
      
      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuración no encontrada',
          data: null
        });
      }
      
      res.json({
        success: true,
        data: configuration,
        source: 'database',
        message: 'Configuración obtenida exitosamente'
      });
    } catch (error) {
      console.error('Error getting effective configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener configuración',
        error: error.message
      });
    }
  },

  // PUT /api/admin/configurations/:type/:key
  // Crear o actualizar configuración específica (upsert)
  upsertConfiguration: async (req, res) => {
    try {
      const { type, key } = req.params;
      const { config_value, description, user_id = null } = req.body;

      if (!config_value) {
        return res.status(400).json({
          success: false,
          message: 'config_value es requerido'
        });
      }

      const createdBy = req.user.id;
      
      console.log(`💾 AdminConfig: Guardando configuración ${type}/${key} por usuario ${createdBy}`, {
        isGlobal: !user_id,
        hasDescription: !!description
      });
      
      const result = await AdminConfigModel.upsertConfig(
        type,
        key,
        config_value,
        user_id,
        createdBy,
        description
      );

      res.json({
        success: true,
        data: { affected: result },
        message: 'Configuración guardada exitosamente'
      });
    } catch (error) {
      console.error('Error upserting configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al guardar configuración',
        error: error.message
      });
    }
  },

  // GET /api/admin/configurations/sidebar/effective
  // Endpoint específico para obtener configuración efectiva del sidebar
  getEffectiveSidebarConfig: async (req, res) => {
    try {
      const userId = req.user?.id || null;
      
      console.log(`🔧 AdminConfig: Obteniendo configuración del sidebar para usuario ${userId}`);
      
      const sidebarConfig = await AdminConfigModel.getEffectiveConfig(
        'sidebar_visibility',
        'default_visibility',
        userId
      );

      // Si no hay configuración, devolver valores por defecto
      const defaultConfig = {
        dashboard: true,
        proyectos: true,
        hitos: true,
        placas: true,
        usuarios: true,
        itracker: true,
        tabulaciones: true,
        sessionanalysis: false, // 🔒 Experimental - oculto por defecto
        aternity: false, // 🔒 Experimental - oculto por defecto
        contactos: true,
        calendar: true,
        messages: true,
        notifications: true,
        links: true,
        glosario: true,
        bitacora: true,
        stats: true,
        reports: true,
        admin: true
      };

      const finalConfig = sidebarConfig || defaultConfig;
      
      res.json({
        success: true,
        data: finalConfig,
        source: sidebarConfig ? 'database' : 'default',
        message: 'Configuración del sidebar obtenida exitosamente'
      });
    } catch (error) {
      console.error('Error getting effective sidebar config:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener configuración del sidebar',
        error: error.message
      });
    }
  },

  // GET /api/admin/configurations/dashboard/effective
  // Endpoint específico para obtener configuración efectiva del dashboard
  getEffectiveDashboardConfig: async (req, res) => {
    try {
      const userId = req.user?.id || null;
      
      console.log(`🔧 AdminConfig: Obteniendo configuración del dashboard para usuario ${userId}`);
      
      const dashboardConfig = await AdminConfigModel.getEffectiveConfig(
        'dashboard_sections',
        'default_sections',
        userId
      );

      res.json({
        success: true,
        data: dashboardConfig,
        source: dashboardConfig ? 'database' : 'default',
        message: 'Configuración del dashboard obtenida exitosamente'
      });
    } catch (error) {
      console.error('Error getting effective dashboard config:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener configuración del dashboard',
        error: error.message
      });
    }
  },

  // GET /api/admin/configurations/kpis/effective
  // Endpoint específico para obtener configuración efectiva de KPIs
  getEffectiveKpiConfig: async (req, res) => {
    try {
      const userId = req.user?.id || null;
      
      console.log(`🔧 AdminConfig: Obteniendo configuración de KPIs para usuario ${userId}`);
      
      const kpiConfig = await AdminConfigModel.getEffectiveConfig(
        'kpi_configs',
        'default_kpis',
        userId
      );

      res.json({
        success: true,
        data: kpiConfig,
        source: kpiConfig ? 'database' : 'default',
        message: 'Configuración de KPIs obtenida exitosamente'
      });
    } catch (error) {
      console.error('Error getting effective KPI config:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener configuración de KPIs',
        error: error.message
      });
    }
  },

  // ============================================================================
  // 🆕 ENDPOINTS SIMPLIFICADOS PARA EL FRONTEND
  // ============================================================================

  // GET /api/admin-config/sidebar
  getSidebarConfig: async (req, res) => {
    try {
      const { global } = req.query;
      const userId = global === 'true' ? null : req.user?.id;
      
      console.log(`🔧 Sidebar: Obteniendo configuración ${global === 'true' ? 'global' : 'usuario ' + userId}`);
      
      const config = await AdminConfigModel.getEffectiveConfig(
        'sidebar_visibility',
        'default_visibility',
        userId
      );

      // Valores por defecto para sidebar
      const defaultSidebarConfig = {
        dashboard: true,
        proyectos: true,
        hitos: true,
        placas: true,
        usuarios: true,
        itracker: true,
        tabulaciones: true,
        sessionanalysis: false, // 🔒 Experimental
        aternity: false, // 🔒 Experimental
        contactos: true,
        calendar: true,
        messages: true,
        notifications: true,
        links: true,
        glosario: true,
        bitacora: true,
        stats: true,
        reports: true,
        admin: true
      };

      res.json({
        success: true,
        data: { config_value: JSON.stringify(config || defaultSidebarConfig) },
        source: config ? 'database' : 'default'
      });
    } catch (error) {
      console.error('Error getting sidebar config:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo configuración del sidebar',
        error: error.message
      });
    }
  },

  // POST /api/admin-config/sidebar
  saveSidebarConfig: async (req, res) => {
    try {
      const { config_value, is_global } = req.body;
      const userId = is_global ? null : req.user.id;
      const createdBy = req.user.id;

      console.log(`💾 Sidebar: Guardando configuración ${is_global ? 'global' : 'usuario ' + userId}`);

      const result = await AdminConfigModel.upsertConfig(
        'sidebar_visibility',
        'default_visibility',
        config_value,
        userId,
        createdBy,
        is_global ? 'Configuración global del sidebar' : 'Configuración personal del sidebar'
      );

      res.json({
        success: true,
        data: { affected: result },
        message: 'Configuración del sidebar guardada exitosamente'
      });
    } catch (error) {
      console.error('Error saving sidebar config:', error);
      res.status(500).json({
        success: false,
        message: 'Error guardando configuración del sidebar',
        error: error.message
      });
    }
  },

  // GET /api/admin-config/dashboard
  getDashboardConfig: async (req, res) => {
    try {
      const { global } = req.query;
      const userId = global === 'true' ? null : req.user?.id;
      
      console.log(`🔧 Dashboard: Obteniendo configuración ${global === 'true' ? 'global' : 'usuario ' + userId}`);
      
      const config = await AdminConfigModel.getEffectiveConfig(
        'dashboard_sections',
        'default_sections',
        userId
      );

      // Valores por defecto para dashboard sections
      const defaultDashboardConfig = [
        {
          id: 'kpis-sistema',
          label: 'KPIs del Sistema',
          description: 'Indicadores clave y métricas del sistema',
          visible: true,
          icon: 'bi-speedometer2',
          order: 1
        },
        {
          id: 'actividad-reciente',
          label: 'Actividad Reciente',
          description: 'Últimas acciones y cambios en el sistema',
          visible: true,
          icon: 'bi-clock-history',
          order: 2
        },
        {
          id: 'calendario',
          label: 'Calendario',
          description: 'Mini calendario con eventos próximos',
          visible: true,
          icon: 'bi-calendar-event',
          order: 3
        },
        {
          id: 'anuncios',
          label: 'Anuncios',
          description: 'Carrusel de anuncios y noticias importantes',
          visible: true,
          icon: 'bi-megaphone',
          order: 4
        },
        {
          id: 'reportes-rapidos',
          label: 'Reportes Rápidos',
          description: 'Gráfico con estadísticas del sistema',
          visible: true,
          icon: 'bi-bar-chart-fill',
          order: 5
        },
        {
          id: 'proximos-eventos',
          label: 'Próximos Eventos',
          description: 'Lista de eventos programados',
          visible: true,
          icon: 'bi-calendar-check',
          order: 6
        },
        {
          id: 'acciones-rapidas',
          label: 'Acciones Rápidas',
          description: 'Botones para crear proyectos, tareas y eventos',
          visible: true,
          icon: 'bi-lightning-charge',
          order: 7
        },
        {
          id: 'resumen-sistema',
          label: 'Resumen del Sistema',
          description: 'Estadísticas generales y métricas del sistema',
          visible: true,
          icon: 'bi-pie-chart-fill',
          order: 8
        },
        {
          id: 'cronograma-proyectos',
          label: 'Cronograma de Proyectos',
          description: 'Vista Gantt con el cronograma de proyectos',
          visible: true,
          icon: 'bi-diagram-3-fill',
          order: 9
        }
      ];

      res.json({
        success: true,
        data: { config_value: JSON.stringify(config || defaultDashboardConfig) },
        source: config ? 'database' : 'default'
      });
    } catch (error) {
      console.error('Error getting dashboard config:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo configuración del dashboard',
        error: error.message
      });
    }
  },

  // POST /api/admin-config/dashboard
  saveDashboardConfig: async (req, res) => {
    try {
      const { config_value, is_global } = req.body;
      const userId = is_global ? null : req.user.id;
      const createdBy = req.user.id;

      console.log(`💾 Dashboard: Guardando configuración ${is_global ? 'global' : 'usuario ' + userId}`);

      const result = await AdminConfigModel.upsertConfig(
        'dashboard_sections',
        'default_sections',
        config_value,
        userId,
        createdBy,
        is_global ? 'Configuración global de secciones del dashboard' : 'Configuración personal de secciones del dashboard'
      );

      res.json({
        success: true,
        data: { affected: result },
        message: 'Configuración del dashboard guardada exitosamente'
      });
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      res.status(500).json({
        success: false,
        message: 'Error guardando configuración del dashboard',
        error: error.message
      });
    }
  },

  // GET /api/admin-config/kpis
  getKpiConfig: async (req, res) => {
    try {
      const { global } = req.query;
      const userId = global === 'true' ? null : req.user?.id;
      
      console.log(`🔧 KPIs: Obteniendo configuración ${global === 'true' ? 'global' : 'usuario ' + userId}`);
      
      const config = await AdminConfigModel.getEffectiveConfig(
        'kpi_configs',
        'default_kpis',
        userId
      );

      // Valores por defecto para KPIs
      const defaultKpiConfig = [
        {
          id: 'proyectos_activos',
          label: 'Proyectos Activos',
          icon: 'bi bi-diagram-3-fill',
          color: 'primary',
          visible: true,
          endpoint: '/api/projects',
          dataKey: 'total_proyectos',
          description: 'Total de proyectos activos en el sistema',
          order: 1
        },
        {
          id: 'tareas_pendientes',
          label: 'Tareas Pendientes',
          icon: 'bi bi-list-task',
          color: 'warning',
          visible: true,
          endpoint: '/api/tasks',
          dataKey: 'tareas_pendientes',
          description: 'Tareas que requieren atención',
          order: 2
        },
        {
          id: 'usuarios_activos',
          label: 'Usuarios Activos',
          icon: 'bi bi-people-fill',
          color: 'success',
          visible: true,
          endpoint: '/api/users',
          dataKey: 'total_usuarios',
          description: 'Usuarios registrados en el sistema',
          order: 3
        },
        {
          id: 'eventos_hoy',
          label: 'Eventos Hoy',
          icon: 'bi bi-calendar-event',
          color: 'info',
          visible: true,
          endpoint: '/api/eventos',
          dataKey: 'eventos_hoy',
          description: 'Eventos programados para hoy',
          order: 4
        },
        {
          id: 'altas_pic',
          label: 'Total Altas PIC',
          icon: 'bi bi-person-plus-fill',
          color: 'primary',
          visible: true,
          endpoint: '/api/abm/stats',
          dataKey: 'total_altas_pic',
          description: 'Total de altas PIC en el año actual',
          order: 5
        },
        {
          id: 'altas_social',
          label: 'Total Altas Social',
          icon: 'bi bi-people-fill',
          color: 'success',
          visible: true,
          endpoint: '/api/abm/stats',
          dataKey: 'total_altas_social',
          description: 'Total de altas Social en el año actual',
          order: 6
        }
      ];

      res.json({
        success: true,
        data: { config_value: JSON.stringify(config || defaultKpiConfig) },
        source: config ? 'database' : 'default'
      });
    } catch (error) {
      console.error('Error getting KPI config:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo configuración de KPIs',
        error: error.message
      });
    }
  },

  // POST /api/admin-config/kpis
  saveKpiConfig: async (req, res) => {
    try {
      const { config_value, is_global } = req.body;
      const userId = is_global ? null : req.user.id;
      const createdBy = req.user.id;

      console.log(`💾 KPIs: Guardando configuración ${is_global ? 'global' : 'usuario ' + userId}`);

      const result = await AdminConfigModel.upsertConfig(
        'kpi_configs',
        'default_kpis',
        config_value,
        userId,
        createdBy,
        is_global ? 'Configuración global de KPIs del dashboard' : 'Configuración personal de KPIs del dashboard'
      );

      res.json({
        success: true,
        data: { affected: result },
        message: 'Configuración de KPIs guardada exitosamente'
      });
    } catch (error) {
      console.error('Error saving KPI config:', error);
      res.status(500).json({
        success: false,
        message: 'Error guardando configuración de KPIs',
        error: error.message
      });
    }
  },

  // ============================================================================
  // MÉTODOS GENERALES (YA EXISTENTES)
  // ============================================================================

  // GET /api/admin/configurations/:type
  // Obtener configuraciones por tipo (solo admins)
  getConfigurationsByType: async (req, res) => {
    try {
      const { type } = req.params;
      const { include_inactive } = req.query;
      
      console.log(`📊 AdminConfig: Obteniendo configuraciones de tipo '${type}'`);
      
      const configurations = await AdminConfigModel.getConfigsByType(
        type, 
        include_inactive === 'true'
      );
      
      res.json({
        success: true,
        data: configurations,
        message: `Configuraciones de tipo '${type}' obtenidas exitosamente`
      });
    } catch (error) {
      console.error('Error getting configurations by type:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener configuraciones',
        error: error.message
      });
    }
  }
};

module.exports = adminConfigController;