// src/services/apiConfig.ts
// Configuración centralizada de URL de API

/**
 * 🚀 DETECCIÓN AUTOMÁTICA DE ENTORNO
 * Función compartida para todos los servicios
 */
export const getApiUrl = (): string => {
  // Verificar si estamos en Railway production
  if (window.location.hostname.includes('railway.app')) {
    return 'https://bitacora-new-production.up.railway.app/api';
  }
  
  // Si estamos en desarrollo local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }
  
  // Por defecto, usar Railway (para cualquier otro dominio)
  return 'https://bitacora-new-production.up.railway.app/api';
};

/**
 * URL base de la API - usar en todos los servicios
 */
export const API_BASE_URL = getApiUrl();

/**
 * Dominio base (sin /api) - para servicios que no usan /api
 */
export const API_DOMAIN = getApiUrl().replace('/api', '');

// 🔍 DEBUG - Solo mostrar una vez
console.log('📦 ApiConfig - URL base configurada:', API_BASE_URL);
console.log('📦 ApiConfig - Dominio base configurado:', API_DOMAIN);
