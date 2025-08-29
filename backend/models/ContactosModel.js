// =============================================
// MODELO CORREGIDO: ContactosModel.js - SQL SERVER
// =============================================

const db = require('../config/db');

class ContactosModel {
  // ===============================
  // MÉTODO DE PRUEBA
  // ===============================
  
  static async testConnection() {
    try {
      const test_result = await db.query('SELECT 1 as test');
      console.log('✅ Test de conexión exitoso:', test_result);
      return test_result[0] || [];
    } catch (error) {
      console.error('❌ Error en test de conexión:', error);
      throw error;
    }
  }
  
  // ===============================
  // EQUIPOS TÉCNICOS
  // ===============================
  
  static async getAllEquipos() {
    try {
      // Primero obtenemos los equipos básicos sin GROUP BY problemático
      const equipos_result = await db.query(`
        SELECT 
          id, nombre, descripcion, telefono_guardia, color, 
          orden_visualizacion, estado, created_at, updated_at
        FROM taskmanagementsystem.equipos_tecnicos 
        WHERE estado = 'activo'
        ORDER BY orden_visualizacion ASC, nombre ASC
      `);
      
      const equipos = equipos_result[0];
      
      // Para cada equipo, calculamos estadísticas y agregamos relaciones
      for (let equipo of equipos) {
        // Contar integrantes
        const integrantesCount = await db.query(`
          SELECT COUNT(*) as total
          FROM taskmanagementsystem.equipos_integrantes ei
          WHERE ei.equipo_id = ?
        `, [equipo.id]);
        
        equipo.total_integrantes = (integrantesCount[0] || [])[0]?.total || 0;
        
        // Contar sistemas
        const sistemasCount = await db.query(`
          SELECT COUNT(*) as total
          FROM taskmanagementsystem.equipos_sistemas es
          WHERE es.equipo_id = ?
        `, [equipo.id]);
        
        equipo.total_sistemas = (sistemasCount[0] || [])[0]?.total || 0;
        // Contar integrantes disponibles
        const integrantesDisponiblesCount = await db.query(`
          SELECT COUNT(*) as total
          FROM taskmanagementsystem.equipos_integrantes ei
          INNER JOIN taskmanagementsystem.integrantes i ON ei.integrante_id = i.id
          WHERE ei.equipo_id = ? AND i.disponibilidad = 'disponible'
        `, [equipo.id]);
        
        equipo.integrantes_disponibles = (integrantesDisponiblesCount[0] || [])[0]?.total || 0;
      }
      
      // Para cada equipo, obtener sus integrantes y sistemas
      for (let equipo of equipos) {
        // Obtener integrantes
        const integrantes_result = await db.query(`
          SELECT 
            i.*,
            ei.es_responsable_principal,
            ei.fecha_asignacion,
            ei.notas_asignacion
          FROM taskmanagementsystem.integrantes i
          INNER JOIN taskmanagementsystem.equipos_integrantes ei ON i.id = ei.integrante_id
          WHERE ei.equipo_id = ?
          ORDER BY ei.es_responsable_principal DESC, i.nombre ASC
        `, [equipo.id]);
        
        equipo.integrantes = integrantes_result[0] || [];
        
        // Obtener sistemas monitoreados
        const sistemas_result = await db.query(`
          SELECT 
            s.*,
            es.es_responsable_principal,
            es.nivel_responsabilidad,
            es.notas
          FROM taskmanagementsystem.sistemas_monitoreados s
          INNER JOIN taskmanagementsystem.equipos_sistemas es ON s.id = es.sistema_id
          WHERE es.equipo_id = ?
          ORDER BY es.es_responsable_principal DESC, s.nombre ASC
        `, [equipo.id]);
        
        equipo.sistemas = sistemas_result[0] || [];
      }
      
      return equipos;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  }

  static async getEquipoById(id) {
    try {
      const equipo_result = await db.query(`
        SELECT * FROM taskmanagementsystem.equipos_tecnicos WHERE id = ?
      `, [id]);
      
      if (!equipo_result[0] || equipo_result[0].length === 0) {
        return null;
      }
      
      const equipo = equipo_result[0][0];
      
      // Obtener integrantes
      const integrantes_result = await db.query(`
        SELECT 
          i.*,
          ei.es_responsable_principal,
          ei.fecha_asignacion,
          ei.notas_asignacion
        FROM taskmanagementsystem.integrantes i
        INNER JOIN taskmanagementsystem.equipos_integrantes ei ON i.id = ei.integrante_id
        WHERE ei.equipo_id = ?
        ORDER BY ei.es_responsable_principal DESC, i.nombre ASC
      `, [id]);
      
      equipo.integrantes = integrantes_result[0] || [];
      
      // Obtener sistemas monitoreados
      const sistemas_result = await db.query(`
        SELECT 
          s.*,
          es.es_responsable_principal,
          es.nivel_responsabilidad,
          es.notas
        FROM taskmanagementsystem.sistemas_monitoreados s
        INNER JOIN taskmanagementsystem.equipos_sistemas es ON s.id = es.sistema_id
        WHERE es.equipo_id = ?
        ORDER BY es.es_responsable_principal DESC, s.nombre ASC
      `, [equipo.id]);
      
      equipo.sistemas = sistemas_result[0] || [];
      
      return equipo;
    } catch (error) {
      console.error('Error al obtener equipo por ID:', error);
      throw error;
    }
  }

  static async createEquipo(equipoData) {
    try {
      const { nombre, descripcion, telefono_guardia, color, orden_visualizacion } = equipoData;
      
      const result = await db.query(`
        INSERT INTO taskmanagementsystem.equipos_tecnicos 
        (nombre, descripcion, telefono_guardia, color, orden_visualizacion, estado, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, 'activo', GETDATE(), GETDATE())
      `, [nombre, descripcion, telefono_guardia, color, orden_visualizacion || 0]);
      
      console.log('✅ Equipo creado con ID:', result[0].insertId);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al crear equipo:', error);
      throw error;
    }
  }

  static async updateEquipo(id, equipoData) {
    try {
      const { nombre, descripcion, telefono_guardia, color, orden_visualizacion } = equipoData;
      
      const result = await db.query(`
        UPDATE taskmanagementsystem.equipos_tecnicos 
        SET nombre = ?, descripcion = ?, telefono_guardia = ?, color = ?, orden_visualizacion = ?, updated_at = GETDATE()
        WHERE id = ?
      `, [nombre, descripcion, telefono_guardia, color, orden_visualizacion, id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      throw error;
    }
  }

  static async deleteEquipo(id) {
    try {
      // Primero eliminar las relaciones del equipo
      await db.query(`
        DELETE FROM taskmanagementsystem.equipos_integrantes WHERE equipo_id = ?
      `, [id]);
      
      await db.query(`
        DELETE FROM taskmanagementsystem.equipos_sistemas WHERE equipo_id = ?
      `, [id]);
      
      // Luego marcar el equipo como inactivo
      const result = await db.query(`
        UPDATE taskmanagementsystem.equipos_tecnicos SET estado = 'inactivo' WHERE id = ?
      `, [id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      throw error;
    }
  }

  // ===============================
  // INTEGRANTES
  // ===============================
  
  static async getAllIntegrantes() {
    try {
      // Primero verificar si la columna 'estado' existe, si no, omitirla
      const integrantes_result = await db.query(`
        SELECT 
          i.id, i.nombre, i.apellido, i.telefono_personal as telefono, i.email, 
          i.rol, i.disponibilidad, i.notas, i.created_at, i.updated_at
        FROM taskmanagementsystem.integrantes i
        ORDER BY i.nombre ASC, i.apellido ASC
      `);
      
      const integrantes = integrantes_result[0] || [];
      
      // Para cada integrante, obtener equipos asignados (como string para compatibilidad frontend)
      for (let integrante of integrantes) {
        const equipos_result = await db.query(`
          SELECT 
            et.nombre
          FROM taskmanagementsystem.equipos_tecnicos et
          INNER JOIN taskmanagementsystem.equipos_integrantes ei ON et.id = ei.equipo_id
          WHERE ei.integrante_id = ? AND et.estado = 'activo'
          ORDER BY et.nombre ASC
        `, [integrante.id]);
        
        const equipos_nombres = (equipos_result[0] || []).map(eq => eq.nombre);
        integrante.equipos = equipos_nombres.join(', ') || 'Sin equipo';
        integrante.total_equipos_asignados = (equipos_result[0] || []).length;
      }
      
      return integrantes;
    } catch (error) {
      console.error('Error al obtener integrantes:', error);
      throw error;
    }
  }

  static async createIntegrante(integranteData) {
    try {
      const { nombre, apellido, telefono, email, cargo, disponibilidad, turno_preferido, notas } = integranteData;
      
      const result = await db.query(`
        INSERT INTO taskmanagementsystem.integrantes 
        (nombre, apellido, telefono_personal, email, rol, disponibilidad, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
      `, [nombre, apellido, telefono, email, cargo, disponibilidad || 'disponible']);
      
      console.log('✅ Integrante creado con ID:', result[0].insertId);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al crear integrante:', error);
      throw error;
    }
  }

  static async updateIntegrante(id, integranteData) {
    try {
      const { nombre, apellido, telefono, email, cargo, disponibilidad, turno_preferido, notas } = integranteData;
      
      const result = await db.query(`
        UPDATE taskmanagementsystem.integrantes 
        SET nombre = ?, apellido = ?, telefono_personal = ?, email = ?, rol = ?, 
            disponibilidad = ?
        WHERE id = ?
      `, [nombre, apellido, telefono, email, cargo, disponibilidad, id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar integrante:', error);
      throw error;
    }
  }

  static async deleteIntegrante(id) {
    try {
      // Como la tabla integrantes no tiene columna 'estado', eliminamos físicamente o manejamos de otra forma
      const result = await db.query(`
        DELETE FROM taskmanagementsystem.equipos_integrantes WHERE integrante_id = ?
      `, [id]);
      
      // Luego eliminamos el integrante
      const deleteResult = await db.query(`
        DELETE FROM taskmanagementsystem.integrantes WHERE id = ?
      `, [id]);
      
      return deleteResult[0].affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar integrante:', error);
      throw error;
    }
  }

  // ===============================
  // SISTEMAS MONITOREADOS
  // ===============================
  
  static async getAllSistemas() {
    try {
      console.log('🔍 Intentando obtener sistemas monitoreados...');
      
      // Primero obtener sistemas básicos sin GROUP BY problemático
      const sistemas_result = await db.query(`
        SELECT 
          id, nombre, descripcion, criticidad, categoria,
          url_monitoreo as url_acceso, documentacion_url,
          estado, orden_visualizacion, created_at, updated_at
        FROM taskmanagementsystem.sistemas_monitoreados
        WHERE estado = 'operativo'
        ORDER BY 
          CASE criticidad
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 4
          END,
          nombre ASC
      `);
      
      const sistemas = sistemas_result[0] || [];
      console.log(`✅ Sistemas obtenidos: ${sistemas.length}`);
      
      // Para cada sistema, contar equipos asignados
      for (let sistema of sistemas) {
        const equipos_result = await db.query(`
          SELECT COUNT(*) as total
          FROM taskmanagementsystem.equipos_sistemas es
          WHERE es.sistema_id = ?
        `, [sistema.id]);
        
        sistema.total_equipos_asignados = (equipos_result[0] || [])[0]?.total || 0;
        
        // Obtener equipos responsables del sistema (como string para compatibilidad frontend)
        const equipos_responsables_result = await db.query(`
          SELECT 
            et.nombre
          FROM taskmanagementsystem.equipos_tecnicos et
          INNER JOIN taskmanagementsystem.equipos_sistemas es ON et.id = es.equipo_id
          WHERE es.sistema_id = ? AND et.estado = 'activo'
          ORDER BY es.es_responsable_principal DESC, et.nombre ASC
        `, [sistema.id]);
        
        const equipos_nombres = (equipos_responsables_result[0] || []).map(eq => eq.nombre);
        sistema.equipos_responsables = equipos_nombres.join(', ') || 'Sin asignar';
      }
      
      console.log('✅ Sistemas procesados exitosamente');
      return sistemas;
    } catch (error) {
      console.error('❌ Error al obtener sistemas:', error.message);
      console.error('📝 Stack:', error.stack);
      throw error; // ✅ Lanzar error en lugar de ocultarlo
    }
  }

  static async createSistema(sistemaData) {
    try {
      const { nombre, descripcion, criticidad, categoria, url_acceso, documentacion_url } = sistemaData;

      const result = await db.query(`
        INSERT INTO taskmanagementsystem.sistemas_monitoreados
        (nombre, descripcion, criticidad, categoria, url_monitoreo, documentacion_url, estado, orden_visualizacion, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, 'operativo', 999, GETDATE(), GETDATE())
      `, [nombre, descripcion, criticidad || 'media', categoria, url_acceso, documentacion_url]);

      console.log('✅ Sistema creado con ID:', result[0].insertId);
      return result[0].insertId;
    } catch (error) {
      console.error('Error al crear sistema:', error);
      throw error;
    }
  }

  static async updateSistema(id, sistemaData) {
    try {
      const { nombre, descripcion, criticidad, categoria, url_acceso, documentacion_url, estado, orden_visualizacion } = sistemaData;
      
      const result = await db.query(`
        UPDATE taskmanagementsystem.sistemas_monitoreados
        SET nombre = ?, descripcion = ?, criticidad = ?, categoria = ?,
        url_monitoreo = ?, documentacion_url = ?, estado = ?, orden_visualizacion = ?
        WHERE id = ?
      `, [nombre, descripcion, criticidad, categoria, url_acceso, documentacion_url, estado, orden_visualizacion || 999, id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar sistema:', error);
      throw error;
    }
  }

  static async deleteSistema(id) {
    try {
      // Primero eliminar las relaciones con equipos
      await db.query(`
        DELETE FROM taskmanagementsystem.equipos_sistemas WHERE sistema_id = ?
      `, [id]);
      
      // Luego marcar el sistema como inactivo
      const result = await db.query(`
        UPDATE taskmanagementsystem.sistemas_monitoreados SET estado = 'inactivo' WHERE id = ?
      `, [id]);
      
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar sistema:', error);
      throw error;
    }
  }

  // ===============================
  // FLUJO DE ESCALAMIENTO
  // ===============================
  
  static async getFlujoPorSistema(sistemaId) {
    try {
      // Obtener información del sistema
      const sistema_result = await db.query(`
        SELECT * FROM taskmanagementsystem.sistemas_monitoreados WHERE id = ? AND estado = 'operativo'
      `, [sistemaId]);
      
      if (!sistema_result[0] || sistema_result[0].length === 0) {
        return null;
      }
      
      const sistema = sistema_result[0][0];
      
      // Obtener equipos asignados al sistema
      const equipos_result = await db.query(`
        SELECT 
          et.*,
          es.es_responsable_principal,
          es.nivel_responsabilidad,
          es.notas as notas_asignacion
        FROM taskmanagementsystem.equipos_tecnicos et
        INNER JOIN taskmanagementsystem.equipos_sistemas es ON et.id = es.equipo_id
        WHERE es.sistema_id = ? AND et.estado = 'activo'
        ORDER BY es.es_responsable_principal DESC, et.orden_visualizacion ASC
      `, [sistemaId]);
      
      const equipos = equipos_result[0] || [];
      
      if (equipos.length === 0) {
        return null;
      }
      
      // Identificar equipo principal
      const equipoPrincipal = equipos.find(e => e.es_responsable_principal === 1) || equipos[0];
      const equiposColaboradores = equipos.filter(e => e.id !== equipoPrincipal.id);
      
      // Obtener integrantes del equipo principal
      const integrantes_principal_result = await db.query(`
        SELECT i.*
        FROM taskmanagementsystem.integrantes i
        INNER JOIN taskmanagementsystem.equipos_integrantes ei ON i.id = ei.integrante_id
        WHERE ei.equipo_id = ?
        ORDER BY ei.es_responsable_principal DESC, i.nombre ASC
      `, [equipoPrincipal.id]);
      
      const integrantesPrimarios = integrantes_principal_result[0] || [];
      
      // Obtener integrantes de equipos colaboradores
      let integrantesColaboradores = [];
      if (equiposColaboradores.length > 0) {
        const equipoIds = equiposColaboradores.map(e => e.id);
        const placeholders = equipoIds.map(() => '?').join(',');
        
        const integrantes_colab_result = await db.query(`
          SELECT i.*, ei.equipo_id
          FROM taskmanagementsystem.integrantes i
          INNER JOIN taskmanagementsystem.equipos_integrantes ei ON i.id = ei.integrante_id
          WHERE ei.equipo_id IN (${placeholders})
          ORDER BY ei.equipo_id, i.nombre ASC
        `, equipoIds);
        
        integrantesColaboradores = integrantes_colab_result[0] || [];
      }
      
      return {
        sistema_id: sistemaId,
        sistema_nombre: sistema.nombre,
        criticidad: sistema.criticidad,
        categoria: sistema.categoria,
        equipo_primario_nombre: equipoPrincipal.nombre,
        equipo_primario_descripcion: equipoPrincipal.descripcion,
        equipo_primario_telefono: equipoPrincipal.telefono_guardia,
        equipo_primario_color: equipoPrincipal.color,
        integrantes_primarios: integrantesPrimarios,
        equipos_colaboradores: equiposColaboradores,
        integrantes_colaboradores: integrantesColaboradores,
        total_equipos_asignados: equipos.length,
        total_integrantes_disponibles: integrantesPrimarios.length + integrantesColaboradores.length,
        tiene_colaboradores: equiposColaboradores.length > 0
      };
    } catch (error) {
      console.error('Error al obtener flujo por sistema:', error);
      throw error;
    }
  }

  // ===============================
  // BÚSQUEDAS Y UTILIDADES
  // ===============================
  
  static async buscarContactos(termino) {
    try {
      const searchTerm = `%${termino}%`;
      
      // Buscar en equipos
      const equipos_result = await db.query(`
        SELECT 
          'equipo' as tipo,
          id,
          nombre,
          descripcion,
          telefono_guardia as telefono,
          null as email,
          color
        FROM taskmanagementsystem.equipos_tecnicos
        WHERE estado = 'activo' 
        AND (nombre LIKE ? OR descripcion LIKE ?)
        ORDER BY nombre ASC
      `, [searchTerm, searchTerm]);
      
      // Buscar en integrantes
      const integrantes_result = await db.query(`
        SELECT 
          'integrante' as tipo,
          id,
          CONCAT(nombre, ' ', apellido) as nombre,
          rol as descripcion,
          telefono_personal as telefono,
          email,
          null as color
        FROM taskmanagementsystem.integrantes
        WHERE (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR rol LIKE ?)
        ORDER BY nombre ASC, apellido ASC
      `, [searchTerm, searchTerm, searchTerm, searchTerm]);
      
      // Buscar en sistemas monitoreados
      const sistemas_result = await db.query(`
        SELECT 
          'sistema' as tipo,
          id,
          nombre,
          descripcion,
          null as telefono,
          null as email,
          null as color
        FROM taskmanagementsystem.sistemas_monitoreados
        WHERE estado = 'operativo' 
        AND (nombre LIKE ? OR descripcion LIKE ?)
        ORDER BY criticidad DESC, nombre ASC
      `, [searchTerm, searchTerm]);
      
      return [
        ...(equipos_result[0] || []),
        ...(integrantes_result[0] || []),
        ...(sistemas_result[0] || [])
      ];
    } catch (error) {
      console.error('Error al buscar contactos:', error);
      throw error;
    }
  }

  // ===============================
  // ASIGNACIONES
  // ===============================

  static async asignarIntegrantes(equipoId, integranteIds) {
    const connection = await db.getConnection();
    try {
      const transaction = await connection.beginTransaction();
      
      // Primero eliminar asignaciones existentes
      await transaction.query(
        'DELETE FROM taskmanagementsystem.equipos_integrantes WHERE equipo_id = ?',
        [equipoId]
      );
      
      // Luego agregar las nuevas asignaciones
      if (integranteIds.length > 0) {
        for (const integranteId of integranteIds) {
          await transaction.query(
            'INSERT INTO taskmanagementsystem.equipos_integrantes (equipo_id, integrante_id, es_responsable_principal) VALUES (?, ?, ?)',
            [equipoId, integranteId, 0]
          );
        }
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Error al asignar integrantes:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async asignarSistemas(equipoId, sistemaIds) {
    const connection = await db.getConnection();
    try {
      const transaction = await connection.beginTransaction();
      
      // Primero eliminar asignaciones existentes
      await transaction.query(
        'DELETE FROM taskmanagementsystem.equipos_sistemas WHERE equipo_id = ?',
        [equipoId]
      );
      
      // Luego agregar las nuevas asignaciones
      if (sistemaIds.length > 0) {
        for (const sistemaId of sistemaIds) {
          await transaction.query(
            'INSERT INTO taskmanagementsystem.equipos_sistemas (equipo_id, sistema_id, nivel_responsabilidad) VALUES (?, ?, ?)',
            [equipoId, sistemaId, 'primario']
          );
        }
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error('Error al asignar sistemas:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ===============================
  // MÉTODOS DE ASIGNACIÓN
  // ===============================
  
  static async asignarIntegrantesAEquipo(equipoId, integranteIds) {
    try {
      // Primero eliminar asignaciones existentes del equipo
      await db.query(`
        DELETE FROM taskmanagementsystem.equipos_integrantes WHERE equipo_id = ?
      `, [equipoId]);
      
      // Luego agregar las nuevas asignaciones
      if (integranteIds && integranteIds.length > 0) {
        for (let i = 0; i < integranteIds.length; i++) {
          const integranteId = integranteIds[i];
          const esResponsable = i === 0 ? 1 : 0; // El primero es responsable principal
          
          // Obtener el siguiente ID disponible
          const maxIdResult = await db.query(`
            SELECT ISNULL(MAX(id), 0) + 1 as next_id 
            FROM taskmanagementsystem.equipos_integrantes
          `);
          const nextId = maxIdResult[0][0].next_id;
          
          await db.query(`
            INSERT INTO taskmanagementsystem.equipos_integrantes 
            (id, equipo_id, integrante_id, es_responsable_principal, fecha_asignacion)
            VALUES (?, ?, ?, ?, GETDATE())
          `, [nextId, equipoId, integranteId, esResponsable]);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al asignar integrantes a equipo:', error);
      throw error;
    }
  }

  static async asignarEquiposASistema(sistemaId, equipoIds) {
    try {
      // Primero eliminar asignaciones existentes del sistema
      await db.query(`
        DELETE FROM taskmanagementsystem.equipos_sistemas WHERE sistema_id = ?
      `, [sistemaId]);
      
      // Luego agregar las nuevas asignaciones
      if (equipoIds && equipoIds.length > 0) {
        for (let i = 0; i < equipoIds.length; i++) {
          const equipoId = equipoIds[i];
          const esResponsable = i === 0 ? 1 : 0; // El primero es responsable principal
          
          // Obtener el siguiente ID disponible
          const maxIdResult = await db.query(`
            SELECT ISNULL(MAX(id), 0) + 1 as next_id 
            FROM taskmanagementsystem.equipos_sistemas
          `);
          const nextId = maxIdResult[0][0].next_id;
          
          await db.query(`
            INSERT INTO taskmanagementsystem.equipos_sistemas 
            (id, equipo_id, sistema_id, es_responsable_principal, nivel_responsabilidad)
            VALUES (?, ?, ?, ?, ?)
          `, [nextId, equipoId, sistemaId, esResponsable, 'primario']);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al asignar equipos a sistema:', error);
      throw error;
    }
  }
}

module.exports = ContactosModel;