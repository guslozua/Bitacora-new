import axios from 'axios';

const token = localStorage.getItem('token');

if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interfaces
export interface User {
  id: number;
  id_usuario?: number;  // Añadido para manejar respuestas de API
  nombre: string;
  email: string;
  avatar?: string;
  rol?: string;
  fecha_asignacion?: string;
  // Campos adicionales que pueden estar presentes en respuestas de API
  id_proyecto?: number;
  id_tarea?: number;
  id_subtarea?: number;
}

// Tipos de elementos a los que se pueden asignar usuarios
export type ItemType = 'project' | 'task' | 'subtask';

// Base URL para API
const API_BASE_URL = 'http://localhost:5000/api';

// Cache para usuarios asignados por tipo de elemento y ID
interface AssignedUsersCache {
  [key: string]: {
    data: User[];
    lastFetch: number;
  }
}

const assignedUsersCache: AssignedUsersCache = {};

// Función para extraer el ID numérico de un ID con prefijo
export const getNumericId = (id: string | number): string => {
  if (typeof id !== 'string') return id.toString();
  
  // Extraer el ID numérico dependiendo del prefijo
  if (id.includes('project-')) {
    return id.split('project-')[1];
  } else if (id.includes('task-')) {
    return id.split('task-')[1];
  } else if (id.includes('subtask-')) {
    // Para subtareas, el formato puede ser "subtask-123-parent-456"
    const match = id.match(/subtask-(\d+)/);
    return match ? match[1] : id;
  }
  
  // Si no tiene prefijo, devolver el ID tal cual
  return id;
};

// Función para obtener el ID de la tarea padre de una subtarea
export const getParentTaskId = (subtaskId: string): string | null => {
  if (typeof subtaskId !== 'string') return null;
  
  // Si es una subtarea con formato "subtask-123-parent-456"
  if (subtaskId.includes('-parent-')) {
    const match = subtaskId.match(/-parent-(\d+)/);
    return match ? match[1] : null;
  }
  
  return null;
};

// Función auxiliar para obtener la configuración de autenticación
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'x-auth-token': token || '',
      'Content-Type': 'application/json'
    }
  };
};

// Función para obtener la clave de caché para usuarios asignados
const getCacheKey = (itemType: ItemType, itemId: string): string => {
  return `${itemType}-${getNumericId(itemId)}`;
};

// Construir la URL correcta de acuerdo al tipo de elemento
const getApiEndpoint = (itemType: ItemType, itemId: string): string => {
  const numericId = getNumericId(itemId);
  
  switch (itemType) {
    case 'project':
      return `${API_BASE_URL}/projects/${numericId}/users`;
    case 'task':
      return `${API_BASE_URL}/tasks/${numericId}/users`;
    case 'subtask':
      // Ruta directa a subtasks
      return `${API_BASE_URL}/subtasks/${numericId}/users`;
    default:
      throw new Error(`Tipo de elemento no soportado: ${itemType}`);
  }
};

// Obtener todos los usuarios del sistema
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    console.log('[userService] Obteniendo todos los usuarios');
    
    // Intentar ambos endpoints posibles
    let users: User[] = [];
    
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, getAuthConfig());
      console.log('[userService] Respuesta de /users:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data.success && Array.isArray(response.data.usuarios)) {
        users = response.data.usuarios;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      }
    } catch (error: any) {
      console.log('[userService] Error con /users, probando /usuarios');
      
      try {
        const response = await axios.get(`${API_BASE_URL}/usuarios`, getAuthConfig());
        console.log('[userService] Respuesta de /usuarios:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data.success && Array.isArray(response.data.usuarios)) {
          users = response.data.usuarios;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        }
      } catch (backupError) {
        console.error('[userService] Error con ambos endpoints:', backupError);
      }
    }
    
    return users;
  } catch (error: any) {
    console.error('[userService] Error al obtener usuarios:', error.response?.data || error.message);
    throw error;
  }
};

// Obtener usuarios asignados a un elemento con caché opcional
export const fetchAssignedUsers = async (
  itemType: ItemType, 
  itemId: string, 
  skipCache = false
): Promise<User[]> => {
  const cacheKey = getCacheKey(itemType, itemId);
  const now = Date.now();
  
  // Verificar si tenemos datos en caché válidos
  if (
    !skipCache && 
    assignedUsersCache[cacheKey] && 
    now - assignedUsersCache[cacheKey].lastFetch < 10000 // 10 segundos
  ) {
    console.log(`[userService] Usando datos en caché para usuarios de ${itemType} ${itemId}`);
    return assignedUsersCache[cacheKey].data;
  }
  
  try {
    const endpoint = getApiEndpoint(itemType, itemId);
    console.log(`[userService] Obteniendo usuarios asignados de: ${endpoint}`);
    
    const response = await axios.get(endpoint, getAuthConfig());
    console.log(`[userService] Respuesta de usuarios asignados:`, response.data);
    
    let users: User[] = [];
    
    if (response.data && Array.isArray(response.data)) {
      users = response.data;
    } else if (response.data.success && Array.isArray(response.data.usuarios)) {
      users = response.data.usuarios;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      users = response.data.data;
    } else if (response.data.users && Array.isArray(response.data.users)) {
      users = response.data.users;
    } else {
      console.warn('[userService] Formato de respuesta inesperado:', response.data);
      users = [];
    }
    
    // Procesar usuarios para asegurarnos de tener todos los datos necesarios
    const processedUsers = users.map(user => {
      // Asegurarnos de que tenemos id_usuario (crucial para desasignación)
      if (user.id_usuario === undefined) {
        // Si no tenemos id_usuario explícito pero sabemos que 'id' es el de la asignación
        // y hay otras propiedades que indican que es una asignación, intentamos encontrar id_usuario
        if (user.id_proyecto || user.rol || user.fecha_asignacion) {
          console.warn('[userService] Respuesta de API sin id_usuario explícito:', user);
          // En este caso, no podemos determinar automáticamente el id_usuario
          // Buscamos otros campos que podrían tener el id del usuario
          const possibleUserIdFields = ['usuario_id', 'user_id', 'usuarioId', 'userId', 'id_user'];
          for (const field of possibleUserIdFields) {
            if ((user as any)[field] !== undefined) {
              user.id_usuario = (user as any)[field];
              console.log(`[userService] Se encontró id_usuario en campo alternativo: ${field}`);
              break;
            }
          }
        }
      }
      return user;
    });
    
    // Actualizar caché
    assignedUsersCache[cacheKey] = {
      data: processedUsers,
      lastFetch: now
    };
    
    return processedUsers;
  } catch (error: any) {
    console.error('[userService] Error al obtener usuarios asignados:', error.response?.data || error.message);
    throw error;
  }
};

// Asignar usuarios a un elemento - VERSIÓN MEJORADA CON ROLES
export const assignUsers = async (
  itemType: ItemType,
  itemId: string,
  userIds: number[],
  roles?: Record<number, string>
): Promise<boolean> => {
  try {
    if (userIds.length === 0) {
      throw new Error('Se debe proporcionar al menos un ID de usuario');
    }
    
    const numericId = getNumericId(itemId);
    const config = getAuthConfig();
    
    // Invalidar caché para este elemento
    const cacheKey = getCacheKey(itemType, itemId);
    delete assignedUsersCache[cacheKey];
    
    // Función para registrar resultados
    const logProgress = (userId: number, success: boolean, message: string) => {
      if (success) {
        console.log(`[userService] Usuario ${userId} asignado exitosamente: ${message}`);
      } else {
        console.error(`[userService] Error al asignar usuario ${userId}: ${message}`);
      }
    };
    
    // Verificar si hay roles específicos para cada usuario
    const userHasRole = (userId: number): boolean => {
      return roles !== undefined && roles[userId] !== undefined;
    };
    
    // Obtener el rol específico para un usuario
    const getRoleForUser = (userId: number): string => {
      if (roles && roles[userId]) {
        return roles[userId];
      }
      return 'colaborador'; // Rol predeterminado
    };
    
    // Función para manejar intentos de asignación
    const tryAssignment = async (userId: number): Promise<boolean> => {
      // Verificar si el usuario ya está asignado para evitar duplicados
      try {
        const assignedUsers = await fetchAssignedUsers(itemType, itemId, true); // Forzar refresco
        const isAlreadyAssigned = assignedUsers.some(u => 
          (u.id_usuario !== undefined ? u.id_usuario === userId : u.id === userId)
        );
        
        if (isAlreadyAssigned) {
          console.log(`[userService] Usuario ${userId} ya está asignado, omitiendo asignación`);
          return true; // Considerar como éxito
        }
      } catch (checkError) {
        // Si falla la verificación, continuamos con la asignación de todos modos
        console.log(`[userService] Error al verificar asignación previa del usuario ${userId}:`, checkError);
      }
      
      // Obtener el rol para este usuario
      const userRole = getRoleForUser(userId);
      
      // Arreglo de intentos con diferentes URLs y formatos de datos
      const attempts = [
        // Para proyectos, intentar con formato que incluye rol
        {
          method: 'post',
          url: `${API_BASE_URL}/${itemType}s/${numericId}/assign/${userId}`,
          data: { rol: userRole },
          description: `URL específica con rol: ${userRole}`
        },
        {
          method: 'post',
          url: getApiEndpoint(itemType, itemId),
          data: { userId, rol: userRole },
          description: `Formato estándar con rol: ${userRole}`
        },
        {
          method: 'post',
          url: getApiEndpoint(itemType, itemId),
          data: { id_usuario: userId, rol: userRole },
          description: `Formato id_usuario con rol: ${userRole}`
        },
        // Intentos sin especificar rol (por si acaso)
        {
          method: 'post',
          url: getApiEndpoint(itemType, itemId),
          data: { userId },
          description: 'Formato estándar sin rol'
        },
        {
          method: 'post',
          url: `${API_BASE_URL}/${itemType}s/${numericId}/assign/${userId}`,
          data: {},
          description: 'URL específica sin rol'
        },
        {
          method: 'post',
          url: getApiEndpoint(itemType, itemId),
          data: { id_usuario: userId },
          description: 'Formato id_usuario sin rol'
        },
        {
          method: 'post',
          url: getApiEndpoint(itemType, itemId),
          data: { user_id: userId, rol: userRole },
          description: `Formato user_id con rol: ${userRole}`
        },
        {
          method: 'post',
          url: getApiEndpoint(itemType, itemId),
          data: { id: userId, rol: userRole },
          description: `Formato id con rol: ${userRole}`
        },
        {
          method: 'put', // Algunos backends usan PUT
          url: getApiEndpoint(itemType, itemId),
          data: { usuarios: [{ id: userId, rol: userRole }] },
          description: `Método PUT con rol: ${userRole}`
        }
      ];
      
      // Intentar cada formato hasta que uno funcione
      for (const attempt of attempts) {
        try {
          console.log(`[userService] Intentando asignar usuario ${userId} usando ${attempt.description}`);
          
          if (attempt.method === 'post') {
            await axios.post(attempt.url, attempt.data, config);
          } else if (attempt.method === 'put') {
            await axios.put(attempt.url, attempt.data, config);
          }
          
          logProgress(userId, true, attempt.description);
          return true;
        } catch (error: any) {
          console.log(`[userService] Error con ${attempt.description} para usuario ${userId}:`, error.message);
          
          // Verificar si el error indica que el usuario ya estaba asignado
          if (
            error.response && 
            error.response.data && 
            (
              error.response.data.message?.includes('ya está asignado') ||
              error.response.data.message?.includes('already assigned') ||
              error.response.status === 409 // Conflict
            )
          ) {
            console.log(`[userService] Usuario ${userId} ya estaba asignado`);
            return true; // Considerar como éxito
          }
        }
      }
      
      // Si llegamos aquí, ningún intento funcionó
      logProgress(userId, false, 'Todos los intentos fallaron');
      return false;
    };
    
    // Procesar cada usuario - usar secuencial para evitar condiciones de carrera en el servidor
    const results = [];
    for (const userId of userIds) {
      results.push(await tryAssignment(userId));
    }
    
    // Si al menos uno se asignó con éxito, consideramos la operación exitosa
    if (results.some(success => success)) {
      return true;
    } else {
      throw new Error('No se pudo asignar ningún usuario');
    }
  } catch (error: any) {
    console.error('[userService] Error en assignUsers:', error.response?.data || error.message);
    throw error;
  }
};

// Función alternativa para asignar usuarios (backup)
export const assignUsersAlt = async (
  itemType: ItemType,
  itemId: string,
  userIds: number[]
): Promise<boolean> => {
  try {
    const endpoint = getApiEndpoint(itemType, itemId);
    console.log(`[userService] Asignando usuarios (método alternativo) a: ${endpoint}`, userIds);
    
    // Algunos backends utilizan PUT para añadir recursos en lugar de POST
    const response = await axios.put(endpoint, { usuarios: userIds }, getAuthConfig());
    console.log('[userService] Respuesta método alternativo:', response.data);
    
    return true;
  } catch (error: any) {
    console.error('[userService] Error en assignUsersAlt:', error.response?.data || error.message);
    throw error;
  }
};

// Desasignar un usuario de un elemento (versión mejorada)
export const removeUserAssignment = async (
  itemType: ItemType,
  itemId: string,
  userId: number
): Promise<any> => {
  const numericId = getNumericId(itemId);
  console.log(`[userService] Desasignando usuario ID ${userId} de ${itemType} con ID ${numericId}`);
  
  // Invalidar caché para este elemento
  const cacheKey = getCacheKey(itemType, itemId);
  delete assignedUsersCache[cacheKey];
  
  // Intentar diferentes formatos de URL para desasignar
  const urls = [
    `${API_BASE_URL}/${itemType}s/${numericId}/users/${userId}`,
    `${API_BASE_URL}/${itemType}s/${numericId}/user/${userId}`,
    `${API_BASE_URL}/${itemType}s/${numericId}/usuario/${userId}`,
    `${API_BASE_URL}/${itemType}s/${numericId}/desasignar/${userId}`,
    `${API_BASE_URL}/${itemType}s/${numericId}/unassign/${userId}`
  ];
  
  let lastError: any = null;
  
  // Intentar cada URL hasta que una funcione
  for (const url of urls) {
    try {
      console.log(`[userService] Intentando desasignar con URL: ${url}`);
      const res = await axios.delete(url, getAuthConfig());
      console.log(`[userService] Desasignación exitosa con URL: ${url}`, res.data);
      
      // Si llegamos aquí, la desasignación fue exitosa
      return res.data;
    } catch (error: any) {
      console.log(`[userService] Error al desasignar con URL ${url}:`, error.message);
      lastError = error;
      
      // Verificar si el error indica que el usuario ya no está asignado
      // (en cuyo caso consideramos que la operación fue exitosa)
      if (
        error.response && 
        error.response.data && 
        (
          error.response.data.message === 'El usuario no está asignado a este proyecto' ||
          error.response.data.message === 'El usuario no está asignado a esta tarea' ||
          error.response.data.message === 'El usuario no está asignado a esta subtarea' ||
          error.response.status === 404
        )
      ) {
        console.log('[userService] El usuario ya no estaba asignado, considerando operación exitosa');
        return { success: true, message: 'El usuario ya ha sido desasignado previamente' };
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  console.error(`[userService] Todos los intentos de desasignación fallaron:`, lastError);
  throw lastError;
};

// Función para actualizar el rol de un usuario
export const updateUserRole = async (
  itemType: ItemType,
  itemId: string,
  userId: number,
  newRole: string
): Promise<boolean> => {
  try {
    const numericId = getNumericId(itemId);
    const config = getAuthConfig();
    
    // Invalidar caché para este elemento
    const cacheKey = getCacheKey(itemType, itemId);
    delete assignedUsersCache[cacheKey];
    
    console.log(`[userService] Actualizando rol de usuario ${userId} a ${newRole} en ${itemType} ${numericId}`);
    
    // Arreglo de intentos con diferentes URLs y formatos de datos
    const attempts = [
      {
        method: 'put',
        url: `${API_BASE_URL}/${itemType}s/${numericId}/users/${userId}/role`,
        data: { rol: newRole },
        description: 'URL específica para rol'
      },
      {
        method: 'patch',
        url: `${API_BASE_URL}/${itemType}s/${numericId}/users/${userId}`,
        data: { rol: newRole },
        description: 'PATCH usuario'
      },
      {
        method: 'put',
        url: `${API_BASE_URL}/${itemType}s/${numericId}/users/${userId}`,
        data: { rol: newRole },
        description: 'PUT usuario'
      },
      {
        method: 'put',
        url: `${API_BASE_URL}/${itemType}s/${numericId}/roles`,
        data: { userId, rol: newRole },
        description: 'Endpoint de roles'
      },
      {
        method: 'post',
        url: `${API_BASE_URL}/${itemType}s/${numericId}/update-role`,
        data: { userId, rol: newRole },
        description: 'Endpoint actualizar rol'
      }
    ];
    
    // Intentar cada URL hasta que una funcione
    for (const attempt of attempts) {
      try {
        console.log(`[userService] Intentando actualizar rol con ${attempt.description}`);
        
        let response;
        if (attempt.method === 'put') {
          response = await axios.put(attempt.url, attempt.data, config);
        } else if (attempt.method === 'patch') {
          response = await axios.patch(attempt.url, attempt.data, config);
        } else if (attempt.method === 'post') {
          response = await axios.post(attempt.url, attempt.data, config);
        }
        
        console.log(`[userService] Rol actualizado exitosamente con ${attempt.description}:`, response?.data);
        return true;
      } catch (error: any) {
        console.log(`[userService] Error con ${attempt.description}:`, error.message);
      }
    }
    
    // Si ninguna URL funcionó, intentar desasignar y volver a asignar con el nuevo rol
    console.log('[userService] Intentando método alternativo: desasignar y reasignar con nuevo rol');
    
    try {
      // Primero desasignar
      await removeUserAssignment(itemType, itemId, userId);
      
      // Luego reasignar con el nuevo rol
      await assignUsers(itemType, itemId, [userId], { [userId]: newRole });
      
      console.log('[userService] Rol actualizado mediante método alternativo');
      return true;
    } catch (error: any) {
      console.error('[userService] Error en método alternativo para actualizar rol:', error);
      throw new Error(`No se pudo actualizar el rol: ${error.message}`);
    }
  } catch (error: any) {
    console.error('[userService] Error al actualizar rol:', error.response?.data || error.message);
    throw error;
  }
};

// Función para verificar todos los posibles endpoints
export const diagnoseAPI = async () => {
  console.log('=== DIAGNÓSTICO DE API ===');
  const endpoints = [
    { url: `${API_BASE_URL}/projects/1/users`, description: 'Usuarios de proyecto' },
    { url: `${API_BASE_URL}/tasks/1/users`, description: 'Usuarios de tarea' },
    { url: `${API_BASE_URL}/subtasks/1/users`, description: 'Usuarios de subtarea' },
    { url: `${API_BASE_URL}/users`, description: 'Lista de usuarios' },
    { url: `${API_BASE_URL}/usuarios`, description: 'Lista de usuarios (alt)' }
  ];
  
  const results = {
    success: 0,
    failed: 0,
    details: [] as any[]
  };
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Verificando endpoint: ${endpoint.url}`);
      const res = await axios.get(endpoint.url, getAuthConfig());
      console.log(`✔️ ${endpoint.description} OK:`, res.status);
      
      results.success++;
      results.details.push({
        endpoint: endpoint.url,
        description: endpoint.description,
        status: 'success',
        statusCode: res.status,
        dataStructure: Array.isArray(res.data) ? 'array' : typeof res.data
      });
    } catch (error: any) {
      console.error(`❌ Error en ${endpoint.description}:`, error.message);
      
      results.failed++;
      results.details.push({
        endpoint: endpoint.url,
        description: endpoint.description,
        status: 'error',
        statusCode: error.response?.status || 'network error',
        error: error.response?.data?.message || error.message
      });
    }
  }
  
  console.log('=== RESULTADOS DEL DIAGNÓSTICO ===');
  console.log(`Endpoints exitosos: ${results.success}/${endpoints.length}`);
  console.log(`Endpoints fallidos: ${results.failed}/${endpoints.length}`);
  console.log('Detalles:', results.details);
  console.log('=== FIN DEL DIAGNÓSTICO ===');
  
  return results;
};

// Función para limpiar caché - ASEGURAMOS EXPORTACIÓN
export const clearCache = () => {
  Object.keys(assignedUsersCache).forEach(key => {
    delete assignedUsersCache[key];
  });
  
  console.log('[userService] Caché limpiada');
};

// Función para realizar asignación masiva de usuarios
export const bulkAssignUsers = async (
  itemType: ItemType,
  itemId: string,
  userIds: number[],
  roles?: Record<number, string>
): Promise<{ success: number, failed: number, details: Array<{ userId: number, success: boolean, message: string }> }> => {
  if (userIds.length === 0) {
    return { success: 0, failed: 0, details: [] };
  }
  
  const results = {
    success: 0,
    failed: 0,
    details: [] as Array<{ userId: number, success: boolean, message: string }>
  };
  
  // Procesar usuarios de forma secuencial para evitar problemas en el servidor
  for (const userId of userIds) {
    try {
      const userRoles = roles ? { [userId]: roles[userId] } : undefined;
      await assignUsers(itemType, itemId, [userId], userRoles);
      results.success++;
      results.details.push({
        userId,
        success: true,
        message: 'Usuario asignado exitosamente'
      });
    } catch (error: any) {
      results.failed++;
      results.details.push({
        userId,
        success: false,
        message: error.message || 'Error desconocido al asignar usuario'
      });
    }
  }
  
  // Invalidar caché para este elemento
  const cacheKey = getCacheKey(itemType, itemId);
  delete assignedUsersCache[cacheKey];
  
  return results;
};

// Función para realizar desasignación masiva de usuarios
export const bulkRemoveUserAssignments = async (
  itemType: ItemType,
  itemId: string,
  userIds: number[]
): Promise<{ success: number, failed: number, details: Array<{ userId: number, success: boolean, message: string }> }> => {
  if (userIds.length === 0) {
    return { success: 0, failed: 0, details: [] };
  }
  
  const results = {
    success: 0,
    failed: 0,
    details: [] as Array<{ userId: number, success: boolean, message: string }>
  };
  
  // Procesar usuarios de forma secuencial para evitar problemas en el servidor
  for (const userId of userIds) {
    try {
      await removeUserAssignment(itemType, itemId, userId);
      results.success++;
      results.details.push({
        userId,
        success: true,
        message: 'Usuario desasignado exitosamente'
      });
    } catch (error: any) {
      results.failed++;
      results.details.push({
        userId,
        success: false,
        message: error.message || 'Error desconocido al desasignar usuario'
      });
    }
  }
  
  // Invalidar caché para este elemento
  const cacheKey = getCacheKey(itemType, itemId);
  delete assignedUsersCache[cacheKey];
  
  return results;
};