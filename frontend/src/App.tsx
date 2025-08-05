import React, { useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { SidebarVisibilityProvider } from './services/SidebarVisibilityContext';
import { ThemeProvider } from './context/ThemeContext'; // 🔥 NUEVO IMPORT
import { DashboardKpiVisibilityProvider } from './services/DashboardKpiVisibilityContext';
import { DashboardSectionVisibilityProvider } from './services/DashboardSectionVisibilityContext'; // 🆕 NUEVO IMPORT PARA KPIs
import { initializeAuth, isAuthenticated } from './services/authService';

// Páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import HitosPage from './pages/HitosPage';
import ItrackerUpload from './pages/ItrackerUpload';
import ItrackerDash from './pages/ItrackerDash';
import TabulacionesUpload from './pages/TabulacionesUpload';
import TabulacionesDash from './pages/TabulacionesDash';
import AbmDashboard from './pages/AbmDashboard';
import AbmUpload from './pages/AbmUpload';
import AdminPanel from './pages/AdminPanel';
import PlacasDash from './pages/PlacasDash';
import Glosario from './pages/Glosario';
import Enlaces from './pages/Enlaces';
import ContactosPage from './pages/ContactosPage';
import Error404 from './pages/Error404';
import SessionAnalysisDashboard from './pages/SessionAnalysisDashboard'; // 📊 ANÁLISIS DE SESIONES
import AternityPage from './pages/AternityPage'; // 📈 MONITOREO ATERNITY

// Importaciones para el calendario
import CalendarPage from './pages/CalendarPage';
import AdminCalendarPage from './pages/AdminCalendarPage';
import EventPage from './pages/EventPage';

// 🚀 NUEVA PÁGINA UNIFICADA DE GESTIÓN DE GUARDIAS
import GestionGuardiasPage from './pages/GestionGuardiasPage';

// 📢 NUEVA PÁGINA DE ADMINISTRACIÓN DE ANUNCIOS
import AnnouncementsAdminPage from './pages/AnnouncementsAdminPage';

// Para que todas las paginas inicien con el scroll al inicio
import ScrollToTop from './components/ScrollToTop';

// Nuevos imports para el panel de administración de usuarios
import AdminUsersDashboard from './pages/AdminUsersDashboard';
import AdminRolesPage from './pages/AdminRolesPage';
import RolePermissionsPage from './pages/RolePermissionsPage';
import AdminPermissionsPage from './pages/AdminPermissionsPage';
import RolePermissionMatrixPage from './pages/RolePermissionMatrixPage';
import UserDetail from './components/users/UserDetail';
import UserForm from './components/users/UserForm';

// 🔔 NUEVO IMPORT PARA NOTIFICACIONES
import NotificacionesList from './components/notificaciones/NotificacionesList';

// 🚀 NUEVO IMPORT PARA DIAGNÓSTICOS
import DiagnosticsPage from './pages/DiagnosticsPage';

// 🔐 NUEVO IMPORT PARA RUTAS PROTEGIDAS CON PERMISOS
import ProtectedRoute from './components/ProtectedRoute';

// 🛠️ IMPORTS PARA EL SISTEMA DE PERMISOS
import { SYSTEM_PERMISSIONS, USER_PERMISSIONS, ROLES } from './utils/permissions';

// Función helper para obtener el userId actual
const getCurrentUserId = (): number => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  return user?.id || 0;
};

// 🎭 COMPONENTE TEMPORAL PARA COMPATIBILIDAD CON RUTAS ANTIGUAS
// Este componente mantiene la funcionalidad anterior para rutas que aún no han sido migradas
interface LegacyProtectedRouteProps {
  element: React.ReactNode;
  path?: string;
  allowedRoles?: string[];
}

const LegacyProtectedRoute: React.FC<LegacyProtectedRouteProps> = ({ element, allowedRoles }) => {
  // Verificar autenticación primero
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  // Si se especifican roles, verificar que el usuario tenga al menos uno de ellos
  if (allowedRoles && allowedRoles.length > 0) {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const hasRequiredRole = user && 
      Array.isArray(user.roles) && 
      user.roles.some((role: string) => allowedRoles.includes(role));
    
    if (!hasRequiredRole) {
      // Mostrar SweetAlert y luego redirigir
      setTimeout(() => {
        Swal.fire({
          icon: 'warning',
          title: 'Acceso Denegado',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>No tienes permisos para acceder al Panel Administrativo</strong></p>
              <br>
              <p>Esta sección está restringida a usuarios con perfiles de:</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>👑 <strong>Administrador</strong></li>
                <li>🔧 <strong>Super Administrador</strong></li>
              </ul>
              <br>
              <p style="color: #666; font-size: 14px;">
                💡 Si consideras que deberías tener acceso, contacta al administrador del sistema.
              </p>
            </div>
          `,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          allowEscapeKey: true,
          allowOutsideClick: true,
          customClass: {
            popup: 'swal2-popup-simple'
          }
        });
      }, 100);
      
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{element}</>;
};

// Hack para solucionar problemas con react-beautiful-dnd en React 18
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: forwardRef render functions') ||
     args[0].includes('Invariant failed: Cannot find') ||
     args[0].includes('Unable to find draggable with id'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

const App: React.FC = () => {
  // Inicializar autenticación al cargar la aplicación
  useEffect(() => {
    initializeAuth();
  }, []);

  // Hook para suprimir errores específicos de ResizeObserver
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message === 'ResizeObserver loop limit exceeded' ||
        event.message.includes('Invariant failed: Cannot find droppable') ||
        event.message.includes('Unable to find draggable with id')
      ) {
        event.stopImmediatePropagation();
      }
    };
    
    window.addEventListener('error', handleError as EventListener);
    
    return () => {
      window.removeEventListener('error', handleError as EventListener);
    };
  }, []);

  return (
    <ThemeProvider> {/* 🔥 WRAPPER DEL THEME PROVIDER */}
      <DashboardKpiVisibilityProvider> {/* 🆕 NUEVO PROVIDER PARA KPIs DEL DASHBOARD */}
        <DashboardSectionVisibilityProvider> {/* 🆕 NUEVO PROVIDER PARA SECCIONES DEL DASHBOARD */}
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <SidebarVisibilityProvider>
            <ScrollToTop />
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<LoginPage />} />
              
              {/* Rutas protegidas con solo autenticación */}
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} authOnly />} />
              <Route path="/projects" element={<ProtectedRoute element={<Projects />} authOnly />} />
              <Route path="/tasks" element={<ProtectedRoute element={<Tasks />} authOnly />} />
              
              {/* 🔔 NUEVA RUTA PARA HITOS */}
              <Route path="/hitos" element={<LegacyProtectedRoute element={<HitosPage />} />} />
              
              <Route path="/itracker" element={<LegacyProtectedRoute element={<ItrackerUpload />} />} />
              <Route path="/itrackerdash" element={<LegacyProtectedRoute element={<ItrackerDash />} />} />
              <Route path="/tabulaciones" element={<LegacyProtectedRoute element={<TabulacionesUpload />} />} />
              <Route path="/tabulacionesdash" element={<LegacyProtectedRoute element={<TabulacionesDash />} />} />
              {/* 🔐 RUTAS DE ADMINISTRACIÓN CON PERMISOS ESPECÍFICOS */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute 
                    element={<AdminPanel />} 
                    permission={SYSTEM_PERMISSIONS.ACCESS_ADMIN_PANEL}
                  />
                } 
              />
              <Route path="/abmdashboard" element={<LegacyProtectedRoute element={<AbmDashboard />} />} />
              <Route path="/abm" element={<LegacyProtectedRoute element={<AbmUpload />} />} />
              <Route path="/placasdash" element={<LegacyProtectedRoute element={<PlacasDash />} />} />
              <Route path="/glosario" element={<LegacyProtectedRoute element={<Glosario />} />} />
              <Route path="/links" element={<LegacyProtectedRoute element={<Enlaces />} />} />
              <Route path="/contactos" element={<LegacyProtectedRoute element={<ContactosPage />} />} />
              
              {/* 🔔 NUEVA RUTA PARA NOTIFICACIONES */}
              <Route 
                path="/notificaciones" 
                element={
                  <LegacyProtectedRoute 
                    element={<NotificacionesList userId={getCurrentUserId()} />} 
                  />
                } 
              />
              
              {/* Rutas del Calendario */}
              <Route path="/calendar" element={<LegacyProtectedRoute element={<CalendarPage />} />} />
              <Route path="/calendar/admin" element={<LegacyProtectedRoute element={<AdminCalendarPage />} />} />
              <Route path="/calendar/event/:id" element={<LegacyProtectedRoute element={<EventPage />} />} />
              
              {/* 🚀 NUEVA RUTA UNIFICADA PARA GESTIÓN DE GUARDIAS */}
              <Route 
                path="/admin/gestion-guardias" 
                element={<LegacyProtectedRoute element={<GestionGuardiasPage />} allowedRoles={['Admin', 'SuperAdmin']} />} 
              />
              
              {/* 📢 NUEVA RUTA PARA ADMINISTRACIÓN DE ANUNCIOS */}
              <Route 
                path="/admin/announcements" 
                element={<LegacyProtectedRoute element={<AnnouncementsAdminPage />} allowedRoles={['Admin', 'SuperAdmin']} />} 
              />
              
              {/* 🔄 RUTAS DE COMPATIBILIDAD (REDIRECCIONES) */}
              <Route 
                path="/admin/guardias" 
                element={<Navigate to="/admin/gestion-guardias?tab=cronograma" replace />} 
              />
              <Route 
                path="/admin/codigos" 
                element={<Navigate to="/admin/gestion-guardias?tab=facturacion" replace />} 
              />
              <Route 
                path="/informes" 
                element={<Navigate to="/admin/gestion-guardias?tab=informes" replace />} 
              />
              
              {/* 📄 RUTAS DE ADMINISTRACIÓN DE USUARIOS CON PERMISOS */}
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute 
                    element={<AdminUsersDashboard />} 
                    permissions={[SYSTEM_PERMISSIONS.CREATE_USER, SYSTEM_PERMISSIONS.EDIT_USER]}
                    requireAllPermissions={false}
                  />
                } 
              />
              <Route 
                path="/admin/roles" 
                element={
                  <ProtectedRoute 
                    element={<AdminRolesPage />} 
                    permission={SYSTEM_PERMISSIONS.MANAGE_ROLES}
                  />
                } 
              />
              <Route 
                path="/admin/roles/:roleId/permissions" 
                element={
                  <ProtectedRoute 
                    element={<RolePermissionsPage />} 
                    permission={SYSTEM_PERMISSIONS.MANAGE_PERMISSIONS}
                  />
                } 
              />
              
              {/* 🔑 RUTAS PARA GESTIÓN DE PERMISOS */}
              <Route 
                path="/admin/permissions" 
                element={
                  <ProtectedRoute 
                    element={<AdminPermissionsPage />} 
                    permission={SYSTEM_PERMISSIONS.MANAGE_PERMISSIONS}
                  />
                } 
              />
              <Route 
                path="/admin/permissions/matrix" 
                element={
                  <ProtectedRoute 
                    element={<RolePermissionMatrixPage />} 
                    permission={SYSTEM_PERMISSIONS.MANAGE_PERMISSIONS}
                  />
                } 
              />
              
              <Route 
                path="/admin/users/new" 
                element={
                  <ProtectedRoute 
                    element={<UserForm />} 
                    permission={SYSTEM_PERMISSIONS.CREATE_USER}
                  />
                } 
              />
              <Route 
                path="/admin/users/:id" 
                element={
                  <ProtectedRoute 
                    element={<UserDetail />} 
                    permissions={[SYSTEM_PERMISSIONS.EDIT_USER, USER_PERMISSIONS.VIEW_USERS]}
                    requireAllPermissions={false}
                  />
                } 
              />
              <Route 
                path="/admin/users/:id/edit" 
                element={
                  <ProtectedRoute 
                    element={<UserForm />} 
                    permission={SYSTEM_PERMISSIONS.EDIT_USER}
                  />
                } 
              />

              {/* 🚀 NUEVA RUTA PARA DIAGNÓSTICOS */}
              <Route 
                path="/admin/diagnostics" 
                element={<LegacyProtectedRoute element={<DiagnosticsPage />} allowedRoles={['Admin', 'SuperAdmin']} />} 
              />
              
              {/* 📊 NUEVA RUTA PARA ANÁLISIS DE SESIONES */}
              <Route 
                path="/session-analysis" 
                element={<LegacyProtectedRoute element={<SessionAnalysisDashboard />} allowedRoles={['Admin', 'SuperAdmin']} />} 
              />
              
              {/* 📈 NUEVA RUTA PARA MONITOREO ATERNITY */}
              <Route 
                path="/aternity" 
                element={<LegacyProtectedRoute element={<AternityPage />} allowedRoles={['Admin', 'SuperAdmin']} />} 
              />
              
              {/* Ruta para errores */}
              <Route path="*" element={<Error404 />} />
            </Routes>
            </SidebarVisibilityProvider>
          </Router>
        </DashboardSectionVisibilityProvider> {/* 🆕 CIERRE DEL NUEVO PROVIDER */}
      </DashboardKpiVisibilityProvider> {/* 🆕 CIERRE DEL NUEVO PROVIDER */}
    </ThemeProvider>
  );
};

export default App;