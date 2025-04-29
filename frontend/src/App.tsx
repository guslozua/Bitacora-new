import React, { useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SidebarVisibilityProvider } from './services/SidebarVisibilityContext'; // 
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
import Error404 from './pages/Error404'; // Importa la página de error

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
  // Hook para suprimir errores específicos de ResizeObserver que pueden ocurrir con react-beautiful-dnd
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
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/itracker" element={<ItrackerUpload />} />
          <Route path="/itrackerdash" element={<ItrackerDash />} />
          <Route path="/tabulaciones" element={<TabulacionesUpload />} />
          <Route path="/tabulacionesdash" element={<TabulacionesDash />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/abmdashboard" element={<AbmDashboard />} />
          <Route path="/abm" element={<AbmUpload />} />
          <Route path="/placasdash" element={<PlacasDash />} />
          <Route path="*" element={<Error404 />} />
        </Routes>
      </SidebarVisibilityProvider>
    </Router>
  );
};

export default App;