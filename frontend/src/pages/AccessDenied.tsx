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
      minHeight: '100vh',
      backgroundColor: '#f8f9fd', // Mismo fondo que Error404
      padding: '20px',
      textAlign: 'center',
      position: 'relative',
      paddingBottom: '100px' // Espacio para el footer
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        lineHeight: '1.4',
        textAlign: 'center',
        marginTop: '-50px' // Centrar mejor verticalmente
      }}>
        <div style={{
          position: 'relative',
          height: '240px' // Misma altura que Error404
        }}>
          {/* Número 403 grande como fondo - MISMO ESTILO QUE 404 */}
          <h1 style={{
            fontFamily: 'sans-serif',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '252px', // Mismo tamaño que Error404
            fontWeight: '900',
            margin: '0',
            color: '#9FA6B2', // MISMO COLOR que Error404
            textTransform: 'uppercase',
            letterSpacing: '-40px', // Mismo espaciado que Error404
            marginLeft: '-20px',
            lineHeight: '1'
          }}>403</h1>
          
          {/* Texto superpuesto - MISMO ESTILO QUE ERROR404 */}
          <h2 style={{
            fontFamily: 'sans-serif',
            position: 'absolute',
            left: '0',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '42px', // Mismo tamaño que Error404
            fontWeight: '700',
            color: '#343a40', // MISMO COLOR que Error404
            textTransform: 'uppercase',
            margin: '0',
            letterSpacing: '2px',
            lineHeight: '1.2'
          }}>Acceso Denegado</h2>
        </div>
        
        {/* Mensaje principal - MISMO ESTILO QUE ERROR404 */}
        <p style={{
          fontFamily: 'sans-serif',
          fontSize: '16px', // Mismo tamaño que Error404
          color: '#555', // MISMO COLOR que Error404
          fontWeight: '400',
          marginBottom: '20px', // Mismo margen que Error404
          lineHeight: '1.5'
        }}>
          Lo sentimos, pero no tienes permisos para acceder a esta sección.
          <br />
          Esta área está restringida a usuarios con perfiles de <strong>Administrador</strong> o <strong>Super Administrador</strong>.
        </p>
        
        {/* Mensaje secundario */}
        <p style={{
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#777',
          fontWeight: '400',
          marginBottom: '30px',
          lineHeight: '1.4'
        }}>
          💡 Si consideras que deberías tener acceso, contacta al administrador del sistema.
        </p>
        
        {/* Botón principal - EXACTAMENTE IGUAL QUE ERROR404 */}
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleGoHome}
          style={{
            fontWeight: '500',
            borderRadius: '25px', // Mismo radio que Error404
            paddingLeft: '30px',  // Mismo padding que Error404
            paddingRight: '30px',
            backgroundColor: '#343a40', // MISMO COLOR que Error404
            borderColor: '#343a40'      // MISMO COLOR que Error404
          }}
        >
          <i className="bi bi-house-door me-2"></i>
          Volver al inicio
        </Button>
        
        {/* Botón secundario */}
        <div style={{ marginTop: '15px' }}>
          <Button 
            variant="outline-secondary" 
            size="lg" 
            onClick={() => window.history.back()}
            style={{
              fontWeight: '500',
              borderRadius: '25px',
              paddingLeft: '30px',
              paddingRight: '30px',
              color: '#6c757d',
              borderColor: '#6c757d'
            }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Regresar
          </Button>
        </div>
      </div>
      
      {/* Footer - EXACTAMENTE IGUAL QUE ERROR404 */}
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