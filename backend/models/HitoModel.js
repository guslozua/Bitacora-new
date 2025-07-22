// models/HitoModel.js - VERSIÓN CORREGIDA
const db = require('../config/db');

const HitoModel = {
  /**
   * Asigna un usuario a un hito - VERSIÓN CORREGIDA
   * @param {number} hitoId - ID del hito  
   * @param {number} userId - ID del usuario
   * @param {string} rol - Rol del usuario (default: 'colaborador')
   * @returns {Promise<Object>} - Resultado de la operación
   */
  assignUserToHito: async (hitoId, userId, rol = 'colaborador') => {
    try {
      // VALIDAR que hitoId y userId sean números válidos y mayores a 0
      if (!hitoId || hitoId <= 0) {
        throw new Error(`ID de hito inválido: ${hitoId}`);
      }
      
      if (!userId || userId <= 0) {
        throw new Error(`ID de usuario inválido: ${userId}`);
      }

      console.log('🔍 Asignando usuario a hito:', {
        hitoId: hitoId,
        userId: userId,
        rol: rol,
        tipos: {
          hitoId: typeof hitoId,
          userId: typeof userId
        }
      });

      // Verificar que el hito existe
      const [hitoExists] = await db.query(
        'SELECT id FROM hitos WHERE id = ?',
        [hitoId]
      );
      
      if (hitoExists.length === 0) {
        throw new Error(`Hito con ID ${hitoId} no existe`);
      }

      // Verificar que el usuario existe
      const [userExists] = await db.query(
        'SELECT id FROM usuarios WHERE id = ?',
        [userId]
      );
      
      if (userExists.length === 0) {
        throw new Error(`Usuario con ID ${userId} no existe`);
      }

      // Verificar si ya existe la asignación
      const [existingAssignment] = await db.query(
        'SELECT id FROM hito_usuarios WHERE id_hito = ? AND id_usuario = ?',
        [hitoId, userId]
      );

      if (existingAssignment.length > 0) {
        // Si existe, actualizar el rol
        console.log('📝 Actualizando rol de usuario existente...');
        const [updateResult] = await db.query(
          'UPDATE hito_usuarios SET rol = ?, fecha_asignacion = CURRENT_TIMESTAMP WHERE id_hito = ? AND id_usuario = ?',
          [rol, hitoId, userId]
        );
        console.log('✅ Rol actualizado');
        return updateResult;
      } else {
        // Si no existe, crear nueva asignación (NO especificar id para que use AUTO_INCREMENT)
        console.log('➕ Creando nueva asignación usuario-hito...');
        const [insertResult] = await db.query(
          'INSERT INTO hito_usuarios (id_hito, id_usuario, rol, fecha_asignacion) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [hitoId, userId, rol]
        );
        
        console.log('✅ Nueva asignación creada:', {
          insertId: insertResult.insertId,
          affectedRows: insertResult.affectedRows
        });
        
        return insertResult;
      }
    } catch (error) {
      console.error('❌ Error al asignar usuario al hito:', {
        error: error.message,
        hitoId,
        userId,
        rol
      });
      throw error;
    }
  },

  /**
   * Crea un nuevo hito - VERSIÓN CORREGIDA
   * @param {Object} hitoData - Datos del hito
   * @returns {Promise<Object>} - Resultado de la operación
   */
  createHito: async (hitoData) => {
    try {
      const {
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        impacto,
        id_proyecto_origen
      } = hitoData;

      console.log('🆕 Creando nuevo hito:', {
        nombre,
        fecha_inicio,
        fecha_fin,
        id_proyecto_origen
      });

      // NO especificar el campo id en INSERT para que MySQL use AUTO_INCREMENT
      const query = `
        INSERT INTO hitos 
        (nombre, fecha_inicio, fecha_fin, descripcion, impacto, id_proyecto_origen, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const [result] = await db.query(query, [
        nombre,
        fecha_inicio || null,
        fecha_fin || null,
        descripcion || null,
        impacto || null,
        id_proyecto_origen || null
      ]);

      console.log('✅ Hito creado exitosamente:', {
        insertId: result.insertId,
        affectedRows: result.affectedRows
      });

      // Verificar que se insertó correctamente
      if (!result.insertId || result.insertId <= 0) {
        throw new Error('Error: No se generó un ID válido para el hito');
      }

      return result;
    } catch (error) {
      console.error('❌ Error al crear hito:', error);
      throw error;
    }
  },

  /**
   * Convierte un proyecto completado en un hito - VERSIÓN CORREGIDA
   */
  convertProjectToHito: async (projectId, impacto = '') => {
    console.log('🔧 MODELO: Iniciando conversión de proyecto a hito:', {
      projectId,
      impacto,
      tipo_projectId: typeof projectId
    });

    // Validar projectId
    const numericProjectId = parseInt(projectId);
    if (isNaN(numericProjectId) || numericProjectId <= 0) {
      throw new Error(`ID de proyecto inválido: ${projectId}`);
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      console.log('✅ MODELO: Transacción iniciada');

      // 1. Obtener información del proyecto
      console.log('📋 MODELO: Consultando proyecto...');
      const [projects] = await connection.query(
        `SELECT * FROM proyectos WHERE id = ?`,
        [numericProjectId]
      );

      if (projects.length === 0) {
        throw new Error('Proyecto no encontrado');
      }

      const project = projects[0];
      console.log('📋 MODELO: Proyecto encontrado:', project.nombre);

      // 2. Verificar que todas las tareas estén completadas
      const [tasks] = await connection.query(
        `SELECT * FROM tareas WHERE id_proyecto = ?`,
        [numericProjectId]
      );

      const incompleteTasks = tasks.filter(task =>
        task.estado !== 'completada' &&
        task.estado !== 'completado'
      );

      if (incompleteTasks.length > 0) {
        throw new Error('No se puede convertir a hito: existen tareas incompletas');
      }

      // 3. Verificar si ya existe un hito para este proyecto
      const [existingHitos] = await connection.query(
        `SELECT * FROM hitos WHERE id_proyecto_origen = ?`,
        [numericProjectId]
      );

      if (existingHitos.length > 0) {
        throw new Error('Ya existe un hito creado para este proyecto');
      }

      // 4. Crear el hito (NO especificar el campo id)
      console.log('📋 MODELO: Creando hito...');
      const [hitoResult] = await connection.query(
        `INSERT INTO hitos 
         (nombre, fecha_inicio, fecha_fin, descripcion, impacto, id_proyecto_origen, fecha_creacion)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          project.nombre,
          project.fecha_inicio,
          project.fecha_fin,
          project.descripcion,
          impacto || 'Impacto a definir',
          numericProjectId
        ]
      );

      const hitoId = hitoResult.insertId;
      console.log('✅ MODELO: Hito creado con ID:', hitoId);

      // Validar que se creó correctamente
      if (!hitoId || hitoId <= 0) {
        throw new Error('Error al crear hito: ID inválido generado');
      }

      // 5. Obtener usuarios del proyecto y asignarlos al hito
      const [projectUsers] = await connection.query(
        `SELECT pu.id_usuario, pu.rol
         FROM proyecto_usuarios pu
         WHERE pu.id_proyecto = ?`,
        [numericProjectId]
      );

      if (projectUsers.length > 0) {
        console.log('📋 MODELO: Asignando usuarios al hito...');
        
        // Insertar usuarios uno por uno para mejor control de errores
        for (const pu of projectUsers) {
          console.log(`📋 Asignando usuario ${pu.id_usuario} con rol ${pu.rol}`);
          
          await connection.query(
            `INSERT INTO hito_usuarios (id_hito, id_usuario, rol, fecha_asignacion) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [hitoId, pu.id_usuario, pu.rol]
          );
        }
        console.log('✅ MODELO: Usuarios asignados al hito');
      }

      // 6. Registrar las tareas del proyecto en el hito
      if (tasks.length > 0) {
        console.log('📋 MODELO: Registrando tareas en el hito...');
        
        for (const task of tasks) {
          await connection.query(
            `INSERT INTO hito_tareas 
             (id_hito, nombre_tarea, descripcion, estado, fecha_inicio, fecha_fin, id_tarea_origen)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              hitoId,
              task.titulo,
              task.descripcion,
              task.estado,
              task.fecha_inicio,
              task.fecha_vencimiento,
              task.id
            ]
          );
        }
        console.log('✅ MODELO: Tareas registradas en el hito');
      }

      // 7. Actualizar el estado del proyecto a 'completado' si no lo está ya
      if (project.estado !== 'completado') {
        console.log('📋 MODELO: Actualizando estado del proyecto a completado...');
        await connection.query(
          `UPDATE proyectos SET estado = 'completado' WHERE id = ?`,
          [numericProjectId]
        );
        console.log('✅ MODELO: Estado del proyecto actualizado');
      }

      await connection.commit();
      console.log('✅ MODELO: Transacción confirmada');

      // Retornar el hito creado
      const [hitos] = await connection.query(
        `SELECT h.*, p.nombre as proyecto_origen_nombre
         FROM hitos h
         LEFT JOIN proyectos p ON h.id_proyecto_origen = p.id
         WHERE h.id = ?`,
        [hitoId]
      );

      console.log('✅ MODELO: Hito creado exitosamente');
      return hitos[0];
    } catch (error) {
      await connection.rollback();
      console.error('❌ MODELO: Error en conversión, rollback ejecutado:', error);
      throw error;
    } finally {
      connection.release();
      console.log('🔄 MODELO: Conexión liberada');
    }
  },

  // ... resto de los métodos existentes permanecen iguales ...
  
  getHitos: async (filters = {}) => {
    try {
      const { nombre, fechaInicio, fechaFin, idProyectoOrigen, usuario } = filters;

      let query = `
        SELECT h.*, p.nombre as proyecto_origen_nombre
        FROM hitos h
        LEFT JOIN proyectos p ON h.id_proyecto_origen = p.id
        WHERE 1=1
      `;

      const params = [];

      if (nombre) {
        query += ' AND h.nombre LIKE ?';
        params.push(`%${nombre}%`);
      }

      if (fechaInicio) {
        query += ' AND h.fecha_inicio >= ?';
        params.push(fechaInicio);
      }

      if (fechaFin) {
        query += ' AND h.fecha_fin <= ?';
        params.push(fechaFin);
      }

      if (idProyectoOrigen) {
        query += ' AND h.id_proyecto_origen = ?';
        params.push(idProyectoOrigen);
      }

      if (usuario) {
        query = `
          SELECT h.*, p.nombre as proyecto_origen_nombre
          FROM hitos h
          LEFT JOIN proyectos p ON h.id_proyecto_origen = p.id
          JOIN hito_usuarios hu ON h.id = hu.id_hito
          WHERE hu.id_usuario = ?
        `;
        params.push(usuario);

        if (nombre) {
          query += ' AND h.nombre LIKE ?';
          params.push(`%${nombre}%`);
        }

        if (fechaInicio) {
          query += ' AND h.fecha_inicio >= ?';
          params.push(fechaInicio);
        }

        if (fechaFin) {
          query += ' AND h.fecha_fin <= ?';
          params.push(fechaFin);
        }

        if (idProyectoOrigen) {
          query += ' AND h.id_proyecto_origen = ?';
          params.push(idProyectoOrigen);
        }
      }

      query += ' ORDER BY h.fecha_creacion DESC';

      const [hitos] = await db.query(query, params);
      return hitos;
    } catch (error) {
      console.error('Error al obtener hitos:', error);
      throw error;
    }
  },

  getHitoById: async (hitoId) => {
    try {
      const query = `
        SELECT h.*, p.nombre as proyecto_origen_nombre
        FROM hitos h
        LEFT JOIN proyectos p ON h.id_proyecto_origen = p.id
        WHERE h.id = ?
      `;

      const [hitos] = await db.query(query, [hitoId]);

      if (hitos.length === 0) {
        return null;
      }

      return hitos[0];
    } catch (error) {
      console.error('Error al obtener hito por ID:', error);
      throw error;
    }
  },

  updateHito: async (hitoId, hitoData) => {
    try {
      const {
        nombre,
        fecha_inicio,
        fecha_fin,
        descripcion,
        impacto,
        id_proyecto_origen
      } = hitoData;

      let query = 'UPDATE hitos SET ';
      const updateFields = [];
      const params = [];

      if (nombre !== undefined) {
        updateFields.push('nombre = ?');
        params.push(nombre);
      }

      if (fecha_inicio !== undefined) {
        updateFields.push('fecha_inicio = ?');
        params.push(fecha_inicio);
      }

      if (fecha_fin !== undefined) {
        updateFields.push('fecha_fin = ?');
        params.push(fecha_fin);
      }

      if (descripcion !== undefined) {
        updateFields.push('descripcion = ?');
        params.push(descripcion);
      }

      if (impacto !== undefined) {
        updateFields.push('impacto = ?');
        params.push(impacto);
      }

      if (id_proyecto_origen !== undefined) {
        updateFields.push('id_proyecto_origen = ?');
        params.push(id_proyecto_origen);
      }

      if (updateFields.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
      }

      updateFields.push('fecha_actualizacion = CURRENT_TIMESTAMP');
      query += updateFields.join(', ') + ' WHERE id = ?';
      params.push(hitoId);

      const [result] = await db.query(query, params);
      return result;
    } catch (error) {
      console.error('Error al actualizar hito:', error);
      throw error;
    }
  },

  deleteHito: async (hitoId) => {
    try {
      const query = 'DELETE FROM hitos WHERE id = ?';
      const [result] = await db.query(query, [hitoId]);
      return result;
    } catch (error) {
      console.error('Error al eliminar hito:', error);
      throw error;
    }
  },

  getHitoUsers: async (hitoId) => {
    try {
      const query = `
        SELECT hu.id, hu.id_hito, hu.id_usuario, hu.rol, hu.fecha_asignacion,
               u.nombre, u.email
        FROM hito_usuarios hu
        JOIN usuarios u ON hu.id_usuario = u.id
        WHERE hu.id_hito = ?
        ORDER BY u.nombre
      `;

      const [users] = await db.query(query, [hitoId]);
      return users;
    } catch (error) {
      console.error('Error al obtener usuarios del hito:', error);
      throw error;
    }
  },

  removeUserFromHito: async (hitoId, userId) => {
    try {
      const query = `
        DELETE FROM hito_usuarios
        WHERE id_hito = ? AND id_usuario = ?
      `;

      const [result] = await db.query(query, [hitoId, userId]);
      return result;
    } catch (error) {
      console.error('Error al eliminar usuario del hito:', error);
      throw error;
    }
  },

  getHitoTasks: async (hitoId) => {
    try {
      const query = `
        SELECT *
        FROM hito_tareas
        WHERE id_hito = ?
        ORDER BY fecha_inicio
      `;

      const [tasks] = await db.query(query, [hitoId]);
      return tasks;
    } catch (error) {
      console.error('Error al obtener tareas del hito:', error);
      throw error;
    }
  },

  addTaskToHito: async (hitoId, taskData) => {
    try {
      const {
        nombre_tarea,
        descripcion,
        estado,
        fecha_inicio,
        fecha_fin,
        id_tarea_origen
      } = taskData;

      const query = `
        INSERT INTO hito_tareas
        (id_hito, nombre_tarea, descripcion, estado, fecha_inicio, fecha_fin, id_tarea_origen)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
        hitoId,
        nombre_tarea,
        descripcion || null,
        estado || 'completada',
        fecha_inicio || null,
        fecha_fin || null,
        id_tarea_origen || null
      ]);

      return result;
    } catch (error) {
      console.error('Error al agregar tarea al hito:', error);
      throw error;
    }
  },

  removeTaskFromHito: async (taskId) => {
    try {
      const query = `
        DELETE FROM hito_tareas
        WHERE id = ?
      `;

      const [result] = await db.query(query, [taskId]);
      return result;
    } catch (error) {
      console.error('Error al eliminar tarea del hito:', error);
      throw error;
    }
  },

  updateHitoTask: async (taskId, taskData) => {
    try {
      const {
        nombre_tarea,
        descripcion,
        estado,
        fecha_inicio,
        fecha_fin
      } = taskData;

      let query = 'UPDATE hito_tareas SET ';
      const updateFields = [];
      const params = [];

      if (nombre_tarea !== undefined) {
        updateFields.push('nombre_tarea = ?');
        params.push(nombre_tarea);
      }

      if (descripcion !== undefined) {
        updateFields.push('descripcion = ?');
        params.push(descripcion);
      }

      if (estado !== undefined) {
        updateFields.push('estado = ?');
        params.push(estado);
      }

      if (fecha_inicio !== undefined) {
        updateFields.push('fecha_inicio = ?');
        params.push(fecha_inicio);
      }

      if (fecha_fin !== undefined) {
        updateFields.push('fecha_fin = ?');
        params.push(fecha_fin);
      }

      if (updateFields.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
      }

      query += updateFields.join(', ') + ' WHERE id = ?';
      params.push(taskId);

      const [result] = await db.query(query, params);
      return result;
    } catch (error) {
      console.error('Error al actualizar tarea del hito:', error);
      throw error;
    }
  }
};

module.exports = HitoModel;