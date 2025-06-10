import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ThemedFooter from '../components/ThemedFooter'; // 🔥 CAMBIO: Footer temático
import HitosList from '../components/Hitos/HitosList';
import HitosRoadmap from '../components/Hitos/HitosRoadmap'; // Roadmap horizontal
import { useSidebarVisibility } from '../services/SidebarVisibilityContext';
import { useTheme } from '../context/ThemeContext'; // 🔥 AGREGAR IMPORT

const HitosPage: React.FC = () => {
  const { isDarkMode } = useTheme(); // 🔥 AGREGAR HOOK
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<'lista' | 'roadmap'>('lista');
  const { visibility } = useSidebarVisibility();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // 🎨 COLORES DINÁMICOS SEGÚN EL TEMA
  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        // Modo oscuro
        background: '#212529',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        textMuted: '#6c757d',
        tabBackground: '#343a40',
        tabBorder: '#495057',
        tabHover: '#495057',
        tabActive: '#495057',
        tabActiveBorder: '#0d6efd'
      };
    } else {
      return {
        // Modo claro (original)
        background: '#ffffff',
        textPrimary: '#495057',
        textSecondary: '#6c757d',
        textMuted: '#6c757d',
        tabBackground: '#ffffff',
        tabBorder: '#e9ecef',
        tabHover: '#f8f9fa',
        tabActive: '#ffffff',
        tabActiveBorder: '#007bff'
      };
    }
  };

  const themeColors = getThemeColors();

  // Estilos para las pestañas (adaptados al tema)
  const tabStyles = {
    tabContainer: {
      borderBottom: `2px solid ${themeColors.tabBorder}`,
      marginBottom: '20px',
      display: 'flex',
      gap: '0'
    },
    tab: (isActive: boolean) => ({
      padding: '12px 24px',
      background: isActive ? themeColors.tabActive : 'transparent',
      color: isActive ? themeColors.textPrimary : themeColors.textSecondary,
      borderBottom: isActive ? `3px solid ${themeColors.tabActiveBorder}` : '3px solid transparent',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: isActive ? '600' : '400',
      transition: 'all 0.3s ease',
      borderRadius: '8px 8px 0 0',
      position: 'relative' as const,
      transform: isActive ? 'translateY(2px)' : 'translateY(0)',
      boxShadow: isActive ? `0 -2px 10px rgba(${isDarkMode ? '13, 110, 253' : '0, 123, 255'}, 0.1)` : 'none',
      border: 'none'
    }),
    tabContent: {
      minHeight: '500px',
      animation: 'fadeIn 0.3s ease-in-out'
    }
  };

  return (
    <div className="d-flex">
      {/* CSS para animaciones (actualizado) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .tab-button:hover {
          background-color: ${themeColors.tabHover} !important;
          color: ${themeColors.textPrimary} !important;
        }
        
        .tab-content-container {
          animation: fadeIn 0.3s ease-in-out;
        }

        /* Asegurar que el contenedor principal use el tema */
        .hitos-page-container {
          background-color: ${themeColors.background};
          color: ${themeColors.textPrimary};
          transition: background-color 0.3s ease, color 0.3s ease;
        }
      `}</style>

      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggle={toggleSidebar} 
        onLogout={handleLogout}
      />
      
      <div
        className="hitos-page-container"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '250px',
          transition: 'all 0.3s',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: themeColors.background
        }}
      >
        <Container fluid className="py-4 px-4">
          {/* Header adaptado al tema */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0 fw-bold" style={{ color: themeColors.textPrimary }}>
                Gestión de Hitos
              </h2>
              <p className="mb-0" style={{ color: themeColors.textMuted }}>
                Administra y visualiza los hitos de tus proyectos
              </p>
            </div>
          </div>

          {/* Pestañas - Solo Lista y Roadmap */}
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
            ) : (
              <HitosRoadmap />
            )}
          </div>
        </Container>

        <ThemedFooter />
      </div>
    </div>
  );
};

export default HitosPage;