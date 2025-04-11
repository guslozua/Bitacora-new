import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Error404 = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fd',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        lineHeight: '1.4',
        textAlign: 'center'
      }}>
        <div style={{
          position: 'relative',
          height: '240px'
        }}>
          {/* Número 404 grande como fondo */}
          <h1 style={{
            fontFamily: 'sans-serif',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '252px',
            fontWeight: '900',
            margin: '0',
            color: '#9FA6B2',
            textTransform: 'uppercase',
            letterSpacing: '-40px',
            marginLeft: '-20px',
            
          }}>404</h1>
          
          {/* Texto superpuesto */}
          <h2 style={{
            fontFamily: 'sans-serif',
            position: 'absolute',
            left: '0',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '42px',
            fontWeight: '700',
            color: '#343a40',
            textTransform: 'uppercase',
            margin: '0',
            letterSpacing: '2px'
          }}>Oops! Página no encontrada</h2>
        </div>
        
        <p style={{
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#555',
          fontWeight: '400',
          marginBottom: '20px'
        }}>
          Lo sentimos, pero la página que estás buscando no existe, ha sido eliminada 
          o temporalmente no está disponible.
        </p>
        
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleGoHome}
          style={{
            fontWeight: '500',
            borderRadius: '25px',
            paddingLeft: '30px',
            paddingRight: '30px',
            backgroundColor: '#343a40',
            borderColor: '#343a40'
          }}
        >
          <i className="bi bi-house-door me-2"></i>
          Volver al inicio
        </Button>
      </div>
      
      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div className="d-flex justify-content-center align-items-center">
            
            <span>Desarrollado por <img 
              src="/logox1b.png" 
              alt="ATPC Logo" 
              style={{ 
                height: '40px', 
                marginRight: '10px',
                objectFit: 'contain'
              }} 
            /> </span>
            <small>- AseguramientoTecnicoydePlataformasdeContacto@teco.com.ar</small>
          </div>
      </div>
    </div>
  );
};

export default Error404;