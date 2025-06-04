import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import HitosList from '../components/Hitos/HitosList';
import HitosTimeline from '../components/Hitos/HitosTimeline'; // Timeline original
import HitosTimelineVertical from '../components/Hitos/HitosTimelineVertical'; // Nuevo timeline vertical
import HitosRoadmap from '../components/Hitos/HitosRoadmap'; // Roadmap horizontal
import { useSidebarVisibility } from '../services/SidebarVisibilityContext';

const HitosPage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<'lista' | 'timeline' | 'timeline-vertical' | 'roadmap'>('lista');
  const { visibility } = useSidebarVisibility();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Estilos para las pestañas (manteniendo el diseño original)
  const tabStyles = {
    tabContainer: {
      borderBottom: '2px solid #e9ecef',
      marginBottom: '20px',
      display: 'flex',
      gap: '0'
    },
    tab: (isActive: boolean) => ({
      padding: '12px 24px',
      background: isActive ? '#fff' : 'transparent',
      color: isActive ? '#495057' : '#6c757d',
      borderBottom: isActive ? '3px solid #007bff' : '3px solid transparent',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: isActive ? '600' : '400',
      transition: 'all 0.3s ease',
      borderRadius: '8px 8px 0 0',
      position: 'relative' as const,
      transform: isActive ? 'translateY(2px)' : 'translateY(0)',
      boxShadow: isActive ? '0 -2px 10px rgba(0,123,255,0.1)' : 'none',
      border: 'none'
    }),
    tabContent: {
      minHeight: '500px',
      animation: 'fadeIn 0.3s ease-in-out'
    }
  };

  return (
    <div className="d-flex">
      {/* CSS para animaciones (original) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .tab-button:hover {
          background-color: #f8f9fa !important;
          color: #495057 !important;
        }
        
        .tab-content-container {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>

      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggle={toggleSidebar} 
        onLogout={handleLogout}
      />
      
      <div
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '250px',
          transition: 'all 0.3s',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Container fluid className="py-4 px-4">
          {/* Header original */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0 fw-bold">Gestión de Hitos</h2>
              <p className="text-muted mb-0">
                Administra y visualiza los hitos de tus proyectos
              </p>
            </div>
          </div>

          {/* Pestañas (solo agregando la nueva) */}
          <div style={tabStyles.tabContainer}>
            <button
              className="tab-button"
              style={tabStyles.tab(activeTab === 'lista')}
              onClick={() => setActiveTab('lista')}
            >
              📋 Lista de Hitos
            </button>
            <button
              className="tab-button"
              style={tabStyles.tab(activeTab === 'timeline')}
              onClick={() => setActiveTab('timeline')}
            >
              📅 Línea de Tiempo
            </button>
            <button
              className="tab-button"
              style={tabStyles.tab(activeTab === 'timeline-vertical')}
              onClick={() => setActiveTab('timeline-vertical')}
            >
              ⏰ Timeline Vertical
            </button>
            <button
              className="tab-button"
              style={tabStyles.tab(activeTab === 'roadmap')}
              onClick={() => setActiveTab('roadmap')}
            >
              🗺️ Roadmap
            </button>
          </div>

          {/* Contenido de las pestañas */}
          <div style={tabStyles.tabContent} className="tab-content-container">
            {activeTab === 'lista' ? (
              <HitosList />
            ) : activeTab === 'timeline' ? (
              <HitosTimeline />
            ) : activeTab === 'timeline-vertical' ? (
              <HitosTimelineVertical />
            ) : (
              <HitosRoadmap />
            )}
          </div>
        </Container>

        <Footer />
      </div>
    </div>
  );
};

export default HitosPage;