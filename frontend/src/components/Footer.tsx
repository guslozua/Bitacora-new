import React from 'react';

const Footer = () => {
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
          src="/logoxside.png"
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
};

export default Footer;
