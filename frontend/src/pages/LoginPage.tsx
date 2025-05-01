// src/pages/LoginPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { login } from '../services/authService'; // Importar el servicio de autenticación

const LoginPage = () => {
  const navigate = useNavigate();
  const logoRef = useRef<HTMLImageElement | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Efecto para la animación del logo
  useEffect(() => {
    const interval = setInterval(() => {
      if (logoRef.current) {
        logoRef.current.classList.add('animate__animated', 'animate__jello');
        setTimeout(() => {
          logoRef.current?.classList.remove('animate__animated', 'animate__jello');
        }, 1000);
      }
    }, Math.floor(Math.random() * 10000) + 10000); // Entre 10 y 20 segundos

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Usar la función de login del servicio de autenticación
      const result = await login(email, password);
      
      if (result.success) {
        Swal.fire({
          title: '¡Bienvenido!',
          text: '¡Inicio de sesión exitoso!',
          icon: 'success',
          iconColor: '#339fff',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/dashboard');
        });
      } else {
        throw new Error(result.error?.message || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error durante el login:', error);
      
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al iniciar sesión',
        icon: 'error',
        confirmButtonText: 'Intentar nuevamente',
        confirmButtonColor: '#3085d6'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 bg-light">
      {/* Importación de estilos de Animate.css */}
      <style>
        {`
          @import url('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');
        `}
      </style>
      <div className="card border-0 p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%', borderRadius: '15px' }}>
        <div className="text-center">
          <div className="d-flex align-items-center justify-content-center mb-2">
            <img 
              ref={logoRef} 
              src="/logox1.png" 
              alt="Logo" 
              style={{ width: '65px' }} 
            />
            <h3 className="ms-2 mb-0 fw-bold" style={{ color: '#333' }}>TaskManager</h3>
          </div>
          <p className="text-muted mb-4">Iniciar sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Correo electrónico</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control border-start-0 ps-0"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between">
              <label className="form-label small fw-bold">Contraseña</label>
              <a href="#" className="small text-decoration-none">¿Olvidaste tu contraseña?</a>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                className="form-control border-start-0 ps-0"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 mb-3"
            style={{ borderRadius: '8px', backgroundColor: '#0d6efd', fontWeight: 'bold' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cargando...
              </span>
            ) : (
              'Ingresar'
            )}
          </button>
          
          <div className="text-center mt-3">
            <p className="text-muted small">¿No tienes una cuenta? <a href="#" className="text-decoration-none">Regístrate aquí</a></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;