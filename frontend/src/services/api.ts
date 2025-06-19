// src/services/api.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// 🔧 INTERCEPTOR PARA AGREGAR TOKEN AUTOMÁTICAMENTE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para debugging (opcional - puedes comentar en producción)
    console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      hasToken: !!token,
      headers: config.headers.Authorization ? 'Bearer ***' : 'No Auth'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// 🔧 INTERCEPTOR PARA MANEJAR RESPUESTAS Y ERRORES
api.interceptors.response.use(
  (response) => {
    // Log de respuestas exitosas (opcional)
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    // Log de errores
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message
    });
    
    // 🔒 MANEJO AUTOMÁTICO DE ERRORES 401 (Unauthorized)
    if (error.response?.status === 401) {
      console.warn('🔒 Token inválido o expirado. Limpiando sesión...');
      
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirigir al login solo si no estamos ya ahí
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        console.warn('🔄 Redirigiendo al login...');
        window.location.href = '/';
      }
    }
    
    // 🔒 MANEJO DE ERRORES 403 (Forbidden)
    if (error.response?.status === 403) {
      console.warn('🚫 Acceso denegado. Usuario sin permisos suficientes.');
    }
    
    return Promise.reject(error);
  }
);

export default api;