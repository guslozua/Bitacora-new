// src/components/ThemedLogo.tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemedLogoProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

const ThemedLogo: React.FC<ThemedLogoProps> = ({ 
  width = '40px', 
  height = '40px', 
  className = '',
  style = {},
  alt = 'Logo'
}) => {
  const { isDarkMode } = useTheme();

  // Determinar qué logo usar según el tema
  const logoSrc = isDarkMode ? '/logoxside.png' : '/logoxside22.png';

  return (
    <img
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{
        objectFit: 'contain',
        transition: 'opacity 0.3s ease',
        ...style
      }}
    />
  );
};

export default ThemedLogo;