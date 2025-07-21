// services/aternityService.ts
import axios from 'axios';

const ATERNITY_BASE_URL = 'https://us3-odata.aternity.com/aternity.odata/latest';
const ATERNITY_USER = 'SGLozua@teco.com.ar';
const ATERNITY_PASSWORD = '21ee_19819a99ecf_xhxjKpjLsYYeJ9KcOx65WZOiLbOqBv';

class AternityService {
  private apiClient;

  constructor() {
    this.apiClient = axios.create({
      baseURL: ATERNITY_BASE_URL,
      auth: {
        username: ATERNITY_USER,
        password: ATERNITY_PASSWORD
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  // Obtener métricas de experiencia de usuario
  async getUserExperience(filters?: any) {
    try {
      const response = await this.apiClient.get('/UserExperience', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo experiencia de usuario:', error);
      throw error;
    }
  }

  // Obtener métricas de aplicaciones
  async getApplicationMetrics(filters?: any) {
    try {
      const response = await this.apiClient.get('/Applications', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas de aplicaciones:', error);
      throw error;
    }
  }

  // Obtener datos de sesiones (complementar VM PIC)
  async getSessionData(filters?: any) {
    try {
      const response = await this.apiClient.get('/Sessions', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos de sesiones:', error);
      throw error;
    }
  }

  // Obtener métricas de red
  async getNetworkMetrics(filters?: any) {
    try {
      const response = await this.apiClient.get('/NetworkMetrics', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo métricas de red:', error);
      throw error;
    }
  }

  // Obtener datos de dispositivos
  async getDeviceData(filters?: any) {
    try {
      const response = await this.apiClient.get('/Devices', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos de dispositivos:', error);
      throw error;
    }
  }

  // Buscar datos específicos de VM PIC
  async getVMPICData(vmNames?: string[]) {
    try {
      let filter = '';
      if (vmNames && vmNames.length > 0) {
        const nameFilters = vmNames.map(name => `substringof('${name}', DeviceName)`).join(' or ');
        filter = `$filter=${nameFilters}`;
      }

      const response = await this.apiClient.get(`/Devices${filter ? '?' + filter : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos VM PIC:', error);
      throw error;
    }
  }

  // Obtener métricas de rendimiento por localización
  async getPerformanceByLocation(filters?: any) {
    try {
      const response = await this.apiClient.get('/PerformanceByLocation', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo rendimiento por localización:', error);
      throw error;
    }
  }
}

export const aternityService = new AternityService();
export default AternityService;