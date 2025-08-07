// src/utils/permissions.ts

/**
 * Constantes de permisos para uso en la aplicación
 * Estas constantes deben coincidir exactamente con los permisos en la base de datos
 */

// 🛡️ PERMISOS DE SISTEMA
export const SYSTEM_PERMISSIONS = {
  CREATE_USER: 'crear_usuario',
  EDIT_USER: 'editar_usuario', 
  DELETE_USER: 'eliminar_usuario',
  MANAGE_ROLES: 'gestionar_roles',
  MANAGE_PERMISSIONS: 'gestionar_permisos',
  ACCESS_ADMIN_PANEL: 'acceder_panel_admin',
  VIEW_SYSTEM_LOGS: 'ver_logs_sistema'
} as const;

// 🏥 PERMISOS DE GUARDIAS
export const GUARDIA_PERMISSIONS = {
  VIEW_GUARDIAS: 'ver_guardias',
  CREATE_GUARDIA: 'crear_guardia',
  EDIT_GUARDIA: 'editar_guardia',
  DELETE_GUARDIA: 'eliminar_guardia',
  MANAGE_CRONOGRAMA: 'gestionar_cronograma_guardias',
  MANAGE_FACTURACION: 'gestionar_facturacion_guardias',
  VIEW_INFORMES_GUARDIAS: 'ver_informes_guardias'
} as const;

// 📊 PERMISOS DE ITRACKER
export const ITRACKER_PERMISSIONS = {
  VIEW_ITRACKER: 'ver_itracker',
  UPLOAD_ITRACKER: 'subir_itracker',
  MANAGE_ITRACKER_DASHBOARD: 'gestionar_dashboard_itracker',
  DELETE_ITRACKER_DATA: 'eliminar_datos_itracker'
} as const;

// 📋 PERMISOS DE TABULACIONES
export const TABULACION_PERMISSIONS = {
  VIEW_TABULACIONES: 'ver_tabulaciones',
  UPLOAD_TABULACIONES: 'subir_tabulaciones',
  MANAGE_TABULACIONES_DASHBOARD: 'gestionar_dashboard_tabulaciones',
  DELETE_TABULACIONES_DATA: 'eliminar_datos_tabulaciones'
} as const;

// 🎯 PERMISOS DE HITOS
export const HITO_PERMISSIONS = {
  VIEW_HITOS: 'ver_hitos',
  CREATE_HITO: 'crear_hito',
  EDIT_HITO: 'editar_hito',
  DELETE_HITO: 'eliminar_hito',
  CONVERT_PROJECT_TO_HITO: 'convertir_proyecto_a_hito'
} as const;

// 📊 PERMISOS DE ABM
export const ABM_PERMISSIONS = {
  VIEW_ABM: 'ver_abm',
  UPLOAD_ABM: 'subir_abm',
  MANAGE_ABM_DASHBOARD: 'gestionar_dashboard_abm',
  DELETE_ABM_DATA: 'eliminar_datos_abm'
} as const;

// 📅 PERMISOS DE CALENDARIO
export const CALENDAR_PERMISSIONS = {
  VIEW_CALENDAR: 'ver_calendario',
  CREATE_EVENT: 'crear_evento',
  EDIT_EVENT: 'editar_evento',
  DELETE_EVENT: 'eliminar_evento',
  MANAGE_CALENDAR_ADMIN: 'gestionar_calendario_admin'
} as const;

// 🔔 PERMISOS DE NOTIFICACIONES
export const NOTIFICATION_PERMISSIONS = {
  VIEW_NOTIFICATIONS: 'ver_notificaciones',
  SEND_NOTIFICATIONS: 'enviar_notificaciones',
  MANAGE_NOTIFICATIONS: 'gestionar_notificaciones'
} as const;

// 🔧 PERMISOS DE DIAGNÓSTICOS
export const DIAGNOSTICS_PERMISSIONS = {
  VIEW_DIAGNOSTICS: 'ver_diagnosticos',
  RUN_DIAGNOSTICS: 'ejecutar_diagnosticos',
  EXPORT_DIAGNOSTICS: 'exportar_diagnosticos'
} as const;

// 📈 PERMISOS DE ANÁLISIS DE SESIÓN
export const SESSION_ANALYSIS_PERMISSIONS = {
  VIEW_SESSION_ANALYSIS: 'ver_analisis_sesion',
  EXPORT_SESSION_DATA: 'exportar_datos_sesion'
} as const;

// 📈 PERMISOS DE ATERNITY
export const ATERNITY_PERMISSIONS = {
  VIEW_ATERNITY: 'ver_aternity',
  MANAGE_ATERNITY: 'gestionar_aternity'
} as const;

// 📚 PERMISOS DE CONTENIDO (Glosario, Enlaces, Contactos)
export const CONTENT_PERMISSIONS = {
  VIEW_GLOSARIO: 'ver_glosario',
  EDIT_GLOSARIO: 'editar_glosario',
  VIEW_ENLACES: 'ver_enlaces',
  EDIT_ENLACES: 'editar_enlaces',
  VIEW_CONTACTOS: 'ver_contactos',
  EDIT_CONTACTOS: 'editar_contactos'
} as const;

// 📊 PERMISOS DE PROYECTOS
export const PROJECT_PERMISSIONS = {
  CREATE_PROJECT: 'crear_proyecto',
  EDIT_PROJECT: 'editar_proyecto',
  DELETE_PROJECT: 'eliminar_proyecto',
  VIEW_ALL_PROJECTS: 'ver_todos_proyectos',
  ASSIGN_PROJECT_USERS: 'asignar_usuarios_proyecto'
} as const;

// ✅ PERMISOS DE TAREAS
export const TASK_PERMISSIONS = {
  CREATE_TASK: 'crear_tarea',
  EDIT_TASK: 'editar_tarea',
  DELETE_TASK: 'eliminar_tarea',
  VIEW_ALL_TASKS: 'ver_todas_tareas',
  ASSIGN_TASK_USERS: 'asignar_usuarios_tarea'
} as const;

// 📋 PERMISOS DE SUBTAREAS
export const SUBTASK_PERMISSIONS = {
  CREATE_SUBTASK: 'crear_subtarea',
  EDIT_SUBTASK: 'editar_subtarea',
  DELETE_SUBTASK: 'eliminar_subtarea'
} as const;

// 🎫 PERMISOS DE PLACAS
export const PLACA_PERMISSIONS = {
  CREATE_PLACA: 'crear_placa',
  EDIT_PLACA: 'editar_placa',
  DELETE_PLACA: 'eliminar_placa',
  VIEW_ALL_PLACAS: 'ver_todas_placas',
  CLOSE_PLACA: 'cerrar_placas',
  MANAGE_PLACA_SYSTEMS: 'gestionar_sistemas_placas'
} as const;

// 📢 PERMISOS DE ANUNCIOS
export const ANNOUNCEMENT_PERMISSIONS = {
  VIEW_ANNOUNCEMENTS: 'ver_anuncios',
  CREATE_ANNOUNCEMENTS: 'crear_anuncios',
  EDIT_ANNOUNCEMENTS: 'editar_anuncios',
  DELETE_ANNOUNCEMENTS: 'eliminar_anuncios',
  PUBLISH_ANNOUNCEMENTS: 'publicar_anuncios',
  MANAGE_ANNOUNCEMENT_STATS: 'gestionar_estadisticas_anuncios'
} as const;

// 📈 PERMISOS DE INFORMES
export const REPORT_PERMISSIONS = {
  VIEW_REPORTS: 'ver_informes',
  EXPORT_REPORTS: 'exportar_informes',
  GENERATE_STATISTICS: 'generar_estadisticas'
} as const;

// 👥 PERMISOS DE USUARIOS (algunos duplicados con sistema)
export const USER_PERMISSIONS = {
  VIEW_USERS: 'ver_usuarios'
} as const;

// ⚙️ PERMISOS DE CONFIGURACIÓN
export const CONFIG_PERMISSIONS = {
  CONFIGURE_SYSTEM: 'configurar_sistema',
  BACKUP_SYSTEM: 'backup_sistema'
} as const;

// 🌐 PERMISOS GENERALES
export const GENERAL_PERMISSIONS = {
  VIEW_PROJECTS: 'ver_proyectos',
  CREATE_TASKS_GENERAL: 'crear_tareas',
  EDIT_TASKS_GENERAL: 'editar_tareas',
  DELETE_TASKS_GENERAL: 'eliminar_tareas'
} as const;

/**
 * Todos los permisos agrupados por categoría
 */
export const PERMISSIONS_BY_CATEGORY = {
  sistema: SYSTEM_PERMISSIONS,
  proyectos: PROJECT_PERMISSIONS,
  tareas: TASK_PERMISSIONS,
  subtareas: SUBTASK_PERMISSIONS,
  placas: PLACA_PERMISSIONS,
  anuncios: ANNOUNCEMENT_PERMISSIONS,
  informes: REPORT_PERMISSIONS,
  usuarios: USER_PERMISSIONS,
  configuracion: CONFIG_PERMISSIONS,
  general: GENERAL_PERMISSIONS,
  guardias: GUARDIA_PERMISSIONS,
  itracker: ITRACKER_PERMISSIONS,
  tabulaciones: TABULACION_PERMISSIONS,
  hitos: HITO_PERMISSIONS,
  abm: ABM_PERMISSIONS,
  calendario: CALENDAR_PERMISSIONS,
  notificaciones: NOTIFICATION_PERMISSIONS,
  diagnosticos: DIAGNOSTICS_PERMISSIONS,
  analisis_sesion: SESSION_ANALYSIS_PERMISSIONS,
  aternity: ATERNITY_PERMISSIONS,
  contenido: CONTENT_PERMISSIONS
} as const;

/**
 * Array con todos los permisos
 */
export const ALL_PERMISSIONS = [
  ...Object.values(SYSTEM_PERMISSIONS),
  ...Object.values(PROJECT_PERMISSIONS),
  ...Object.values(TASK_PERMISSIONS),
  ...Object.values(SUBTASK_PERMISSIONS),
  ...Object.values(PLACA_PERMISSIONS),
  ...Object.values(ANNOUNCEMENT_PERMISSIONS),
  ...Object.values(REPORT_PERMISSIONS),
  ...Object.values(USER_PERMISSIONS),
  ...Object.values(CONFIG_PERMISSIONS),
  ...Object.values(GENERAL_PERMISSIONS),
  ...Object.values(GUARDIA_PERMISSIONS),
  ...Object.values(ITRACKER_PERMISSIONS),
  ...Object.values(TABULACION_PERMISSIONS),
  ...Object.values(HITO_PERMISSIONS),
  ...Object.values(ABM_PERMISSIONS),
  ...Object.values(CALENDAR_PERMISSIONS),
  ...Object.values(NOTIFICATION_PERMISSIONS),
  ...Object.values(DIAGNOSTICS_PERMISSIONS),
  ...Object.values(SESSION_ANALYSIS_PERMISSIONS),
  ...Object.values(ATERNITY_PERMISSIONS),
  ...Object.values(CONTENT_PERMISSIONS)
] as const;

/**
 * Roles disponibles en el sistema
 */
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  USER: 'User',
  GESTOR_PROYECTOS: 'GestorProyectos',
  OBSERVADOR: 'Observador',
  EDITOR_PRUEBA: 'Editor prueba'
} as const;

/**
 * Permisos agrupados por funcionalidad común
 */
export const PERMISSION_GROUPS = {
  // Gestión de usuarios
  USER_MANAGEMENT: [
    SYSTEM_PERMISSIONS.CREATE_USER,
    SYSTEM_PERMISSIONS.EDIT_USER,
    SYSTEM_PERMISSIONS.DELETE_USER,
    USER_PERMISSIONS.VIEW_USERS
  ],
  
  // Gestión de roles y permisos
  ROLE_MANAGEMENT: [
    SYSTEM_PERMISSIONS.MANAGE_ROLES,
    SYSTEM_PERMISSIONS.MANAGE_PERMISSIONS
  ],
  
  // Gestión de proyectos
  PROJECT_MANAGEMENT: [
    PROJECT_PERMISSIONS.CREATE_PROJECT,
    PROJECT_PERMISSIONS.EDIT_PROJECT,
    PROJECT_PERMISSIONS.DELETE_PROJECT,
    PROJECT_PERMISSIONS.VIEW_ALL_PROJECTS,
    PROJECT_PERMISSIONS.ASSIGN_PROJECT_USERS
  ],
  
  // Gestión de tareas
  TASK_MANAGEMENT: [
    TASK_PERMISSIONS.CREATE_TASK,
    TASK_PERMISSIONS.EDIT_TASK,
    TASK_PERMISSIONS.DELETE_TASK,
    TASK_PERMISSIONS.VIEW_ALL_TASKS,
    TASK_PERMISSIONS.ASSIGN_TASK_USERS
  ],
  
  // Gestión de placas
  PLACA_MANAGEMENT: [
    PLACA_PERMISSIONS.CREATE_PLACA,
    PLACA_PERMISSIONS.EDIT_PLACA,
    PLACA_PERMISSIONS.DELETE_PLACA,
    PLACA_PERMISSIONS.VIEW_ALL_PLACAS,
    PLACA_PERMISSIONS.CLOSE_PLACA,
    PLACA_PERMISSIONS.MANAGE_PLACA_SYSTEMS
  ],
  
  // Gestión de anuncios
  ANNOUNCEMENT_MANAGEMENT: [
    ANNOUNCEMENT_PERMISSIONS.VIEW_ANNOUNCEMENTS,
    ANNOUNCEMENT_PERMISSIONS.CREATE_ANNOUNCEMENTS,
    ANNOUNCEMENT_PERMISSIONS.EDIT_ANNOUNCEMENTS,
    ANNOUNCEMENT_PERMISSIONS.DELETE_ANNOUNCEMENTS,
    ANNOUNCEMENT_PERMISSIONS.PUBLISH_ANNOUNCEMENTS,
    ANNOUNCEMENT_PERMISSIONS.MANAGE_ANNOUNCEMENT_STATS
  ],
  
  // Administración completa
  FULL_ADMIN: [
    SYSTEM_PERMISSIONS.ACCESS_ADMIN_PANEL,
    SYSTEM_PERMISSIONS.VIEW_SYSTEM_LOGS,
    CONFIG_PERMISSIONS.CONFIGURE_SYSTEM,
    CONFIG_PERMISSIONS.BACKUP_SYSTEM
  ],

  // Gestión de guardias
  GUARDIA_MANAGEMENT: [
    GUARDIA_PERMISSIONS.VIEW_GUARDIAS,
    GUARDIA_PERMISSIONS.CREATE_GUARDIA,
    GUARDIA_PERMISSIONS.EDIT_GUARDIA,
    GUARDIA_PERMISSIONS.DELETE_GUARDIA,
    GUARDIA_PERMISSIONS.MANAGE_CRONOGRAMA,
    GUARDIA_PERMISSIONS.MANAGE_FACTURACION
  ],

  // Gestión de herramientas de datos
  DATA_TOOLS_MANAGEMENT: [
    ITRACKER_PERMISSIONS.VIEW_ITRACKER,
    ITRACKER_PERMISSIONS.UPLOAD_ITRACKER,
    TABULACION_PERMISSIONS.VIEW_TABULACIONES,
    TABULACION_PERMISSIONS.UPLOAD_TABULACIONES,
    ABM_PERMISSIONS.VIEW_ABM,
    ABM_PERMISSIONS.UPLOAD_ABM
  ],

  // Gestión de contenido
  CONTENT_MANAGEMENT: [
    CONTENT_PERMISSIONS.VIEW_GLOSARIO,
    CONTENT_PERMISSIONS.EDIT_GLOSARIO,
    CONTENT_PERMISSIONS.VIEW_ENLACES,
    CONTENT_PERMISSIONS.EDIT_ENLACES,
    CONTENT_PERMISSIONS.VIEW_CONTACTOS,
    CONTENT_PERMISSIONS.EDIT_CONTACTOS
  ],

  // Gestión de calendario y eventos
  CALENDAR_MANAGEMENT: [
    CALENDAR_PERMISSIONS.VIEW_CALENDAR,
    CALENDAR_PERMISSIONS.CREATE_EVENT,
    CALENDAR_PERMISSIONS.EDIT_EVENT,
    CALENDAR_PERMISSIONS.DELETE_EVENT
  ]
} as const;

/**
 * Función helper para verificar si un permiso existe
 */
export const isValidPermission = (permission: string): boolean => {
  return ALL_PERMISSIONS.includes(permission as any);
};

/**
 * Función helper para obtener permisos por categoría
 */
export const getPermissionsByCategory = (category: keyof typeof PERMISSIONS_BY_CATEGORY) => {
  return Object.values(PERMISSIONS_BY_CATEGORY[category]);
};

export default {
  SYSTEM_PERMISSIONS,
  PROJECT_PERMISSIONS,
  TASK_PERMISSIONS,
  SUBTASK_PERMISSIONS,
  PLACA_PERMISSIONS,
  ANNOUNCEMENT_PERMISSIONS,
  REPORT_PERMISSIONS,
  USER_PERMISSIONS,
  CONFIG_PERMISSIONS,
  GENERAL_PERMISSIONS,
  GUARDIA_PERMISSIONS,
  ITRACKER_PERMISSIONS,
  TABULACION_PERMISSIONS,
  HITO_PERMISSIONS,
  ABM_PERMISSIONS,
  CALENDAR_PERMISSIONS,
  NOTIFICATION_PERMISSIONS,
  DIAGNOSTICS_PERMISSIONS,
  SESSION_ANALYSIS_PERMISSIONS,
  ATERNITY_PERMISSIONS,
  CONTENT_PERMISSIONS,
  PERMISSIONS_BY_CATEGORY,
  ALL_PERMISSIONS,
  ROLES,
  PERMISSION_GROUPS,
  isValidPermission,
  getPermissionsByCategory
};