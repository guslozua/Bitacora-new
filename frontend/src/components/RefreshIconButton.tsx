// src/components/RefreshIconButton.tsx
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface RefreshIconButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const RefreshIconButton: React.FC<RefreshIconButtonProps> = ({ 
  onClick,
  className = '', 
  size = 'md',
  loading = false
}) => {
  const { isDarkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  // Configuración de tamaños
  const sizeConfig = {
    sm: { size: '32px', iconSize: '14px' },
    md: { size: '40px', iconSize: '16px' },
    lg: { size: '48px', iconSize: '20px' }
  };

  const config = sizeConfig[size];

  const buttonStyle: React.CSSProperties = {
    width: config.size,
    height: config.size,
    borderRadius: '50%',
    border: 'none',
    background: isDarkMode 
      ? isHovered 
        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        : 'rgba(79, 172, 254, 0.1)'
      : isHovered 
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : 'rgba(102, 126, 234, 0.1)',
    color: isDarkMode 
      ? isHovered ? '#ffffff' : '#4facfe'
      : isHovered ? '#ffffff' : '#667eea',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    fontSize: config.iconSize,
    boxShadow: isHovered 
      ? isDarkMode 
        ? '0 8px 25px rgba(79, 172, 254, 0.3)'
        : '0 8px 25px rgba(102, 126, 234, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    transform: isHovered && !loading ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
    opacity: loading ? 0.7 : 1,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: config.iconSize,
    transition: 'transform 0.6s ease',
    transform: loading ? 'rotate(360deg)' : 'rotate(0deg)',
    animation: loading ? 'spin 1s linear infinite' : 'none',
  };

  const handleClick = () => {
    if (!loading) {
      onClick();
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .refresh-icon-button:hover .refresh-icon {
            transform: rotate(180deg);
          }
        `}
      </style>
      
      <button
        style={buttonStyle}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`refresh-icon-button ${className}`}
        title={loading ? 'Actualizando...' : 'Actualizar datos'}
        disabled={loading}
      >
        <i 
          className={`bi ${loading ? 'bi-arrow-clockwise' : 'bi-arrow-clockwise'} refresh-icon`}
          style={iconStyle}
        ></i>
      </button>
    </>
  );
};

export default RefreshIconButton;