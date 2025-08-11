// src/pages/GestionIntegralUsuarios.tsx - Sistema Unificado de Gestión de Usuarios
import React, { useState } from 'react';
import { Container, Card, Badge, Button, Alert } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Importar componentes existentes de usuarios
import UsuariosManager from '../components/IntegralUserManagement/UsuariosManager';
import RolesManager from '../components/IntegralUserManagement/RolesManager';
import PermisosManager from '../components/IntegralUserManagement/PermisosManager';
import MatrizPermisosManager from '../components/IntegralUserManagement/MatrizPermisosManager';

const GestionIntegralUsuarios: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Obtener tab activo desde URL o default
  const tabFromUrl = searchParams.get('tab') || 'usuarios';
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colores del tema
  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        background: '#212529',
        cardBackground: '#343a40',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        textMuted: '#6c757d',
        border: '#495057'
      };
    }
    return {
      background: '#f8f9fa',
      cardBackground: '#ffffff',
      textPrimary: '#212529',
      textSecondary: '#495057',
      textMuted: '#6c757d',
      border: '#dee2e6'
    };
  };

  const themeColors = getThemeColors();

  // Actualizar URL cuando cambia el tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    setSearchParams(newSearchParams);
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const contentStyle: React.CSSProperties = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: themeColors.background
  };

  return (
    <div className="d-flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        toggle={toggleSidebar}
        onLogout={handleLogout}
      />

      <div style={contentStyle}>
        <div className="flex-grow-1">
          <Container fluid className="py-4">
            {/* Header principal */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <div className="d-flex align-items-center mb-1">
                  <img
                    src={isDarkMode ? "/logoxside.png" : "/logoxside22.png"}
                    alt="icono"
                    style={{ width: '32px', height: '32px', marginRight: '10px' }}
                  />
                  <h2 className="mb-0 fw-bold" style={{ color: themeColors.textPrimary }}>
                    Gestión Integral de Usuarios
                  </h2>
                </div>
                <p className="mb-0" style={{ color: themeColors.textMuted }}>
                  Usuarios, roles, permisos y configuraciones en un solo lugar
                </p>
              </div>
              <div className="d-flex gap-2">
                <Badge bg="primary" className="fs-6 px-3 py-2">
                  <i className="bi bi-shield-check me-1"></i>
                  Sistema Integrado
                </Badge>
                <Button
                  variant="outline-primary"
                  className="shadow-sm"
                  onClick={() => navigate('/admin')}
                >
                  <i className="bi bi-arrow-left me-1"></i> Volver al Admin Panel
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* 🚀 NAVEGACIÓN PRINCIPAL - ESTILO CARD CON SEPARADORES */}
            <Card 
              className="shadow-sm border-0 mb-4"
              style={{ backgroundColor: themeColors.cardBackground }}
            >
              <Card.Body className="p-0">
                <div className="d-flex">
                  {/* Tab: Usuarios */}
                  <div 
                    className={`flex-fill p-4 cursor-pointer border-end ${activeTab === 'usuarios' ? 'bg-primary text-white' : ''}`}
                    onClick={() => handleTabChange('usuarios')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderTopLeftRadius: '0.375rem',
                      borderBottomLeftRadius: '0.375rem',
                      backgroundColor: activeTab === 'usuarios' ? '#0d6efd' : themeColors.cardBackground,
                      borderColor: themeColors.border
                    }}
                  >
                    <div className="text-center">
                      <i className={`bi bi-people-fill fs-1 ${activeTab === 'usuarios' ? 'text-white' : 'text-primary'} mb-2`}></i>
                      <h5 className={`mb-1 fw-bold ${activeTab === 'usuarios' ? 'text-white' : ''}`} style={{ 
                        color: activeTab === 'usuarios' ? 'white' : themeColors.textPrimary 
                      }}>
                        👥 Usuarios
                      </h5>
                      <small className={activeTab === 'usuarios' ? 'text-white-50' : 'text-muted'}>
                        Gestión de cuentas de usuario
                      </small>
                    </div>
                  </div>

                  {/* Tab: Roles */}
                  <div 
                    className={`flex-fill p-4 cursor-pointer border-end ${activeTab === 'roles' ? 'bg-warning text-white' : ''}`}
                    onClick={() => handleTabChange('roles')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: activeTab === 'roles' ? '#ffc107' : themeColors.cardBackground,
                      borderColor: themeColors.border
                    }}
                  >
                    <div className="text-center">
                      <i className={`bi bi-shield-check fs-1 ${activeTab === 'roles' ? 'text-white' : 'text-warning'} mb-2`}></i>
                      <h5 className={`mb-1 fw-bold ${activeTab === 'roles' ? 'text-white' : ''}`} style={{ 
                        color: activeTab === 'roles' ? 'white' : themeColors.textPrimary 
                      }}>
                        🛡️ Roles
                      </h5>
                      <small className={activeTab === 'roles' ? 'text-white-50' : 'text-muted'}>
                        Definición de roles del sistema
                      </small>
                    </div>
                  </div>

                  {/* Tab: Permisos */}
                  <div 
                    className={`flex-fill p-4 cursor-pointer border-end ${activeTab === 'permisos' ? 'bg-info text-white' : ''}`}
                    onClick={() => handleTabChange('permisos')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: activeTab === 'permisos' ? '#0dcaf0' : themeColors.cardBackground,
                      borderColor: themeColors.border
                    }}
                  >
                    <div className="text-center">
                      <i className={`bi bi-key-fill fs-1 ${activeTab === 'permisos' ? 'text-white' : 'text-info'} mb-2`}></i>
                      <h5 className={`mb-1 fw-bold ${activeTab === 'permisos' ? 'text-white' : ''}`} style={{ 
                        color: activeTab === 'permisos' ? 'white' : themeColors.textPrimary 
                      }}>
                        🔑 Permisos
                      </h5>
                      <small className={activeTab === 'permisos' ? 'text-white-50' : 'text-muted'}>
                        Configuración de permisos
                      </small>
                    </div>
                  </div>

                  {/* Tab: Matriz de Permisos */}
                  <div 
                    className={`flex-fill p-4 cursor-pointer ${activeTab === 'matriz' ? 'bg-success text-white' : ''}`}
                    onClick={() => handleTabChange('matriz')}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderTopRightRadius: '0.375rem',
                      borderBottomRightRadius: '0.375rem',
                      backgroundColor: activeTab === 'matriz' ? '#198754' : themeColors.cardBackground,
                      borderColor: themeColors.border
                    }}
                  >
                    <div className="text-center">
                      <i className={`bi bi-grid-3x3-gap-fill fs-1 ${activeTab === 'matriz' ? 'text-white' : 'text-success'} mb-2`}></i>
                      <h5 className={`mb-1 fw-bold ${activeTab === 'matriz' ? 'text-white' : ''}`} style={{ 
                        color: activeTab === 'matriz' ? 'white' : themeColors.textPrimary 
                      }}>
                        📊 Matriz de Permisos
                      </h5>
                      <small className={activeTab === 'matriz' ? 'text-white-50' : 'text-muted'}>
                        Vista matricial de asignaciones
                      </small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* CONTENIDO DE LAS PESTAÑAS */}
            <div>
              {/* Tab: Gestión de Usuarios */}
              {activeTab === 'usuarios' && (
                <Card 
                  className="shadow-sm border-0 mb-4"
                  style={{ backgroundColor: themeColors.cardBackground }}
                >
                  <Card.Header 
                    className="bg-primary text-white py-3"
                    style={{ borderColor: themeColors.border }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-people-fill fs-4 me-3"></i>
                        <div>
                          <h5 className="mb-0 text-white">Gestión de Usuarios</h5>
                          <small className="text-white-50">Administrar cuentas de usuario del sistema</small>
                        </div>
                      </div>
                      <Badge bg="light" className="text-primary fs-6 px-3 py-2">
                        <i className="bi bi-person-check me-1"></i>
                        Usuarios Activos
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body style={{ color: themeColors.textPrimary }}>
                    <UsuariosManager />
                  </Card.Body>
                </Card>
              )}

              {/* Tab: Gestión de Roles */}
              {activeTab === 'roles' && (
                <Card 
                  className="shadow-sm border-0 mb-4"
                  style={{ backgroundColor: themeColors.cardBackground }}
                >
                  <Card.Header 
                    className="bg-warning text-white py-3"
                    style={{ borderColor: themeColors.border }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-shield-check fs-4 me-3"></i>
                        <div>
                          <h5 className="mb-0 text-white">Gestión de Roles</h5>
                          <small className="text-white-50">Definir y configurar roles del sistema</small>
                        </div>
                      </div>
                      <Badge bg="light" className="text-warning fs-6 px-3 py-2">
                        <i className="bi bi-shield-fill me-1"></i>
                        Roles Configurados
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body style={{ color: themeColors.textPrimary }}>
                    <RolesManager />
                  </Card.Body>
                </Card>
              )}

              {/* Tab: Gestión de Permisos */}
              {activeTab === 'permisos' && (
                <Card 
                  className="shadow-sm border-0 mb-4"
                  style={{ backgroundColor: themeColors.cardBackground }}
                >
                  <Card.Header 
                    className="bg-info text-white py-3"
                    style={{ borderColor: themeColors.border }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-key-fill fs-4 me-3"></i>
                        <div>
                          <h5 className="mb-0 text-white">Gestión de Permisos</h5>
                          <small className="text-white-50">Configurar permisos específicos del sistema</small>
                        </div>
                      </div>
                      <Badge bg="light" className="text-info fs-6 px-3 py-2">
                        <i className="bi bi-key me-1"></i>
                        Permisos Definidos
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body style={{ color: themeColors.textPrimary }}>
                    <PermisosManager />
                  </Card.Body>
                </Card>
              )}

              {/* Tab: Matriz de Permisos */}
              {activeTab === 'matriz' && (
                <Card 
                  className="shadow-sm border-0 mb-4"
                  style={{ backgroundColor: themeColors.cardBackground }}
                >
                  <Card.Header 
                    className="bg-success text-white py-3"
                    style={{ borderColor: themeColors.border }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-grid-3x3-gap-fill fs-4 me-3"></i>
                        <div>
                          <h5 className="mb-0 text-white">Matriz de Permisos</h5>
                          <small className="text-white-50">Vista matricial de roles y permisos asignados</small>
                        </div>
                      </div>
                      <Badge bg="light" className="text-success fs-6 px-3 py-2">
                        <i className="bi bi-grid me-1"></i>
                        Vista Matricial
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body style={{ color: themeColors.textPrimary }}>
                    <MatrizPermisosManager />
                  </Card.Body>
                </Card>
              )}
            </div>
          </Container>
        </div>

        {/* Footer fijo al final */}
        <Footer />
      </div>
    </div>
  );
};

export default GestionIntegralUsuarios;