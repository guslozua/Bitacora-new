// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, usuario } = response.data;
localStorage.setItem('token', token);

if (usuario) {
  localStorage.setItem('user', JSON.stringify(usuario));
}
      setMensaje('¡Inicio de sesión exitoso!');
      setTimeout(() => {
        navigate('/dashboard'); // Redirigir al Dashboard
      }, 1000);
    } catch (error: any) {
      setMensaje(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-3">
          <img src="/logox.png" alt="Logo" style={{ width: '70px', marginBottom: '10px' }} />
        </div>
        <h3 className="text-center mb-1">Task Manager</h3>
        <h5 className="text-center mb-4 text-muted">Iniciar sesión</h5>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mensaje && (
            <div className="alert alert-info text-center py-2">{mensaje}</div>
          )}

          <button type="submit" className="btn btn-primary w-100">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
