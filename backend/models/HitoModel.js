// models/HitoModel.js
const db = require('../config/db');
const projectModel = require('./ProjectModel');
const taskModel = require('./TaskModel');
const subtaskModel = require('./SubtaskModel');

const HitoModel = {
  /**
   * Obtiene todos los hitos con filtros opcionales
   * @param {Object} filters - Filtros para la consulta (nombre, fechaInicio, fechaFin, etc.)
   * @returns {Promise<Object[]>} - Array de hitos
   */
  getHitos: async (filters = {}) => {
    try {
      const { nombre, fechaInicio, fechaFin, idProyectoOrigen, usuario } = filters;

      let query = `
        SELECT h.*, p.nombre as proyecto_origen_nombre
        FROM Hitos h
        LEFT JOIN Proyectos p ON h.id_proyecto_origen = p.id
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

      // Filtrar por usuario asignado si se especifica
      if (usuario) {
        query = `
          SELECT h.*, p.nombre as proyecto_origen_nombre
          FROM Hitos h
          LEFT JOIN Proyectos p ON h.id_proyecto_origen = p.id
          JOIN Hito_Usuarios hu ON h.id = hu.id_hito
          WHERE hu.id_usuario = ?
        `;
        params.push(usuario);

        // Agregar filtros adicionales si existen
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

  /**
   * Obtiene un hito por su ID
   * @param {number} hitoId - ID del hito
   * @returns {Promise<Object>} - Información del hito
   */
  getHitoById: async (hitoId) => {
    try {
      const query = `
        SELECT h.*, p.nombre as proyecto_origen_nombre
        FROM Hitos h
        LEFT JOIN Proyectos p ON h.id_proyecto_origen = p.id
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

  /**
   * Crea un nuevo hito
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

      const query = `
        INSERT INTO Hitos 
        (nombre, fecha_inicio, fecha_fin, descripcion, impacto, id_proyecto_origen)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
        nombre,
        fecha_inicio || null,
        fecha_fin || null,
        descripcion || null,
        impacto || null,
        id_proyecto_origen || null
      ]);

      return result;
    } catch (error) {
      console.error('Error al crear hito:', error);
      throw error;
    }
  },

  /**
   * Actualiza un hito existente
   * @param {number} hitoId - ID del hito
   * @param {Object} hitoData - Datos actualizados del hito
   * @returns {Promise<Object>} - Resultado de la operación
   */
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

      let query = 'UPDATE Hitos SET ';
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

      query += updateFields.join(', ') + ' WHERE id = ?';
      params.push(hitoId);

      const [result] = await db.query(query, params);
      return result;
    } catch (error) {
      console.error('Error al actualizar hito:', error);
      throw error;
    }
  },

  /**
   * Elimina un hito
   * @param {number} hitoId - ID del hito
   * @returns {Promise<Object>} - Resultado de la operación
   */
  deleteHito: async (hitoId) => {
    try {
      const query = 'DELETE FROM Hitos WHERE id = ?';
      const [result] = await db.query(query, [hitoId]);
      return result;
    } catch (error) {
      console.error('Error al eliminar hito:', error);
      throw error;
    }
  },

  /**
   * Convierte un proyecto completado en un hito
   * @param {number} projectId - ID del proyecto
   * @param {string} impacto - Impacto del hito (opcional)
   * @returns {Promise<Object>} - Información del hito creado
   */
  convertProjectToHito: async (projectId, impacto = '') => {
    console.log('🔧 MODELO: Iniciando conversión de proyecto a hito:', {
      projectId,
      impacto,
      tipo_projectId: typeof projectId
    });

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      console.log('✅ MODELO: Transacción iniciada');

      // 1. Obtener información del proyecto
      console.log('📋 MODELO: Consultando proyecto...');
      const [projects] = await connection.query(
        `SELECT * FROM Proyectos WHERE id = ?`,
        [projectId]
      );

      console.log('📋 MODELO: Resultado consulta proyecto:', {
        encontrados: projects.length,
        proyecto: projects.length > 0 ? {
          id: projects[0].id,
          nombre: projects[0].nombre,
          estado: projects[0].estado
        } : 'No encontrado'
      });

      if (projects.length === 0) {
        throw new Error('Proyecto no encontrado');
      }

      const project = projects[0];

      // 2. Verificar que todas las tareas estén completadas
      console.log('📋 MODELO: Consultando tareas del proyecto...');
      const [tasks] = await connection.query(
        `SELECT * FROM Tareas WHERE id_proyecto = ?`,
        [projectId]
      );

      console.log('📋 MODELO: Tareas encontradas:', {
        total: tasks.length,
        estados: tasks.map(t => ({ id: t.id, titulo: t.titulo, estado: t.estado }))
      });

      const incompleteTasks = tasks.filter(task =>
        task.estado !== 'completada' &&
        task.estado !== 'completado'
      );
      console.log('📋 MODELO: Tareas incompletas:', incompleteTasks.length);

      if (incompleteTasks.length > 0) {
        console.log('❌ MODELO: Hay tareas incompletas:', incompleteTasks.map(t => ({ id: t.id, titulo: t.titulo, estado: t.estado })));
        throw new Error('No se puede convertir a hito: existen tareas incompletas');
      }

      // 3. Verificar si ya existe un hito para este proyecto
      console.log('📋 MODELO: Verificando si ya existe hito para este proyecto...');
      const [existingHitos] = await connection.query(
        `SELECT * FROM Hitos WHERE id_proyecto_origen = ?`,
        [projectId]
      );

      if (existingHitos.length > 0) {
        console.log('❌ MODELO: Ya existe un hito para este proyecto:', existingHitos[0].id);
        throw new Error('Ya existe un hito creado para este proyecto');
      }

      // 4. Crear el hito
      console.log('📋 MODELO: Creando hito...');
      const [hitoResult] = await connection.query(
        `INSERT INTO Hitos 
         (nombre, fecha_inicio, fecha_fin, descripcion, impacto, id_proyecto_origen)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          project.nombre,
          project.fecha_inicio,
          project.fecha_fin,
          project.descripcion,
          impacto || 'Impacto a definir', // Usar el impacto proporcionado o un valor por defecto
          projectId
        ]
      );

      const hitoId = hitoResult.insertId;
      console.log('✅ MODELO: Hito creado con ID:', hitoId);

      // 5. Obtener usuarios del proyecto y asignarlos al hito
      console.log('📋 MODELO: Consultando usuarios del proyecto...');
      const [projectUsers] = await connection.query(
        `SELECT pu.id_usuario, pu.rol
         FROM proyecto_usuarios pu
         WHERE pu.id_proyecto = ?`,
        [projectId]
      );

      console.log('📋 MODELO: Usuarios del proyecto:', projectUsers.length);

      if (projectUsers.length > 0) {
        console.log('📋 MODELO: Asignando usuarios al hito...');
        const userValues = projectUsers.map(pu => [hitoId, pu.id_usuario, pu.rol]);
        await connection.query(
          `INSERT INTO Hito_Usuarios (id_hito, id_usuario, rol) VALUES ?`,
          [userValues]
        );
        console.log('✅ MODELO: Usuarios asignados al hito');
      }

      // 6. Registrar las tareas del proyecto en el hito
      if (tasks.length > 0) {
        console.log('📋 MODELO: Registrando tareas en el hito...');
        const taskValues = tasks.map(task => [
          hitoId,
          task.titulo,
          task.descripcion,
          task.estado,
          task.fecha_inicio,
          task.fecha_vencimiento,
          task.id
        ]);

        await connection.query(
          `INSERT INTO Hito_Tareas 
           (id_hito, nombre_tarea, descripcion, estado, fecha_inicio, fecha_fin, id_tarea_origen)
           VALUES ?`,
          [taskValues]
        );
        console.log('✅ MODELO: Tareas registradas en el hito');
      }

      // 7. Actualizar el estado del proyecto a 'completado' si no lo está ya
      if (project.estado !== 'completado') {
        console.log('📋 MODELO: Actualizando estado del proyecto a completado...');
        await connection.query(
          `UPDATE Proyectos SET estado = 'completado' WHERE id = ?`,
          [projectId]
        );
        console.log('✅ MODELO: Estado del proyecto actualizado');
      }

      await connection.commit();
      console.log('✅ MODELO: Transacción confirmada');

      // Retornar el hito creado
      const [hitos] = await connection.query(
        `SELECT h.*, p.nombre as proyecto_origen_nombre
         FROM Hitos h
         LEFT JOIN Proyectos p ON h.id_proyecto_origen = p.id
         WHERE h.id = ?`,
        [hitoId]
      );

      console.log('✅ MODELO: Hito creado exitosamente:', {
        id: hitos[0].id,
        nombre: hitos[0].nombre,
        impacto: hitos[0].impacto
      });

      return hitos[0];
    } catch (error) {
      await connection.rollback();
      console.error('❌ MODELO: Error en conversión, rollback ejecutado:', {
        message: error.message,
        stack: error.stack,
        sql: error.sql
      });
      throw error;
    } finally {
      connection.release();
      console.log('🔄 MODELO: Conexión liberada');
    }
  },

  /**
   * Obtiene los usuarios asignados a un hito
   * @param {number} hitoId - ID del hito
   * @returns {Promise<Object[]>} - Array de usuarios
   */
  getHitoUsers: async (hitoId) => {
    try {
      const query = `
        SELECT hu.id, hu.id_hito, hu.id_usuario, hu.rol, hu.fecha_asignacion,
               u.nombre, u.email
        FROM Hito_Usuarios hu
        JOIN Usuarios u ON hu.id_usuario = u.id
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

  /**
   * Asigna un usuario a un hito
   * @param {number} hitoId - ID del hito
   * @param {number} userId - ID del usuario
   * @param {string} rol - Rol del usuario (default: 'colaborador')
   * @returns {Promise<Object>} - Resultado de la operación
   */
  assignUserToHito: async (hitoId, userId, rol = 'colaborador') => {
    try {
      const query = `
        INSERT INTO Hito_Usuarios (id_hito, id_usuario, rol)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE rol = ?, fecha_asignacion = CURRENT_TIMESTAMP
      `;

      const [result] = await db.query(query, [hitoId, userId, rol, rol]);
      return result;
    } catch (error) {
      console.error('Error al asignar usuario al hito:', error);
      throw error;
    }
  },

  /**
   * Elimina la asignación de un usuario a un hito
   * @param {number} hitoId - ID del hito
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la operación
   */
  removeUserFromHito: async (hitoId, userId) => {
    try {
      const query = `
        DELETE FROM Hito_Usuarios
        WHERE id_hito = ? AND id_usuario = ?
      `;

      const [result] = await db.query(query, [hitoId, userId]);
      return result;
    } catch (error) {
      console.error('Error al eliminar usuario del hito:', error);
      throw error;
    }
  },

  /**
   * Obtiene las tareas asociadas a un hito
   * @param {number} hitoId - ID del hito
   * @returns {Promise<Object[]>} - Array de tareas
   */
  getHitoTasks: async (hitoId) => {
    try {
      const query = `
        SELECT *
        FROM Hito_Tareas
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

  /**
   * Agrega una tarea a un hito
   * @param {number} hitoId - ID del hito
   * @param {Object} taskData - Datos de la tarea
   * @returns {Promise<Object>} - Resultado de la operación
   */
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
        INSERT INTO Hito_Tareas
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

  /**
   * Elimina una tarea de un hito
   * @param {number} taskId - ID de la tarea
   * @returns {Promise<Object>} - Resultado de la operación
   */
  removeTaskFromHito: async (taskId) => {
    try {
      const query = `
        DELETE FROM Hito_Tareas
        WHERE id = ?
      `;

      const [result] = await db.query(query, [taskId]);
      return result;
    } catch (error) {
      console.error('Error al eliminar tarea del hito:', error);
      throw error;
    }
  },

  /**
   * Actualiza una tarea de un hito
   * @param {number} taskId - ID de la tarea
   * @param {Object} taskData - Datos actualizados de la tarea
   * @returns {Promise<Object>} - Resultado de la operación
   */
  updateHitoTask: async (taskId, taskData) => {
    try {
      const {
        nombre_tarea,
        descripcion,
        estado,
        fecha_inicio,
        fecha_fin
      } = taskData;

      let query = 'UPDATE Hito_Tareas SET ';
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
