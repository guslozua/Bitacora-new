// src/components/PermissionGate.tsx
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  // Verificación por permiso específico
  permission?: string;
  
  // Verificación por múltiples permisos
  permissions?: string[];
  requireAll?: boolean; // true = requiere TODOS los permisos, false = requiere AL MENOS UNO
  
  // Verificación por rol específico
  role?: string;
  
  // Verificación por múltiples roles
  roles?: string[];
  requireAllRoles?: boolean; // true = requiere TODOS los roles, false = requiere AL MENOS UNO
  
  // Contenido a mostrar cuando el usuario tiene permisos
  children: React.ReactNode;
  
  // Contenido a mostrar cuando el usuario NO tiene permisos (opcional)
  fallback?: React.ReactNode;
  
  // Comportamiento mientras se cargan los permisos
  loadingComponent?: React.ReactNode;
  
  // Mostrar siempre si es SuperAdmin (bypass)
  allowSuperAdmin?: boolean;
}

/**
 * Componente que controla la visibilidad del contenido basado en permisos y roles del usuario
 * 
 * Ejemplos de uso:
 * 
 * // Por permiso específico
 * <PermissionGate permission="crear_usuario">
 *   <Button>Crear Usuario</Button>
 * </PermissionGate>
 * 
 * // Por rol específico
 * <PermissionGate role="Admin">
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * // Por múltiples permisos (requiere todos)
 * <PermissionGate permissions={["crear_proyecto", "editar_proyecto"]} requireAll={true}>
 *   <ProjectManager />
 * </PermissionGate>
 * 
 * // Por múltiples permisos (requiere al menos uno)
 * <PermissionGate permissions={["ver_informes", "exportar_informes"]} requireAll={false}>
 *   <ReportsSection />
 * </PermissionGate>
 * 
 * // Con contenido alternativo
 * <PermissionGate 
 *   permission="administrar_sistema" 
 *   fallback={<p>No tienes permisos para ver esta sección</p>}
 * >
 *   <SystemSettings />
 * </PermissionGate>
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  requireAll = true,
  role,
  roles,
  requireAllRoles = false,
  children,
  fallback = null,
  loadingComponent = null,
  allowSuperAdmin = true
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading
  } = usePermissions();

  // Mostrar componente de carga si está configurado
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // Si está cargando y no hay componente de carga, no mostrar nada
  if (isLoading) {
    return null;
  }

  // Bypass para SuperAdmin si está habilitado
  if (allowSuperAdmin && hasRole('SuperAdmin')) {
    return <>{children}</>;
  }

  let hasAccess = false;

  // 1. Verificar permisos
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // 2. Verificar roles (si no se verificaron permisos o si se especificaron roles)
  if (!hasAccess || (role || roles)) {
    if (role) {
      hasAccess = hasRole(role);
    } else if (roles && roles.length > 0) {
      hasAccess = requireAllRoles 
        ? roles.every(r => hasRole(r))
        : hasAnyRole(roles);
    }
  }

  // 3. Si no se especificó ninguna verificación, permitir acceso
  if (!permission && !permissions && !role && !roles) {
    hasAccess = true;
  }

  // Mostrar contenido según el resultado de la verificación
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;