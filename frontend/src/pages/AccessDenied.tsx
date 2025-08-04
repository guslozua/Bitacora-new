import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
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
          {/* Número 403 grande como fondo */}
          <h1 style={{
            fontFamily: 'sans-serif',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '252px',
            fontWeight: '900',
            margin: '0',
            color: '#ff6b6b40',
            textTransform: 'uppercase',
            letterSpacing: '-40px',
            marginLeft: '-20px',
          }}>403</h1>
          
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
            color: '#dc3545',
            textTransform: 'uppercase',
            margin: '0',
            letterSpacing: '2px'
          }}>Acceso Denegado</h2>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <i className="bi bi-shield-exclamation" style={{
            fontSize: '64px',
            color: '#dc3545',
            marginBottom: '20px'
          }}></i>
        </div>
        
        <p style={{
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#555',
          fontWeight: '500',
          marginBottom: '10px'
        }}>
          No tienes permisos para acceder al Panel Administrativo
        </p>
        
        <p style={{
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#777',
          fontWeight: '400',
          marginBottom: '30px'
        }}>
          Esta sección está restringida a usuarios con perfiles de <strong>Administrador</strong> o <strong>Super Administrador</strong>.
          <br />
          Si consideras que deberías tener acceso, contacta al administrador del sistema.
        </p>
        
        <div className="d-flex gap-3 justify-content-center">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleGoHome}
            style={{
              fontWeight: '500',
              borderRadius: '25px',
              paddingLeft: '30px',
              paddingRight: '30px',
              backgroundColor: '#007bff',
              borderColor: '#007bff'
            }}
          >
            <i className="bi bi-house-door me-2"></i>
            Volver al Dashboard
          </Button>
          
          <Button 
            variant="outline-secondary" 
            size="lg" 
            onClick={() => window.history.back()}
            style={{
              fontWeight: '500',
              borderRadius: '25px',
              paddingLeft: '30px',
              paddingRight: '30px'
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Regresar
          </Button>
        </div>
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

export default AccessDenied;