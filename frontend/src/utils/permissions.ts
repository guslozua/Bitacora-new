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
  informes: REPORT_PERMISSIONS,
  usuarios: USER_PERMISSIONS,
  configuracion: CONFIG_PERMISSIONS,
  general: GENERAL_PERMISSIONS
} as const;

/**
 * Array con todos los permisos
 */
export const ALL_PERMISSIONS = [
  ...Object.values(SYSTEM_PERMISSIONS),
  ...Object.values(PROJECT_PERMISSIONS),
  ...Object.values(TASK_PERMISSIONS),
  ...Object.values(SUBTASK_PERMISSIONS),
  ...Object.values(REPORT_PERMISSIONS),
  ...Object.values(USER_PERMISSIONS),
  ...Object.values(CONFIG_PERMISSIONS),
  ...Object.values(GENERAL_PERMISSIONS)
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
  
  // Administración completa
  FULL_ADMIN: [
    SYSTEM_PERMISSIONS.ACCESS_ADMIN_PANEL,
    SYSTEM_PERMISSIONS.VIEW_SYSTEM_LOGS,
    CONFIG_PERMISSIONS.CONFIGURE_SYSTEM,
    CONFIG_PERMISSIONS.BACKUP_SYSTEM
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
  REPORT_PERMISSIONS,
  USER_PERMISSIONS,
  CONFIG_PERMISSIONS,
  GENERAL_PERMISSIONS,
  PERMISSIONS_BY_CATEGORY,
  ALL_PERMISSIONS,
  ROLES,
  PERMISSION_GROUPS,
  isValidPermission,
  getPermissionsByCategory
};