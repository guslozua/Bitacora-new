// src/components/ThemedFooter.tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemedFooter: React.FC = () => {
  const { isDarkMode } = useTheme();

  if (isDarkMode) {
    // Footer para modo oscuro (usando tu Footer.tsx existente)
    return (
      <footer style={{
        backgroundColor: '#343a40',
        color: 'white',
        padding: '10px 0',
        textAlign: 'center',
        width: '100%',
        marginTop: 'auto'
      }}>
        <div className="d-flex justify-content-center align-items-center">
          <span>Desarrollado por <img
            src="/logoxsideb.png"
            alt="ATPC Logo"
            style={{
              height: '40px',
              marginRight: '10px',
              objectFit: 'contain'
            }}
          /></span>
          <small> - AseguramientoTecnicoydePlataformasdeContacto@teco.com.ar</small>
        </div>
      </footer>
    );
  } else {
    // Footer para modo claro (usando tu LightFooter.tsx existente)
    return (
      <footer style={{
        backgroundColor: '#f8f9fa',
        color: '#6c757d',
        padding: '10px 0',
        textAlign: 'center',
        width: '100%',
        marginTop: 'auto',
        borderTop: '1px solid #dee2e6'
      }}>
        <div className="d-flex justify-content-center align-items-center">
          <span>Desarrollado por <img
            src="/logox1b.png"
            alt="ATPC Logo"
            style={{
              height: '35px',
              marginRight: '10px',
              objectFit: 'contain'
            }}
          /></span>
          <small> - AseguramientoTecnicoydePlataformasdeContacto@teco.com.ar</small>
        </div>
      </footer>
    );
  }
};

export default ThemedFooter;