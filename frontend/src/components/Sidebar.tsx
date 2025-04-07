import React, { useEffect, useRef } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  toggle: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggle, onLogout }) => {
  const navigate = useNavigate();
  const logoRef = useRef<HTMLImageElement | null>(null);

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

  const sidebarStyle: React.CSSProperties = {
    minHeight: '100vh',
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

  const menuItems = [
    { icon: 'bi-speedometer2', label: 'Dashboard', route: '/dashboard' },
    { icon: 'bi-diagram-3-fill', label: 'Proyectos', route: '/projects' },
    { icon: 'bi-list-task', label: 'Tareas', route: '/tasks' },
    { icon: 'bi-people-fill', label: 'Usuarios', route: '/users' },
    { icon: 'bi-journal-text', label: 'Bitácora', route: '/bitacora' },
    { icon: 'bi-flag-fill', label: 'Hitos', route: '/hitos' },
    { icon: 'bi-crosshair2', label: 'iTracker', route: '/itrackerdash' },
    { icon: 'bi-arrow-90deg-right', label: 'Tabulaciones', route: '/tabu' },
    { icon: 'bi-shield-exclamation', label: 'Inc. en Guardia', route: '/incidencias' },
  ];

  return (
    <div style={sidebarStyle}>
      {/* Header / Logo */}
      <div
        className="p-3 d-flex justify-content-between align-items-center"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
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

      {/* Contenido con scroll vertical */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '8px' }}>
          {menuItems.map((item) => (
            <OverlayTrigger
              key={item.route}
              placement="right"
              overlay={<Tooltip id={`tooltip-${item.label}`}>{item.label}</Tooltip>}
              delay={{ show: 300, hide: 0 }}
            >
              <div
                style={getMenuItemStyle()}
                className="sidebar-item"
                onClick={() => navigate(item.route)}
              >
                <i className={`bi ${item.icon}`} style={iconStyle}></i>
                {!collapsed && <span>{item.label}</span>}
              </div>
            </OverlayTrigger>
          ))}
        </div>

        {/* Logout fijo abajo */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip id="tooltip-logout">Cerrar sesión</Tooltip>}
            delay={{ show: 300, hide: 0 }}
          >
            <div style={getMenuItemStyle()} className="sidebar-item" onClick={onLogout}>
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
