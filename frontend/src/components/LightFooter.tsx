import React from 'react';

const LightFooter: React.FC = () => {
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
};

export default LightFooter;