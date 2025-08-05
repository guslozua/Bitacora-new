// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';
import { usePermissions } from '../hooks/usePermissions';
import AccessDenied from '../pages/AccessDenied';

interface ProtectedRouteProps {
  element: React.ReactElement;
  
  // Verificación por permiso específico
  permission?: string;
  
  // Verificación por múltiples permisos
  permissions?: string[];
  requireAllPermissions?: boolean; // true = requiere TODOS, false = requiere AL MENOS UNO
  
  // Verificación por rol específico
  role?: string;
  
  // Verificación por múltiples roles
  roles?: string[];
  requireAllRoles?: boolean; // true = requiere TODOS los roles, false = requiere AL MENOS UNO
  
  // Componente personalizado para acceso denegado
  accessDeniedComponent?: React.ReactElement;
  
  // Permitir bypass para SuperAdmin
  allowSuperAdmin?: boolean;
  
  // Solo verificar autenticación (comportamiento original)
  authOnly?: boolean;
}

/**
 * Componente para proteger rutas con verificación de autenticación y permisos
 * 
 * Ejemplos de uso:
 * 
 * // Solo autenticación (comportamiento original)
 * <ProtectedRoute element={<Dashboard />} authOnly />
 * 
 * // Por permiso específico
 * <ProtectedRoute 
 *   element={<AdminPanel />} 
 *   permission="acceder_panel_admin" 
 * />
 * 
 * // Por rol específico
 * <ProtectedRoute 
 *   element={<AdminUsers />} 
 *   role="Admin" 
 * />
 * 
 * // Por múltiples permisos (requiere todos)
 * <ProtectedRoute 
 *   element={<ProjectManager />} 
 *   permissions={["crear_proyecto", "editar_proyecto"]} 
 *   requireAllPermissions={true}
 * />
 * 
 * // Por múltiples roles (requiere al menos uno)
 * <ProtectedRoute 
 *   element={<SystemConfig />} 
 *   roles={["Admin", "SuperAdmin"]} 
 *   requireAllRoles={false}
 * />
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  permission,
  permissions,
  requireAllPermissions = true,
  role,
  roles,
  requireAllRoles = false,
  accessDeniedComponent,
  allowSuperAdmin = true,
  authOnly = false
}) => {
  const location = useLocation();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading
  } = usePermissions();

  // 1. Verificar autenticación
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si solo se requiere autenticación, renderizar el elemento
  if (authOnly) {
    return element;
  }

  // 3. Mostrar loading mientras se cargan los permisos
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  // 4. Bypass para SuperAdmin si está habilitado
  if (allowSuperAdmin && hasRole('SuperAdmin')) {
    return element;
  }

  let hasAccess = false;

  // 5. Verificar permisos
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAllPermissions 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // 6. Verificar roles (si no se verificaron permisos o si se especificaron roles)
  if (!hasAccess || (role || roles)) {
    if (role) {
      hasAccess = hasRole(role);
    } else if (roles && roles.length > 0) {
      hasAccess = requireAllRoles 
        ? roles.every(r => hasRole(r))
        : hasAnyRole(roles);
    }
  }

  // 7. Si no se especificó ninguna verificación (ni permisos ni roles), permitir acceso
  if (!permission && !permissions && !role && !roles) {
    hasAccess = true;
  }

  // 8. Renderizar según el resultado
  if (hasAccess) {
    return element;
  } else {
    return accessDeniedComponent || <AccessDenied />;
  }
};

export default ProtectedRoute;