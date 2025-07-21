// utils/cidrUtils.js - Utilidades para manejo de segmentos IP CIDR
class CIDRUtils {
  
  /**
   * Convierte una IP en formato string a número entero
   * @param {string} ip - IP en formato "192.168.1.1"
   * @returns {number} - IP como número entero
   */
  static ipToNumber(ip) {
    const parts = ip.split('.');
    return (parseInt(parts[0]) << 24) + 
           (parseInt(parts[1]) << 16) + 
           (parseInt(parts[2]) << 8) + 
           parseInt(parts[3]);
  }
  
  /**
   * Verifica si una IP pertenece a un segmento CIDR
   * @param {string} ip - IP a verificar (ej: "10.95.196.50")
   * @param {string} cidr - Segmento CIDR (ej: "10.95.196.0/23")
   * @returns {boolean} - true si la IP pertenece al segmento
   */
  static ipInCIDR(ip, cidr) {
    try {
      const [networkIp, prefixLength] = cidr.split('/');
      const prefixLengthNum = parseInt(prefixLength);
      
      // Convertir IPs a números
      const ipNum = this.ipToNumber(ip);
      const networkNum = this.ipToNumber(networkIp);
      
      // Calcular máscara de red
      const mask = 0xFFFFFFFF << (32 - prefixLengthNum);
      
      // Verificar si la IP está en el segmento
      return (ipNum & mask) === (networkNum & mask);
    } catch (error) {
      console.error(`Error verificando IP ${ip} en CIDR ${cidr}:`, error);
      return false;
    }
  }
  
  /**
   * Clasifica una IP según los segmentos de call centers
   * @param {string} ip - IP a clasificar
   * @param {Array} callCenterSegments - Array de segmentos de call centers
   * @returns {Object} - Información de clasificación
   */
  static classifyIP(ip, callCenterSegments) {
    // Validar IP
    if (!ip || typeof ip !== 'string') {
      return {
        ubicacion_tipo: 'desconocido',
        call_center: null,
        segmento_ip: null,
        localidad: null,
        tipo_contrato: null
      };
    }
    
    // Buscar en qué segmento de call center está la IP
    for (const segment of callCenterSegments) {
      if (this.ipInCIDR(ip, segment.segmento_ip)) {
        return {
          ubicacion_tipo: 'call_center',
          call_center: segment.nombre_call_center,
          segmento_ip: segment.segmento_ip,
          segmento_numero: segment.segmento_numero,
          localidad: segment.localidad,
          domicilio: segment.domicilio,
          tipo_contrato: segment.tipo_contrato
        };
      }
    }
    
    // Si no está en ningún call center, es Home Office
    return {
      ubicacion_tipo: 'home',
      call_center: null,
      segmento_ip: null,
      localidad: null,
      tipo_contrato: null
    };
  }
  
  /**
   * Función de prueba para verificar el funcionamiento
   * @param {string} testIp - IP de prueba
   * @param {string} testCidr - CIDR de prueba
   */
  static testCIDR(testIp, testCidr) {
    const result = this.ipInCIDR(testIp, testCidr);
    console.log(`IP: ${testIp} en CIDR: ${testCidr} = ${result ? 'SÍ' : 'NO'}`);
    return result;
  }
}

module.exports = CIDRUtils;