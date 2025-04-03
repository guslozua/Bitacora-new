import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  toggle: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggle, onLogout }) => {
  const navigate = useNavigate();

  const sidebarStyle = {
    minHeight: '100vh',
    width: collapsed ? '80px' : '250px',
    position: 'fixed' as 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    transition: 'all 0.3s',
    backgroundColor: '#343a40',
    color: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };

  const menuItemStyle = {
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '5px',
  };

  const iconStyle = {
    fontSize: '1.5rem',
    marginRight: collapsed ? '0' : '10px',
  };

  const menuItems = [
    { icon: 'bi-speedometer2', label: 'Dashboard', route: '/dashboard' },
    { icon: 'bi-diagram-3-fill', label: 'Proyectos', route: '/projects' },
    { icon: 'bi-list-task', label: 'Tareas', route: '/tasks' },
    { icon: 'bi-people-fill', label: 'Usuarios', route: '/users' },
    { icon: 'bi-journal-text', label: 'Bitácora', route: '/bitacora' },
    { icon: 'bi-flag-fill', label: 'Hitos', route: '/hitos' },
  ];

  return (
    <div style={sidebarStyle}>
      <div
        className="p-3 d-flex justify-content-between align-items-center"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        {!collapsed ? (
          <div className="d-flex align-items-center">
            <img
              src="/logoxside.png"
              alt="Logo"
              style={{ width: '60px', height: '60px', marginRight: '10px' }}
            />
            <h5 className="mb-0">TASK manager</h5>
          </div>
        ) : (
          <img
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

      <div className="pt-3">
        {menuItems.map((item) => (
          <div
            key={item.route}
            style={menuItemStyle}
            className="sidebar-item"
            onClick={() => navigate(item.route)}
          >
            <i className={`bi ${item.icon}`} style={iconStyle}></i>
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}

        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            margin: '10px 15px',
          }}
        ></div>

        <div style={menuItemStyle} onClick={onLogout}>
          <i className="bi bi-box-arrow-right" style={iconStyle}></i>
          {!collapsed && <span>Cerrar sesión</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
