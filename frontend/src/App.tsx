import React, { useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SidebarVisibilityProvider } from './services/SidebarVisibilityContext';
import { initializeAuth, isAuthenticated } from './services/authService'; // Importar funciones de autenticación

// Páginas
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import ItrackerUpload from './pages/ItrackerUpload';
import ItrackerDash from './pages/ItrackerDash';
import TabulacionesUpload from './pages/TabulacionesUpload';
import TabulacionesDash from './pages/TabulacionesDash';
import AbmDashboard from './pages/AbmDashboard';
import AbmUpload from './pages/AbmUpload';
import AdminPanel from './pages/AdminPanel';
import PlacasDash from './pages/PlacasDash';
import Error404 from './pages/Error404';

// Importaciones para el calendario
import CalendarPage from './pages/CalendarPage';
import AdminCalendarPage from './pages/AdminCalendarPage';
import EventPage from './pages/EventPage';
import AdminGuardiasPage from './pages/AdminGuardiasPage'; // Añadido para guardias

// Nuevos imports para el panel de administración de usuarios
import AdminUsersDashboard from './pages/AdminUsersDashboard';
import UserDetail from './components/users/UserDetail';
import UserForm from './components/users/UserForm';

// Componente para rutas protegidas
interface ProtectedRouteProps {
  element: React.ReactNode;
  path?: string;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRoles }) => {
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
    <Router>
      <SidebarVisibilityProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LoginPage />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/projects" element={<ProtectedRoute element={<Projects />} />} />
          <Route path="/tasks" element={<ProtectedRoute element={<Tasks />} />} />
          <Route path="/itracker" element={<ProtectedRoute element={<ItrackerUpload />} />} />
          <Route path="/itrackerdash" element={<ProtectedRoute element={<ItrackerDash />} />} />
          <Route path="/tabulaciones" element={<ProtectedRoute element={<TabulacionesUpload />} />} />
          <Route path="/tabulacionesdash" element={<ProtectedRoute element={<TabulacionesDash />} />} />
          <Route path="/admin" element={<ProtectedRoute element={<AdminPanel />} />} />
          <Route path="/abmdashboard" element={<ProtectedRoute element={<AbmDashboard />} />} />
          <Route path="/abm" element={<ProtectedRoute element={<AbmUpload />} />} />
          <Route path="/placasdash" element={<ProtectedRoute element={<PlacasDash />} />} />
          
          {/* Rutas del Calendario */}
          <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} />} />
          <Route path="/calendar/admin" element={<ProtectedRoute element={<AdminCalendarPage />} />} />
          <Route path="/calendar/event/:id" element={<ProtectedRoute element={<EventPage />} />} />
          
          {/* Ruta para Guardias */}
          <Route path="/admin/guardias" element={<ProtectedRoute element={<AdminGuardiasPage />} />} />
          
          {/* Rutas de administración de usuarios */}
          <Route 
            path="/admin/users" 
            element={<ProtectedRoute element={<AdminUsersDashboard />} allowedRoles={['Admin', 'SuperAdmin']} />} 
          />
          <Route 
            path="/admin/users/new" 
            element={<ProtectedRoute element={<UserForm />} allowedRoles={['Admin', 'SuperAdmin']} />} 
          />
          <Route 
            path="/admin/users/:id" 
            element={<ProtectedRoute element={<UserDetail />} allowedRoles={['Admin', 'SuperAdmin']} />} 
          />
          <Route 
            path="/admin/users/:id/edit" 
            element={<ProtectedRoute element={<UserForm />} allowedRoles={['Admin', 'SuperAdmin']} />} 
          />
          
          {/* Ruta para errores */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </SidebarVisibilityProvider>
    </Router>
  );
};

export default App;