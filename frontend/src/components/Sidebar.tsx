import React, { useEffect, useRef, useState } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSidebarVisibility } from '../services/SidebarVisibilityContext'; 

interface SidebarProps {
  collapsed: boolean;
  toggle: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggle, onLogout }) => {
  const navigate = useNavigate();
  const logoRef = useRef<HTMLImageElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { visibility } = useSidebarVisibility(); // Usar el contexto
  
  // Estado para controlar la posición de scroll
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    if (!collapsed) return;

    const interval = setInterval(() => {
      if (logoRef.current) {
        logoRef.current.classList.add('animate__animated', 'animate__jello');
        setTimeout(() => {
          logoRef.current?.classList.remove('animate__animated', 'animate__jello');
        }, 1000);
      }
    }, Math.floor(Math.random() * 10000) + 10000);

    return () => clearInterval(interval);
  }, [collapsed]);

  // Verificar si se necesitan los botones de scroll
  useEffect(() => {
    const checkScrollNeeded = () => {
      if (menuRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = menuRef.current;
        setShowScrollButtons(scrollHeight > clientHeight);
        setCanScrollUp(scrollTop > 0);
        setCanScrollDown(scrollTop + clientHeight < scrollHeight);
      }
    };
    
    checkScrollNeeded();
    
    // Agregar un listener para verificar cada vez que cambia el tamaño
    window.addEventListener('resize', checkScrollNeeded);
    
    // Verificar también cuando cambia el estado de colapsado
    return () => window.removeEventListener('resize', checkScrollNeeded);
  }, [collapsed]);

  // Actualizar estados de flechas cuando cambia la posición de scroll
  const updateScrollState = () => {
    if (menuRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = menuRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight);
      setScrollPosition(scrollTop);
    }
  };

  // Manejar el scroll hacia arriba/abajo
  const handleScroll = (direction: 'up' | 'down') => {
    if (menuRef.current) {
      const scrollAmount = 100; // Cantidad de píxeles para desplazar
      const newPosition = direction === 'up' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
        
      menuRef.current.scrollTop = newPosition;
      setScrollPosition(newPosition);
      updateScrollState();
    }
  };

  const sidebarStyle: React.CSSProperties = {
    minHeight: '100vh',
    height: '100vh',
    width: collapsed ? '80px' : '250px',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    transition: 'all 0.3s',
    backgroundColor: '#343a40',
    color: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
  };

  const getMenuItemStyle = (): React.CSSProperties => ({
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '2px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  });

  const iconStyle: React.CSSProperties = {
    fontSize: '1.3rem',
    marginRight: collapsed ? '0' : '10px',
  };

  const scrollButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 0',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '0',
    transition: 'background-color 0.2s',
  };

  const disabledScrollButtonStyle: React.CSSProperties = {
    ...scrollButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const menuItems = [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard', route: '/dashboard' },
    { id: 'proyectos', icon: 'bi-diagram-3-fill', label: 'Proyectos', route: '/projects' },
    { id: 'tareas', icon: 'bi-list-task', label: 'Tareas', route: '/tasks' },
    { id: 'usuarios', icon: 'bi-people-fill', label: 'ABM Usuarios', route: '/users' },
    { id: 'bitacora', icon: 'bi-journal-text', label: 'Bitácora', route: '/bitacora' },
    { id: 'hitos', icon: 'bi-flag-fill', label: 'Hitos', route: '/hitos' },
    { id: 'itracker', icon: 'bi-crosshair2', label: 'iTracker', route: '/itrackerdash' },
    { id: 'tabulaciones', icon: 'bi-arrow-90deg-right', label: 'Tabulaciones', route: '/tabulacionesdash' },
    { id: 'incidencias', icon: 'bi-shield-exclamation', label: 'Inc. en Guardia', route: '/incidencias' },
    { id: 'stats', icon: 'bi-graph-up', label: 'Estadísticas', route: '/stats' },
    { id: 'admin', icon: 'bi-gear-fill', label: 'Configuración', route: '/admin' },
    { id: 'reports', icon: 'bi-file-earmark-text', label: 'Informes', route: '/reports' },
    { id: 'calendar', icon: 'bi-calendar-event', label: 'Calendario', route: '/calendar' },
    { id: 'messages', icon: 'bi-chat-dots-fill', label: 'Mensajes', route: '/messages' },
    { id: 'notifications', icon: 'bi-bell-fill', label: 'Notificaciones', route: '/notifications' },
  ];

  return (
    <div style={sidebarStyle}>
      {/* Header / Logo */}
      <div
        className="p-3 d-flex justify-content-between align-items-center"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
      >
        {!collapsed ? (
          <div className="d-flex align-items-center">
            <img
              src="/logoxside.png"
              alt="Logo"
              style={{ width: '40px', height: '40px', marginRight: '10px' }}
            />
            <h6 className="mb-0">TASK manager</h6>
          </div>
        ) : (
          <img
            ref={logoRef}
            src="/logoxside.png"
            alt="Logo"
            style={{ width: '40px', height: '40px', margin: '0 auto' }}
          />
        )}
        <Button
          variant="link"
          className="text-white p-0"
          onClick={toggle}
          style={{ marginLeft: collapsed ? '0' : 'auto' }}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
        </Button>
      </div>

      {/* Contenedor principal */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100% - 70px)',
          overflow: 'hidden' 
        }}
      >
        {/* Botón de scroll hacia arriba */}
        {showScrollButtons && (
          <button 
            style={canScrollUp ? scrollButtonStyle : disabledScrollButtonStyle}
            onClick={() => canScrollUp && handleScroll('up')}
            disabled={!canScrollUp}
          >
            <i className="bi bi-caret-up-fill"></i>
          </button>
        )}

        {/* Contenido del menú - sin scrollbar visible */}
        <div 
          ref={menuRef}
          style={{ 
            flex: '1 1 auto', 
            overflowY: 'auto',
            paddingTop: '8px',
            paddingRight: '5px',
            paddingLeft: '5px',
            paddingBottom: '8px',
            msOverflowStyle: 'none',  // IE y Edge
            scrollbarWidth: 'none',   // Firefox
          }}
          onScroll={updateScrollState}
        >
          <style>
            {`
              /* Ocultar scrollbar para Chrome, Safari y Opera */
              div[style*="overflow-y: auto"]::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          {menuItems
            .filter(item => visibility[item.id] !== false) // Filtrar según visibilidad
            .map((item) => (
              <OverlayTrigger
                key={item.route}
                placement="right"
                overlay={<Tooltip id={`tooltip-${item.label}`}>{item.label}</Tooltip>}
                delay={{ show: 300, hide: 0 }}
              >
                <div
                  style={getMenuItemStyle()}
                  className="sidebar-item hover-highlight"
                  onClick={() => navigate(item.route)}
                >
                  <i className={`bi ${item.icon}`} style={iconStyle}></i>
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </OverlayTrigger>
            ))}
        </div>

        {/* Botón de scroll hacia abajo */}
        {showScrollButtons && (
          <button 
            style={canScrollDown ? scrollButtonStyle : disabledScrollButtonStyle}
            onClick={() => canScrollDown && handleScroll('down')}
            disabled={!canScrollDown}
          >
            <i className="bi bi-caret-down-fill"></i>
          </button>
        )}

        {/* Logout fijo abajo */}
        <div 
          style={{ 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            flexShrink: 0, 
            padding: '5px',
            marginTop: 'auto' 
          }}
        >
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip id="tooltip-logout">Cerrar sesión</Tooltip>}
            delay={{ show: 300, hide: 0 }}
          >
            <div style={getMenuItemStyle()} className="sidebar-item hover-highlight" onClick={onLogout}>
              <i className="bi bi-box-arrow-right" style={iconStyle}></i>
              {!collapsed && <span>Cerrar sesión</span>}
            </div>
          </OverlayTrigger>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;