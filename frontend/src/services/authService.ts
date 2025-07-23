// src/services/authService.ts
import axios from 'axios';

// 🚀 USAR LA MISMA DETECCIÓN QUE api.ts
const getApiUrl = () => {
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

const API_URL = getApiUrl();

// 🔍 DEBUG - Mostrar qué URL usa authService
console.log('🔐 AuthService API_URL:', API_URL);

// Interfaz para los datos de usuario
interface User {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  [key: string]: any; // Para permitir otros campos
}

// Interfaz para la respuesta del login
interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Obtiene el token almacenado en localStorage
 * @returns El token JWT o null si no existe
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Función para manejar el login
export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data && response.data.token) {
      // Establecer token para todas las solicitudes futuras
      setAuthToken(response.data.token);
      
      // Guardar datos en localStorage
      storeUserData(response.data);
      
      return {
        success: true,
        data: response.data
      };
    } else {
      throw new Error('Respuesta de login inválida');
    }
  } catch (error: any) {
    console.error('Error en login:', error);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Función para establecer el token en los headers
export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Función para guardar los datos del usuario
export const storeUserData = (data: LoginResponse) => {
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  if (data.user) {
    // Asegurarse de que user sea un objeto válido
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  // También guardar todo junto para facilitar el acceso
  localStorage.setItem('authData', JSON.stringify({
    token: data.token,
    user: data.user
  }));
};

// Función para obtener los datos del usuario
export const getUserData = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    return null;
  }
};

// Función para verificar si hay usuario autenticado
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const user = getUserData();
  return !!(token && user);
};

// Función para cerrar sesión
export const logout = () => {
  // Eliminar datos de localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('authData');
  
  // Eliminar token de los headers
  delete axios.defaults.headers.common['Authorization'];
};

// Función para obtener el nombre de usuario desde localStorage
export const getUserName = (): string => {
  const user = getUserData();
  return user ? user.nombre : 'Usuario';
};

// Función para actualizar perfil de usuario
export const updateProfileInLocalStorage = (updatedUser: Partial<User>) => {
  const user = getUserData();
  if (user) {
    const newUserData = { ...user, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUserData));
    
    // Actualizar también en authData
    const authDataStr = localStorage.getItem('authData');
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        authData.user = newUserData;
        localStorage.setItem('authData', JSON.stringify(authData));
      } catch (e) {
        console.error('Error actualizando authData:', e);
      }
    }
  }
};

// Inicializar token al cargar la aplicación
export const initializeAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    setAuthToken(token);
  }
};