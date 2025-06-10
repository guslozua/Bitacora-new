import React from 'react';
import { Container } from 'react-bootstrap';
import { useTheme } from '../context/ThemeContext'; // 🔥 AGREGADO: Hook para tema
import DiagnosticsPanel from '../components/Diagnostics/DiagnosticsPanel';

const DiagnosticsPage: React.FC = () => {
  const { isDarkMode } = useTheme(); // 🔥 AGREGADO: Hook para detectar tema

  // 🎨 AGREGADO: Función para obtener colores según el tema
  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        background: '#212529'
      };
    }
    return {
      background: '#f8f9fa'
    };
  };

  const themeColors = getThemeColors();

  return (
    <div 
      className="d-flex flex-column"
      style={{ 
        minHeight: '100vh',
        backgroundColor: themeColors.background // 🎨 ACTUALIZADO: Background temático
      }}
    >
      <Container fluid className="py-4 flex-grow-1">
        <DiagnosticsPanel />
      </Container>
    </div>
  );
};

export default DiagnosticsPage;