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