// src/components/ThemeToggleButton.tsx
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ 
  className = '', 
  size = 'md'
}) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  // Tamaños para el toggle
  const sizeConfig = {
    sm: { width: '48px', height: '24px', iconSize: '12px' },
    md: { width: '60px', height: '30px', iconSize: '14px' },
    lg: { width: '72px', height: '36px', iconSize: '16px' }
  };

  const config = sizeConfig[size];

  const toggleStyle: React.CSSProperties = {
    width: config.width,
    height: config.height,
    borderRadius: config.height,
    background: isDarkMode 
      ? 'linear-gradient(135deg, #00d4ff 0%, #090979 100%)' // 🔥 Colores nuevos: Azul cyan a azul oscuro
      : 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)', // 🔥 Colores nuevos: Naranja a rojizo
    border: 'none',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // 🔥 Transición más suave
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: isDarkMode 
      ? '0 8px 32px rgba(0, 212, 255, 0.3)' // 🔥 Sombras actualizadas
      : '0 8px 32px rgba(255, 107, 107, 0.3)',
  };

  const circleStyle: React.CSSProperties = {
    width: `calc(${config.height} - 4px)`,
    height: `calc(${config.height} - 4px)`,
    borderRadius: '50%',
    background: '#ffffff',
    position: 'absolute',
    top: '2px',
    left: isDarkMode ? '2px' : `calc(${config.width} - ${config.height} + 2px)`,
    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // 🔥 Misma transición suave
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: config.iconSize,
    color: isDarkMode ? '#090979' : '#ff6b6b', // 🔥 Colores de iconos actualizados
    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // 🔥 Transición suave
    transform: isDarkMode ? 'rotate(0deg)' : 'rotate(180deg)', // 🔥 Rotación suave
  };

  // Tooltip style
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: `calc(100% + 8px)`,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    opacity: showTooltip ? 1 : 0,
    visibility: showTooltip ? 'visible' : 'hidden',
    transition: 'opacity 0.2s ease, visibility 0.2s ease',
    pointerEvents: 'none',
  };

  // Flecha del tooltip
  const tooltipArrowStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderTop: '4px solid rgba(0, 0, 0, 0.8)',
  };

  return (
    <div 
      className={`d-flex align-items-center gap-2 ${className}`}
      style={{ position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        style={toggleStyle}
        onClick={toggleTheme}
        className="theme-toggle-switch"
      >
        {/* Íconos de fondo */}
        <div 
          style={{
            position: 'absolute',
            left: '6px',
            fontSize: config.iconSize,
            color: 'rgba(255, 255, 255, 0.8)',
            opacity: isDarkMode ? 1 : 0,
            transition: 'opacity 0.6s ease', // 🔥 Transición suave
          }}
        >
          🌙
        </div>
        <div 
          style={{
            position: 'absolute',
            right: '6px',
            fontSize: config.iconSize,
            color: 'rgba(255, 255, 255, 0.8)',
            opacity: !isDarkMode ? 1 : 0,
            transition: 'opacity 0.6s ease', // 🔥 Transición suave
          }}
        >
          ☀️
        </div>
        
        {/* Círculo deslizante */}
        <div style={circleStyle}>
          <i 
            className={`bi ${isDarkMode ? 'bi-moon-stars-fill' : 'bi-brightness-high-fill'}`}
            style={iconStyle}
          ></i>
        </div>
      </button>
      
      {/* 🔥 Tooltip en lugar de texto redundante */}
      {showTooltip && (
        <div style={tooltipStyle}>
          {isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          <div style={tooltipArrowStyle}></div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggleButton;