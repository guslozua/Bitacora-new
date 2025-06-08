import React from 'react';
import { Container } from 'react-bootstrap';
import DiagnosticsPanel from '../components/Diagnostics/DiagnosticsPanel';

const DiagnosticsPage: React.FC = () => {
  return (
    <div 
      className="d-flex flex-column"
      style={{ 
        minHeight: '100vh',  // 🔧 Ocupar toda la altura de la pantalla
        backgroundColor: '#f8f9fa'  // Color de fondo opcional
      }}
    >
      {/* Contenido principal que se expande */}
      <Container fluid className="py-4 flex-grow-1">
        <DiagnosticsPanel />
      </Container>
    </div>
  );
};

export default DiagnosticsPage;