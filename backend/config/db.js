// Versión mejorada de db.js con manejo robusto de reconexiones
const sql = require('mssql');
require('dotenv').config();

// Detectar si es servidor remoto o local
const isRemoteServer = process.env.DB_HOST && !process.env.DB_HOST.includes('\\');

// Log de configuración para debug
console.log('🔧 Configuración de Base de Datos:');
console.log('   Host:', process.env.DB_HOST || 'GUSLAPTOP\\SQLEXPRESS');
console.log('   Port:', process.env.DB_PORT || 60167);
console.log('   Database:', process.env.DB_NAME || 'taskmanagementsystem');
console.log('   User:', process.env.DB_USER || 'taskapp');
console.log('   Servidor Remoto:', isRemoteServer ? 'SÍ' : 'NO');
console.log('   Instance Name:', isRemoteServer ? 'N/A (remoto)' : 'SQLEXPRESS');
console.log('');

// Configuración de SQL Server con opciones de reconexión mejoradas
const config = {
  server: process.env.DB_HOST || 'GUSLAPTOP\\SQLEXPRESS',
  port: parseInt(process.env.DB_PORT) || 60167,
  database: process.env.DB_NAME || 'taskmanagementsystem',
  user: process.env.DB_USER || 'taskapp',
  password: process.env.DB_PASSWORD || 'Task123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    // Solo usar instanceName si NO es servidor remoto
    ...(isRemoteServer ? {} : { instanceName: 'SQLEXPRESS' })
  },
  pool: {
    max: 10,
    min: 2, // Mantener al menos 2 conexiones activas
    idleTimeoutMillis: 60000, // Aumentar timeout de inactividad
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 60000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
  connectionTimeout: 60000,
  requestTimeout: 60000,
  // Configuraciones adicionales para mejorar la estabilidad
  parseJSON: true,
  stream: false
};

// Variables de estado del pool
let pool = null;
let isConnecting = false;
let isDestroyed = false;

// Función para limpiar pool existente
const cleanupPool = async () => {
  if (pool) {
    try {
      console.log('🧹 Limpiando pool existente...');
      isDestroyed = true;
      await pool.close();
    } catch (error) {
      console.log('⚠️ Error limpiando pool (esperado):', error.message);
    } finally {
      pool = null;
      isDestroyed = false;
    }
  }
};

// Función para crear/recrear el pool de conexiones
const createPool = async () => {
  try {
    // Limpiar pool anterior si existe
    await cleanupPool();

    console.log('🔄 Creando nuevo pool de conexiones...');
    pool = new sql.ConnectionPool(config);
    
    // Event listeners para el pool
    pool.on('connect', () => {
      console.log('✅ Pool conectado a SQL Server');
    });

    pool.on('error', async (error) => {
      console.error('❌ Error en pool de conexiones:', error.message);
      // Marcar como no válido para forzar recreación
      if (pool) {
        pool._connected = false;
      }
    });

    // Importante: await la conexión
    await pool.connect();
    console.log('✅ Pool de conexiones creado exitosamente');
    return pool;
  } catch (error) {
    console.error('❌ Error creando pool:', error.message);
    pool = null;
    throw error;
  }
};

// Función para verificar si el pool está realmente conectado
const isPoolHealthy = () => {
  return pool && 
         !isDestroyed && 
         pool.connected && 
         pool._connected !== false;
};

// Función para obtener pool con reconexión automática
const getPool = async () => {
  const maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      // Si ya hay un proceso de conexión en curso, esperar
      if (isConnecting) {
        let waitAttempts = 0;
        while (isConnecting && waitAttempts < 50) { // Esperar máximo 5 segundos
          await new Promise(resolve => setTimeout(resolve, 100));
          waitAttempts++;
        }
      }

      // Verificar si el pool está sano
      if (isPoolHealthy()) {
        return pool;
      }

      // Si no hay pool sano, crear uno nuevo
      isConnecting = true;
      
      try {
        await createPool();
        return pool;
      } finally {
        isConnecting = false;
      }

    } catch (error) {
      attempts++;
      console.error(`❌ Error obteniendo pool (intento ${attempts}/${maxRetries}):`, error.message);
      
      if (attempts >= maxRetries) {
        throw new Error(`No se pudo conectar después de ${maxRetries} intentos: ${error.message}`);
      }
      
      // Esperar antes del siguiente intento
      console.log(`🔄 Reintentando en 2 segundos... (${attempts}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      isConnecting = false;
    }
  }
};

// Función para convertir sintaxis MySQL a SQL Server
const convertMySQLToSQLServer = (queryText) => {
  let convertedQuery = queryText;
  
  // 1. Convertir GROUP_CONCAT a STRING_AGG (SQL Server 2017+)
  convertedQuery = convertedQuery.replace(
    /GROUP_CONCAT\s*\(\s*([^)]+)\s*\)/gi,
    'STRING_AGG($1, \',\')'
  );
  
  // 2. Convertir NOW() a GETDATE()
  convertedQuery = convertedQuery.replace(/\bNOW\s*\(\s*\)/gi, 'GETDATE()');
  
  // 3. Convertir CURRENT_TIMESTAMP() a GETDATE()
  convertedQuery = convertedQuery.replace(/\bCURRENT_TIMESTAMP\s*\(\s*\)/gi, 'GETDATE()');
  
  // 4. Convertir AUTO_INCREMENT a IDENTITY
  convertedQuery = convertedQuery.replace(/\bAUTO_INCREMENT\b/gi, 'IDENTITY(1,1)');
  
  // 5. Convertir backticks a corchetes
  convertedQuery = convertedQuery.replace(/`([^`]+)`/g, '[$1]');
  
  // 6. Convertir LIMIT a TOP
  convertedQuery = convertedQuery.replace(
    /(SELECT(?:\s+DISTINCT)?)(.*?)\s+LIMIT\s+(\d+)(?:\s*$|\s*;)/gi,
    '$1 TOP $3$2'
  );
  
  return convertedQuery;
};

// FUNCIÓN MEJORADA CON MANEJO ROBUSTO DE RECONEXIONES
const query = async (queryText, params = [], retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    // Obtener conexión con lógica de reconexión
    const connection = await getPool();
    const request = connection.request();
    
    // Convertir sintaxis MySQL a SQL Server
    let sqlQuery = convertMySQLToSQLServer(queryText);
    
    // Detectar si es un INSERT
    const isInsert = sqlQuery.toLowerCase().trim().startsWith('insert into');
    const isUpdate = sqlQuery.toLowerCase().trim().startsWith('update ');
    const isDelete = sqlQuery.toLowerCase().trim().startsWith('delete ');
    
    // Agregar parámetros
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        if (param === null || param === undefined) {
          request.input(`param${index}`, sql.NVarChar, param);
        } else if (typeof param === 'number') {
          if (Number.isInteger(param)) {
            request.input(`param${index}`, sql.Int, param);
          } else {
            request.input(`param${index}`, sql.Float, param);
          }
        } else if (typeof param === 'boolean') {
          request.input(`param${index}`, sql.Bit, param);
        } else if (param instanceof Date) {
          request.input(`param${index}`, sql.DateTime, param);
        } else {
          request.input(`param${index}`, sql.NVarChar, param);
        }
      });
      
      // Convertir ? a @param0, @param1, etc.
      let paramIndex = 0;
      sqlQuery = sqlQuery.replace(/\?/g, () => `@param${paramIndex++}`);
    }
    
    // Solo mostrar logs en desarrollo para evitar spam
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Query original:', queryText.replace(/\s+/g, ' ').trim());
      console.log('🔄 Query convertida:', sqlQuery.replace(/\s+/g, ' ').trim());
      if (params.length > 0) {
        console.log('📝 Parámetros:', params);
      }
    }
    
    // Ejecutar la consulta con timeout
    const result = await Promise.race([
      request.query(sqlQuery),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 30000)
      )
    ]);
    
    // Procesar resultado según el tipo de consulta
    let insertId = null;
    let affectedRows = 0;
    
    if (isInsert) {
      if (result.recordset && result.recordset.length > 0 && result.recordset[0].id) {
        insertId = result.recordset[0].id;
      }
    }
    
    if (isUpdate || isDelete) {
      if (result.rowsAffected && Array.isArray(result.rowsAffected)) {
        affectedRows = result.rowsAffected[0] || 0;
      } else if (typeof result.rowsAffected === 'number') {
        affectedRows = result.rowsAffected;
      }
    }
    
    const mysqlLikeResult = [result.recordset || []];
    mysqlLikeResult[0].insertId = insertId;
    mysqlLikeResult[0].affectedRows = affectedRows;
    
    return mysqlLikeResult;
    
  } catch (error) {
    console.error('❌ Error en consulta:', error.message);
    
    // Verificar si es un error de conexión y aún tenemos reintentos
    const isConnectionError = (
      error.code === 'ECONNCLOSED' || 
      error.code === 'ENOTOPEN' ||
      error.code === 'ETIMEOUT' ||
      error.message.includes('Connection is closed') ||
      error.message.includes('Connection not yet open') ||
      error.message.includes('Query timeout') ||
      error.message.includes('The connection is broken')
    );
    
    if (isConnectionError && retryCount < maxRetries) {
      console.log(`🔄 Error de conexión detectado. Reintentando consulta... (${retryCount + 1}/${maxRetries})`);
      
      // Marcar pool como no válido para forzar recreación
      if (pool) {
        pool._connected = false;
      }
      
      // Esperar un poco antes del reintento
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      
      // Reintentar consulta
      return await query(queryText, params, retryCount + 1);
    }
    
    throw error;
  }
};

// Función para obtener conexión (compatible con mysql2 pool)
const getConnection = async () => {
  const connection = await getPool();
  
  return {
    query: async (queryText, params = []) => {
      return await query(queryText, params);
    },
    release: () => {
      // Pool de conexiones se maneja automáticamente
    }
  };
};

// Función para verificar estado de la conexión
const checkConnection = async () => {
  try {
    const result = await query('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('❌ Check de conexión falló:', error.message);
    return false;
  }
};

// Función de limpieza para cerrar el pool correctamente
const closePool = async () => {
  if (pool) {
    try {
      console.log('🔄 Cerrando pool de conexiones...');
      await pool.close();
      console.log('✅ Pool de conexiones cerrado correctamente');
    } catch (error) {
      console.error('❌ Error cerrando pool:', error.message);
    } finally {
      pool = null;
    }
  }
};

// Función para reiniciar pool manualmente
const restartPool = async () => {
  console.log('🔄 Reiniciando pool de conexiones manualmente...');
  await cleanupPool();
  return await getPool();
};

// Manejar cierre de aplicación
process.on('SIGINT', async () => {
  console.log('🔄 Cerrando pool de conexiones (SIGINT)...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando pool de conexiones (SIGTERM)...');
  await closePool();
  process.exit(0);
});

// Función de mantenimiento para verificar conexión cada 5 minutos
const startHealthCheck = () => {
  setInterval(async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🏥 Verificación de salud del pool...');
      const isHealthy = await checkConnection();
      if (!isHealthy) {
        console.log('⚠️ Pool no saludable, intentando reiniciar...');
        try {
          await restartPool();
          console.log('✅ Pool reiniciado exitosamente');
        } catch (error) {
          console.error('❌ Error reiniciando pool:', error.message);
        }
      } else {
        console.log('✅ Pool saludable');
      }
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
};

// Inicializar pool y health check
(async () => {
  try {
    await getPool();
    console.log('🚀 Sistema de base de datos inicializado');
    
    // Iniciar verificación de salud solo en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      startHealthCheck();
    }
  } catch (error) {
    console.error('❌ Error inicializando sistema de base de datos:', error.message);
    // No terminar el proceso, permitir que se intente conectar más tarde
  }
})();

module.exports = {
  query,
  getPool,
  getConnection,
  checkConnection,
  closePool,
  restartPool,
  sql
};