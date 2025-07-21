// controllers/aternityController.js - VERSIÓN CORREGIDA CON CORRELACIONES ESTRICTAS
const axios = require('axios');

const ATERNITY_BASE_URL = process.env.ATERNITY_BASE_URL || 'https://us3-odata.aternity.com/aternity.odata/latest';
const ATERNITY_USER = process.env.ATERNITY_USER || 'SGLozua@teco.com.ar';
const ATERNITY_PASSWORD = process.env.ATERNITY_PASSWORD || '21ee_19819a99ecf_xhxjKpjLsYYeJ9KcOx65WZOiLbOqBv';

class AternityController {
  
  static getAternityClient() {
    return axios.create({
      baseURL: ATERNITY_BASE_URL,
      auth: {
        username: ATERNITY_USER,
        password: ATERNITY_PASSWORD
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json;odata.metadata=minimal'
      },
      timeout: 30000
    });
  }

  // CORRELACIÓN ESTRICTA VM PIC + Aternity
  static async getCorrelatedVMPICData(req, res) {
    try {
      const db = require('../config/db');
      const client = AternityController.getAternityClient();
      
      console.log('🔍 Obteniendo datos correlacionados VM PIC + Aternity (ESTRICTO)...');
      
      // 🚀 CONSULTA MEJORADA - INCLUIR nombre_punto_final para correlación
      const [vmPicMachines] = await db.query(`
        SELECT DISTINCT 
          nombre_maquina, 
          usuario_asociado, 
          ip_punto_final, 
          direccion_ip,
          nombre_punto_final,
          call_center_asignado,
          localidad_call_center,
          estado_sesion,
          created_at
        FROM sesiones_data 
        WHERE es_vm_pic = 1 
          AND nombre_maquina IS NOT NULL
          AND estado_sesion = 'Active'
        ORDER BY created_at DESC
        LIMIT 500
      `);

      console.log(`📊 Encontradas ${vmPicMachines.length} máquinas VM PIC activas`);

      // 🔍 DEBUG: Mostrar ejemplos de datos VM PIC
      if (vmPicMachines.length > 0) {
        console.log('🔍 EJEMPLO DE DATOS VM PIC:');
        const sample = vmPicMachines[0];
        console.log({
          nombre_maquina: sample.nombre_maquina,
          nombre_punto_final: sample.nombre_punto_final,
          usuario_asociado: sample.usuario_asociado,
          ip_punto_final: sample.ip_punto_final,
          call_center: sample.call_center_asignado
        });
      }

      // 🚀 OBTENER MÁS DATOS DE ATERNITY
      let aternityDevices = [];
      try {
        console.log('🔍 Consultando DEVICE_INVENTORY en Aternity (500 dispositivos)...');
        
        const aternityResponse = await client.get('/DEVICE_INVENTORY', {
          params: {
            '$top': 500,
            '$select': 'DEVICE_NAME,DEVICE_IP_ADDRESS,USERNAME,USER_DOMAIN,DEVICE_DOMAIN,OS_NAME,LOCATION_CITY,LOCATION_STATE,BUSINESS_LOCATION'
          }
        });
        
        aternityDevices = aternityResponse.data.value || [];
        console.log(`📊 Obtenidos ${aternityDevices.length} dispositivos de Aternity`);
        
        // 🔍 DEBUG: Mostrar ejemplos de datos Aternity
        if (aternityDevices.length > 0) {
          console.log('🔍 EJEMPLO DE DATOS ATERNITY:');
          const sample = aternityDevices[0];
          console.log({
            DEVICE_NAME: sample.DEVICE_NAME,
            USERNAME: sample.USERNAME,
            DEVICE_IP_ADDRESS: sample.DEVICE_IP_ADDRESS,
            USER_DOMAIN: sample.USER_DOMAIN,
            DEVICE_DOMAIN: sample.DEVICE_DOMAIN,
            LOCATION_CITY: sample.LOCATION_CITY,
            BUSINESS_LOCATION: sample.BUSINESS_LOCATION
          });
        }
        
      } catch (aternityError) {
        console.warn('⚠️ Error obteniendo datos de Aternity:', aternityError.message);
      }

      // 🎯 TRACKING DE DISPOSITIVOS UTILIZADOS (evitar duplicados)
      const usedAternityDevices = new Set();

      // 🚀 ALGORITMO DE CORRELACIÓN ESTRICTO
      const correlatedData = vmPicMachines.map(vmPic => {
        
        // 🧹 LIMPIEZA ROBUSTA DE NOMBRES
        const cleanMachineName = vmPic.nombre_maquina
          .replace(/^TELECOM\\+/g, '')    // Quitar prefijo TELECOM con backslashes
          .replace(/\\/g, '')             // Quitar todos los backslashes
          .trim()
          .toUpperCase();

        // 🧹 LIMPIAR USUARIO (manejar formatos E/u)
        const cleanUser = vmPic.usuario_asociado ? vmPic.usuario_asociado.trim() : '';
        
        // 🧹 IPs VÁLIDAS (no 0.0.0.0)
        const validIPs = [
          vmPic.ip_punto_final,
          vmPic.direccion_ip
        ].filter(ip => ip && ip !== '0.0.0.0' && ip !== '');

        // 🎯 CORRELACIÓN ESTRICTA POR PRIORIDAD
        let aternityMatch = null;
        let matchMethod = 'Sin match';
        let matchScore = 0;
        let matchReason = '';

        // 🥇 PRIORIDAD 1: IP EXACTA (máxima confianza)
        if (!aternityMatch && validIPs.length > 0) {
          aternityMatch = aternityDevices.find(aternity => {
            const aternityIP = (aternity.DEVICE_IP_ADDRESS || '').trim();
            const deviceId = aternity.DEVICE_NAME;
            
            // Verificar que no esté ya usado Y que la IP coincida exactamente
            return !usedAternityDevices.has(deviceId) &&
                   validIPs.includes(aternityIP) && 
                   aternityIP !== '0.0.0.0';
          });
          
          if (aternityMatch) {
            matchMethod = 'IP Exacta';
            matchScore = 15;
            matchReason = `IP ${aternityMatch.DEVICE_IP_ADDRESS} coincide exactamente`;
            usedAternityDevices.add(aternityMatch.DEVICE_NAME);
            console.log(`🎯 IP EXACTA: ${cleanUser} (${validIPs.join(',')}) -> ${aternityMatch.DEVICE_NAME} (${aternityMatch.DEVICE_IP_ADDRESS})`);
          }
        }

        // 🥈 PRIORIDAD 2: USUARIO EXACTO (alta confianza)
        if (!aternityMatch && cleanUser) {
          aternityMatch = aternityDevices.find(aternity => {
            const aternityUser = (aternity.USERNAME || '').trim();
            const aternityUserDomain = (aternity.USER_DOMAIN || '').trim();
            const deviceId = aternity.DEVICE_NAME;
            
            // Verificar que no esté ya usado
            if (usedAternityDevices.has(deviceId)) return false;
            
            // Solo matches exactos
            if (aternityUser === cleanUser || aternityUserDomain === cleanUser) {
              return true;
            }
            
            // Match case-insensitive pero exacto
            if (aternityUser.toLowerCase() === cleanUser.toLowerCase() || 
                aternityUserDomain.toLowerCase() === cleanUser.toLowerCase()) {
              return true;
            }
            
            return false;
          });
          
          if (aternityMatch) {
            matchMethod = 'Usuario Exacto';
            matchScore = 12;
            matchReason = `Usuario ${cleanUser} coincide con ${aternityMatch.USERNAME || aternityMatch.USER_DOMAIN}`;
            usedAternityDevices.add(aternityMatch.DEVICE_NAME);
            console.log(`👤 USUARIO EXACTO: ${cleanUser} -> ${aternityMatch.DEVICE_NAME} (${aternityMatch.USERNAME})`);
          }
        }

        // 🥉 PRIORIDAD 3: UBICACIÓN ESPECÍFICA (media confianza)
        if (!aternityMatch && vmPic.call_center_asignado) {
          const callCenterName = vmPic.call_center_asignado.toLowerCase();
          
          aternityMatch = aternityDevices.find(aternity => {
            const city = (aternity.LOCATION_CITY || '').toLowerCase();
            const state = (aternity.LOCATION_STATE || '').toLowerCase();
            const business = (aternity.BUSINESS_LOCATION || '').toLowerCase();
            const deviceId = aternity.DEVICE_NAME;
            
            // Verificar que no esté ya usado
            if (usedAternityDevices.has(deviceId)) return false;
            
            // Mapeo MUY específico de call centers a ubicaciones
            const specificMatches = {
              // Solo matches muy específicos
              'apex chaco [excv]': ['resistencia', 'chaco'],
              'konecta chaco': ['resistencia', 'chaco'],
              'cct rosario': ['rosario'],
              'rio iv': ['rio cuarto'],
              'alta cordoba': ['cordoba'],
              'paseo colon': ['buenos aires', 'caba'],
              'teleperformance tuc': ['tucuman']
            };
            
            // Buscar solo en matches específicos
            for (const [ccPattern, locations] of Object.entries(specificMatches)) {
              if (callCenterName.includes(ccPattern)) {
                return locations.some(loc => 
                  city.includes(loc) || state.includes(loc) || business.includes(loc)
                );
              }
            }
            
            return false;
          });
          
          if (aternityMatch) {
            matchMethod = 'Ubicación Específica';
            matchScore = 8;
            matchReason = `Call Center ${vmPic.call_center_asignado} coincide con ubicación ${aternityMatch.LOCATION_CITY || aternityMatch.LOCATION_STATE}`;
            usedAternityDevices.add(aternityMatch.DEVICE_NAME);
            console.log(`🏢 UBICACIÓN: ${vmPic.call_center_asignado} -> ${aternityMatch.DEVICE_NAME} (${aternityMatch.LOCATION_CITY})`);
          }
        }

        // 🏅 PRIORIDAD 4: RANGOS DE IP (baja confianza)
        if (!aternityMatch && validIPs.length > 0) {
          aternityMatch = aternityDevices.find(aternity => {
            const aternityIP = (aternity.DEVICE_IP_ADDRESS || '').trim();
            const deviceId = aternity.DEVICE_NAME;
            
            // Verificar que no esté ya usado
            if (usedAternityDevices.has(deviceId)) return false;
            if (!aternityIP || aternityIP === '0.0.0.0') return false;
            
            // Solo subnets /24 (mismo rango exacto)
            for (const vmIP of validIPs) {
              if (vmIP === '0.0.0.0') continue;
              
              const vmSubnet = vmIP.split('.').slice(0, 3).join('.');
              const aternitySubnet = aternityIP.split('.').slice(0, 3).join('.');
              
              if (vmSubnet === aternitySubnet) {
                return true;
              }
            }
            
            return false;
          });
          
          if (aternityMatch) {
            matchMethod = 'Rango IP';
            matchScore = 5;
            matchReason = `IP ${validIPs[0]} está en el mismo rango que ${aternityMatch.DEVICE_IP_ADDRESS}`;
            usedAternityDevices.add(aternityMatch.DEVICE_NAME);
            console.log(`🌐 RANGO IP: ${validIPs.join(',')} -> ${aternityMatch.DEVICE_NAME} (${aternityMatch.DEVICE_IP_ADDRESS})`);
          }
        }

        return {
          vmPicData: {
            ...vmPic,
            cleanMachineName,
            cleanUser,
            validIPs
          },
          aternityData: aternityMatch || null,
          hasAternityData: !!aternityMatch,
          matchMethod,
          matchScore,
          matchReason,
          correlationDetails: {
            cleanName: cleanMachineName,
            originalName: vmPic.nombre_maquina,
            user: cleanUser,
            ips: validIPs,
            aternityDeviceName: aternityMatch ? aternityMatch.DEVICE_NAME : null,
            aternityUser: aternityMatch ? aternityMatch.USERNAME : null,
            aternityIP: aternityMatch ? aternityMatch.DEVICE_IP_ADDRESS : null,
            reason: matchReason
          }
        };
      });

      // 📊 ESTADÍSTICAS DETALLADAS + MÉTRICAS AVANZADAS
      
      // Calcular correlación por call center
      const callCenterStats = {};
      for (const item of correlatedData) {
        const cc = item.vmPicData.call_center_asignado || 'Sin Call Center';
        if (!callCenterStats[cc]) {
          callCenterStats[cc] = { total: 0, correlacionadas: 0 };
        }
        callCenterStats[cc].total++;
        if (item.hasAternityData) {
          callCenterStats[cc].correlacionadas++;
        }
      }
      
      // Agregar porcentajes
      for (const cc in callCenterStats) {
        callCenterStats[cc].porcentaje = callCenterStats[cc].total > 0 ? 
          Math.round((callCenterStats[cc].correlacionadas / callCenterStats[cc].total) * 100) : 0;
      }
      
      const stats = {
        totalVMPIC: vmPicMachines.length,
        withAternityData: correlatedData.filter(item => item.hasAternityData).length,
        aternityDevicesTotal: aternityDevices.length,
        aternityDevicesUsed: usedAternityDevices.size,
        correlationPercentage: vmPicMachines.length > 0 ? 
          Math.round((correlatedData.filter(item => item.hasAternityData).length / vmPicMachines.length) * 100) : 0,
        
        // Métricas avanzadas
        advancedMetrics: {
          // Correlación por call center
          callCenterCorrelation: callCenterStats,
          
          // Correlación por tipo de IP
          ipTypeCorrelation: {
            validIPs: correlatedData.filter(item => item.vmPicData.validIPs.length > 0).length,
            zeroIPs: correlatedData.filter(item => 
              item.vmPicData.ip_punto_final === '0.0.0.0' && 
              item.vmPicData.direccion_ip === '0.0.0.0'
            ).length
          },
          
          // Calidad de correlación por score
          qualityDistribution: {
            highQuality: correlatedData.filter(item => item.matchScore >= 12).length, // IP exacta, Usuario
            mediumQuality: correlatedData.filter(item => item.matchScore >= 8 && item.matchScore < 12).length, // Ubicación
            lowQuality: correlatedData.filter(item => item.matchScore > 0 && item.matchScore < 8).length // Rangos, etc.
          },
          
          // Dispositivos únicos vs múltiples correlaciones
          deviceUsage: {
            uniqueDevices: usedAternityDevices.size,
            totalCorrelations: correlatedData.filter(item => item.hasAternityData).length,
            duplicateRatio: correlatedData.filter(item => item.hasAternityData).length > 0 ? 
              Math.round((usedAternityDevices.size / correlatedData.filter(item => item.hasAternityData).length) * 100) : 0
          }
        },
        matchMethods: {
          'IP Exacta': correlatedData.filter(item => item.matchMethod === 'IP Exacta').length,
          'Usuario Exacto': correlatedData.filter(item => item.matchMethod === 'Usuario Exacto').length,
          'Ubicación Específica': correlatedData.filter(item => item.matchMethod === 'Ubicación Específica').length,
          'Rango IP': correlatedData.filter(item => item.matchMethod === 'Rango IP').length,
          'Sin match': correlatedData.filter(item => item.matchMethod === 'Sin match').length,
        }
      };

      console.log('📊 Estadísticas de correlación ESTRICTAS:', stats);
      console.log(`🎯 Dispositivos únicos utilizados: ${usedAternityDevices.size}/${aternityDevices.length}`);

      res.json({
        success: true,
        data: {
          ...stats,
          correlatedData: correlatedData.slice(0, 100) // Mostrar primeros 100 para performance
        }
      });

    } catch (error) {
      console.error('❌ Error correlacionando datos VM PIC + Aternity:', error);
      res.status(500).json({
        success: false,
        message: 'Error correlacionando datos',
        error: error.message
      });
    }
  }

  // RENDIMIENTO POR CALL CENTER MEJORADO
  static async getPerformanceByCallCenter(req, res) {
    try {
      const db = require('../config/db');
      const client = AternityController.getAternityClient();
      
      console.log('🔍 Obteniendo rendimiento por call center (MEJORADO)...');
      
      // 🚀 CONSULTA MEJORADA DE CALL CENTERS
      const [callCenters] = await db.query(`
        SELECT 
          call_center_asignado,
          localidad_call_center,
          tipo_contrato,
          COUNT(*) as total_sesiones,
          COUNT(DISTINCT nombre_maquina) as maquinas_unicas,
          COUNT(CASE WHEN estado_sesion = 'Active' THEN 1 END) as sesiones_activas,
          COUNT(CASE WHEN es_vm_pic = 1 THEN 1 END) as sesiones_vm_pic,
          AVG(CASE WHEN es_vm_pic = 1 THEN 1 ELSE 0 END) * 100 as porcentaje_vm_pic
        FROM sesiones_data 
        WHERE call_center_asignado IS NOT NULL
        GROUP BY call_center_asignado, localidad_call_center, tipo_contrato
        ORDER BY total_sesiones DESC
        LIMIT 50
      `);

      console.log(`📊 Encontrados ${callCenters.length} call centers`);

      // Obtener métricas de aplicaciones de Aternity
      let aternityApplications = [];
      try {
        const appResponse = await client.get('/APPLICATIONS_DAILY', {
          params: {
            '$top': 100,
            '$select': 'APPLICATION_NAME,DEVICE_NAME,RESPONSE_TIME_AVERAGE,USER_EXPERIENCE_SCORE,DATE'
          }
        });
        
        aternityApplications = appResponse.data.value || [];
        console.log(`📊 Obtenidas ${aternityApplications.length} métricas de aplicaciones`);
        
      } catch (aternityError) {
        console.warn('⚠️ Error obteniendo métricas de aplicaciones:', aternityError.message);
      }

      // Enriquecer call centers con datos
      const enrichedData = callCenters.map(callCenter => {
        const performanceMetrics = {
          utilizationRate: callCenter.total_sesiones > 0 ? 
            (callCenter.sesiones_activas / callCenter.total_sesiones * 100).toFixed(1) : 0,
          machinesPerSession: callCenter.maquinas_unicas > 0 ? 
            (callCenter.total_sesiones / callCenter.maquinas_unicas).toFixed(1) : 0,
          vmPicPercentage: parseFloat(callCenter.porcentaje_vm_pic || 0).toFixed(1),
          contractType: callCenter.tipo_contrato
        };

        return {
          ...callCenter,
          performanceMetrics,
          aternityApplications: aternityApplications.slice(0, 3)
        };
      });

      res.json({
        success: true,
        data: {
          callCentersCount: callCenters.length,
          totalSessions: callCenters.reduce((sum, cc) => sum + cc.total_sesiones, 0),
          totalVMPicSessions: callCenters.reduce((sum, cc) => sum + cc.sesiones_vm_pic, 0),
          aternityApplicationsCount: aternityApplications.length,
          callCenters: enrichedData
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo rendimiento por call center:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo métricas de rendimiento',
        error: error.message
      });
    }
  }

  // Test connection (VERSIÓN MEJORADA CON MÚLTIPLES TESTS)
  static async testConnection(req, res) {
  try {
  const client = AternityController.getAternityClient();
  
  console.log('🔍 Probando conexión con Aternity...');
  console.log('📍 URL Base:', ATERNITY_BASE_URL);
  console.log('👤 Usuario:', ATERNITY_USER);
  console.log('🔐 Password configurado:', ATERNITY_PASSWORD ? 'Sí' : 'No');
  
  let response;
  let testResult = {};
  
  // TEST 1: Intentar con la URL raíz del servicio OData
  try {
    console.log('🔄 Test 1: Probando URL raíz del servicio...');
    response = await client.get('');
    testResult.rootTest = { success: true, status: response.status };
    console.log('✅ Test 1 exitoso - Servicio OData respondiendo');
  } catch (rootError) {
  console.log('❌ Test 1 falló:', rootError.response?.status, rootError.response?.statusText);
  testResult.rootTest = { 
    success: false, 
  status: rootError.response?.status,
  error: rootError.message 
  };
  }
  
  // TEST 2: Intentar con $metadata (información del esquema)
  try {
        console.log('🔄 Test 2: Probando endpoint de metadatos...');
      response = await client.get('$metadata');
    testResult.metadataTest = { success: true, status: response.status };
    console.log('✅ Test 2 exitoso - Metadata obtenido');
  } catch (metaError) {
    console.log('❌ Test 2 falló:', metaError.response?.status, metaError.response?.statusText);
  testResult.metadataTest = { 
    success: false, 
    status: metaError.response?.status,
    error: metaError.message 
  };
  }
  
  // TEST 3: Intentar con una entidad común (DEVICES)
  try {
  console.log('🔄 Test 3: Probando entidad DEVICES...');
  response = await client.get('/DEVICES?$top=1');
    testResult.devicesTest = { 
    success: true, 
    status: response.status,
      recordCount: response.data.value?.length || 0
  };
  console.log('✅ Test 3 exitoso - Entidad DEVICES accesible');
  } catch (devicesError) {
    console.log('❌ Test 3 falló:', devicesError.response?.status, devicesError.response?.statusText);
    testResult.devicesTest = { 
    success: false, 
    status: devicesError.response?.status,
    error: devicesError.message 
    };
    }
      
      // Determinar si al menos uno funcionó
      const anySuccess = testResult.rootTest?.success || testResult.metadataTest?.success || testResult.devicesTest?.success;
      
      res.json({
        success: anySuccess,
        message: anySuccess ? 'Conexión con Aternity API exitosa' : 'Todos los tests de conexión fallaron',
        tests: testResult,
        details: {
          url: ATERNITY_BASE_URL,
          user: ATERNITY_USER,
          passwordConfigured: !!ATERNITY_PASSWORD,
          recommendation: !anySuccess ? 'Verificar credenciales o contactar administrador de Aternity' : 'API funcionando correctamente'
        }
      });

    } catch (error) {
      console.error('❌ Error general probando conexión con Aternity:', error);
      
      // DIAGNÓSTICO DETALLADO
      let errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method
      };
      
      // ERRORES ESPECÍFICOS
      if (error.response?.status === 412) {
        errorDetails.diagnosis = 'Error 412: Credenciales inválidas o token expirado';
        errorDetails.solution = 'Contactar administrador de Aternity para renovar credenciales';
      } else if (error.response?.status === 401) {
        errorDetails.diagnosis = 'Error 401: No autorizado - credenciales incorrectas';
        errorDetails.solution = 'Verificar usuario y contraseña de Aternity';
      } else if (error.code === 'ENOTFOUND') {
        errorDetails.diagnosis = 'Error de red: No se pudo resolver el DNS';
        errorDetails.solution = 'Verificar conexión a internet y URL de Aternity';
      }
      
      res.status(500).json({
        success: false,
        message: 'Error conectando con Aternity API',
        error: errorDetails
      });
    }
  }
}

module.exports = AternityController;