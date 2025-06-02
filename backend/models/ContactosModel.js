// =============================================
// MODELO COMPLETO: ContactosModel.js - PARTE 1 DE 3
// =============================================

const db = require('../config/db');

class ContactosModel {
  // ===============================
  // EQUIPOS TÉCNICOS
  // ===============================
  
  static async getAllEquipos() {
    try {
      const [equipos] = await db.query(`
        SELECT 
          et.*,
          COUNT(DISTINCT ei.integrante_id) as total_integrantes,
          COUNT(DISTINCT es.sistema_id) as total_sistemas,
          COUNT(DISTINCT CASE WHEN i.disponibilidad = 'disponible' THEN ei.integrante_id END) as integrantes_disponibles
        FROM equipos_tecnicos et
        LEFT JOIN equipos_integrantes ei ON et.id = ei.equipo_id
        LEFT JOIN equipos_sistemas es ON et.id = es.equipo_id
        LEFT JOIN integrantes i ON ei.integrante_id = i.id
        WHERE et.estado = 'activo'
        GROUP BY et.id
        ORDER BY et.orden_visualizacion ASC, et.nombre ASC
      `);
      
      // Para cada equipo, obtener sus integrantes y sistemas
      for (let equipo of equipos) {
        // Obtener integrantes
        const [integrantes] = await db.query(`
          SELECT 
            i.*,
            ei.es_responsable_principal,
            ei.fecha_asignacion,
            ei.notas_asignacion
          FROM integrantes i
          INNER JOIN equipos_integrantes ei ON i.id = ei.integrante_id
          WHERE ei.equipo_id = ?
          ORDER BY ei.es_responsable_principal DESC, i.nombre ASC
        `, [equipo.id]);
        
        // Obtener sistemas
        const [sistemas] = await db.query(`
          SELECT 
            s.*,
            es.es_responsable_principal,
            es.nivel_responsabilidad,
            es.notas
          FROM sistemas_monitoreados s
          INNER JOIN equipos_sistemas es ON s.id = es.sistema_id
          WHERE es.equipo_id = ?
          ORDER BY es.es_responsable_principal DESC, s.criticidad DESC, s.nombre ASC
        `, [equipo.id]);
        
        equipo.integrantes = integrantes;
        equipo.sistemas = sistemas;
      }
      
      return equipos;
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      throw error;
    }
  }

  static async getEquipoById(id) {
    try {
      const [equipos] = await db.query(`
        SELECT et.* FROM equipos_tecnicos et WHERE et.id = ?
      `, [id]);
      
      if (equipos.length === 0) return null;
      
      const equipo = equipos[0];
      
      // Obtener integrantes con detalles
      const [integrantes] = await db.query(`
        SELECT 
          i.*,
          ei.es_responsable_principal,
          ei.fecha_asignacion,
          ei.notas_asignacion
        FROM integrantes i
        INNER JOIN equipos_integrantes ei ON i.id = ei.integrante_id
        WHERE ei.equipo_id = ?
        ORDER BY ei.es_responsable_principal DESC, i.nombre ASC
      `, [id]);
      
      // Obtener sistemas
      const [sistemas] = await db.query(`
        SELECT 
          s.*,
          es.es_responsable_principal,
          es.nivel_responsabilidad
        FROM sistemas_monitoreados s
        INNER JOIN equipos_sistemas es ON s.id = es.sistema_id
        WHERE es.equipo_id = ?
        ORDER BY es.es_responsable_principal DESC, s.criticidad DESC
      `, [id]);
      
      equipo.integrantes = integrantes;
      equipo.sistemas = sistemas;
      
      return equipo;
    } catch (error) {
      console.error('Error al obtener equipo por ID:', error);
      throw error;
    }
  }

  static async createEquipo(equipoData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO equipos_tecnicos 
         (nombre, descripcion, telefono_guardia, email_grupo, color, orden_visualizacion) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          equipoData.nombre,
          equipoData.descripcion || null,
          equipoData.telefono_guardia || null,
          equipoData.email_grupo || null,
          equipoData.color || '#007bff',
          equipoData.orden_visualizacion || 999
        ]
      );
      
      const equipoId = result.insertId;
      
      // Asignar integrantes si se proporcionan
      if (equipoData.integrantes && equipoData.integrantes.length > 0) {
        for (const integranteId of equipoData.integrantes) {
          await connection.query(
            `INSERT INTO equipos_integrantes (equipo_id, integrante_id) VALUES (?, ?)`,
            [equipoId, integranteId]
          );
        }
      }
      
      // Asignar sistemas si se proporcionan
      if (equipoData.sistemas && equipoData.sistemas.length > 0) {
        for (const sistemaData of equipoData.sistemas) {
          await connection.query(
            `INSERT INTO equipos_sistemas (equipo_id, sistema_id, es_responsable_principal, nivel_responsabilidad) 
             VALUES (?, ?, ?, ?)`,
            [equipoId, sistemaData.id, sistemaData.es_responsable_principal || false, sistemaData.nivel_responsabilidad || 'primario']
          );
        }
      }
      
      await connection.commit();
      return equipoId;
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear equipo:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateEquipo(id, equipoData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `UPDATE equipos_tecnicos 
         SET nombre = ?, descripcion = ?, telefono_guardia = ?, email_grupo = ?, color = ?, orden_visualizacion = ?
         WHERE id = ?`,
        [
          equipoData.nombre,
          equipoData.descripcion || null,
          equipoData.telefono_guardia || null,
          equipoData.email_grupo || null,
          equipoData.color || '#007bff',
          equipoData.orden_visualizacion || 999,
          id
        ]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar equipo:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteEquipo(id) {
    try {
      const [result] = await db.query('DELETE FROM equipos_tecnicos WHERE id = ?', [id]);
      return result.affectedRows > 0;
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
      const [integrantes] = await db.query(`
        SELECT 
          i.*,
          GROUP_CONCAT(DISTINCT et.nombre SEPARATOR ', ') as equipos_nombres,
          COUNT(DISTINCT ei.equipo_id) as total_equipos
        FROM integrantes i
        LEFT JOIN equipos_integrantes ei ON i.id = ei.integrante_id
        LEFT JOIN equipos_tecnicos et ON ei.equipo_id = et.id AND et.estado = 'activo'
        GROUP BY i.id
        ORDER BY i.nombre ASC, i.apellido ASC
      `);
      
      return integrantes;
    } catch (error) {
      console.error('Error al obtener integrantes:', error);
      throw error;
    }
  }

  static async createIntegrante(integranteData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO integrantes 
         (nombre, apellido, rol, telefono_personal, email, whatsapp, disponibilidad, es_coordinador, notas) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          integranteData.nombre,
          integranteData.apellido,
          integranteData.rol || null,
          integranteData.telefono_personal || null,
          integranteData.email || null,
          integranteData.whatsapp || null,
          integranteData.disponibilidad || 'disponible',
          integranteData.es_coordinador || false,
          integranteData.notas || null
        ]
      );
      
      const integranteId = result.insertId;
      
      // Asignar a equipos si se proporcionan
      if (integranteData.equipos && integranteData.equipos.length > 0) {
        for (const equipoId of integranteData.equipos) {
          await connection.query(
            `INSERT INTO equipos_integrantes (equipo_id, integrante_id) VALUES (?, ?)`,
            [equipoId, integranteId]
          );
        }
      }
      
      await connection.commit();
      return integranteId;
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear integrante:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateIntegrante(id, integranteData) {
    try {
      const [result] = await db.query(
        `UPDATE integrantes 
         SET nombre = ?, apellido = ?, rol = ?, telefono_personal = ?, email = ?, 
             whatsapp = ?, disponibilidad = ?, es_coordinador = ?, notas = ?
         WHERE id = ?`,
        [
          integranteData.nombre,
          integranteData.apellido,
          integranteData.rol || null,
          integranteData.telefono_personal || null,
          integranteData.email || null,
          integranteData.whatsapp || null,
          integranteData.disponibilidad || 'disponible',
          integranteData.es_coordinador || false,
          integranteData.notas || null,
          id
        ]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar integrante:', error);
      throw error;
    }
  }

  static async deleteIntegrante(id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Primero eliminar las asignaciones a equipos
      await connection.query(
        'DELETE FROM equipos_integrantes WHERE integrante_id = ?',
        [id]
      );
      
      // Luego eliminar el integrante
      const [result] = await connection.query(
        'DELETE FROM integrantes WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al eliminar integrante:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  // ===============================
  // SISTEMAS MONITOREADOS
  // ===============================
  
  static async getAllSistemas() {
    try {
      const [sistemas] = await db.query(`
        SELECT 
          s.*,
          GROUP_CONCAT(DISTINCT 
            CONCAT(et.nombre, ' (', es.nivel_responsabilidad, ')') 
            ORDER BY es.es_responsable_principal DESC, et.nombre ASC
            SEPARATOR ', '
          ) as equipos_responsables,
          COUNT(DISTINCT es.equipo_id) as total_equipos
        FROM sistemas_monitoreados s
        LEFT JOIN equipos_sistemas es ON s.id = es.sistema_id
        LEFT JOIN equipos_tecnicos et ON es.equipo_id = et.id AND et.estado = 'activo'
        GROUP BY s.id
        ORDER BY s.criticidad DESC, s.nombre ASC
      `);
      
      return sistemas;
    } catch (error) {
      console.error('Error al obtener sistemas:', error);
      throw error;
    }
  }

  static async createSistema(sistemaData) {
    try {
      const [result] = await db.query(
        `INSERT INTO sistemas_monitoreados 
         (nombre, descripcion, criticidad, categoria, estado, url_monitoreo, documentacion_url, orden_visualizacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sistemaData.nombre,
          sistemaData.descripcion || null,
          sistemaData.criticidad || 'media',
          sistemaData.categoria || null,
          sistemaData.estado || 'operativo',
          sistemaData.url_monitoreo || null,
          sistemaData.documentacion_url || null,
          sistemaData.orden_visualizacion || 999
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error al crear sistema:', error);
      throw error;
    }
  }

  static async updateSistema(id, sistemaData) {
    try {
      const [result] = await db.query(
        `UPDATE sistemas_monitoreados 
         SET nombre = ?, descripcion = ?, criticidad = ?, categoria = ?, 
             estado = ?, url_monitoreo = ?, documentacion_url = ?
         WHERE id = ?`,
        [
          sistemaData.nombre,
          sistemaData.descripcion || null,
          sistemaData.criticidad || 'media',
          sistemaData.categoria || null,
          sistemaData.estado || 'operativo',
          sistemaData.url_monitoreo || null,
          sistemaData.documentacion_url || null,
          id
        ]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar sistema:', error);
      throw error;
    }
  }

  static async deleteSistema(id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Eliminar asignaciones a equipos
      await connection.query(
        'DELETE FROM equipos_sistemas WHERE sistema_id = ?',
        [id]
      );
      
      // Eliminar flujos de escalamiento (si existen)
      await connection.query(
        'DELETE FROM flujos_escalamiento WHERE sistema_id = ?',
        [id]
      );
      
      // Eliminar el sistema
      const [result] = await connection.query(
        'DELETE FROM sistemas_monitoreados WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al eliminar sistema:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ===============================
  // ✅ SIMULADOR DE RESPUESTA - FLUJO DINÁMICO MEJORADO
  // ===============================
  
  static async getFlujoPorSistema(sistemaId) {
    try {
      console.log(`🔍 Generando flujo dinámico para sistema ID: ${sistemaId}`);
      
      // ========================================
      // 1. OBTENER INFORMACIÓN DEL SISTEMA
      // ========================================
      const [sistemas] = await db.query(`
        SELECT id, nombre, descripcion, criticidad, categoria, estado
        FROM sistemas_monitoreados 
        WHERE id = ?
      `, [sistemaId]);
      
      if (sistemas.length === 0) {
        console.log(`❌ Sistema ${sistemaId} no encontrado`);
        return null;
      }
      
      const sistema = sistemas[0];
      console.log(`✅ Sistema encontrado: ${sistema.nombre} (${sistema.criticidad})`);
      
      // ========================================
      // 2. OBTENER EQUIPOS ASIGNADOS AL SISTEMA
      // ========================================
      const [equiposAsignados] = await db.query(`
        SELECT 
          et.id,
          et.nombre,
          et.descripcion,
          et.telefono_guardia,
          et.email_grupo,
          et.color,
          es.nivel_responsabilidad,
          es.es_responsable_principal
        FROM equipos_tecnicos et
        INNER JOIN equipos_sistemas es ON et.id = es.equipo_id
        WHERE es.sistema_id = ? AND et.estado = 'activo'
        ORDER BY es.es_responsable_principal DESC, et.nombre ASC
      `, [sistemaId]);
      
      if (equiposAsignados.length === 0) {
        console.log(`❌ No hay equipos asignados al sistema ${sistema.nombre}`);
        return null;
      }
      
      console.log(`✅ Equipos asignados encontrados: ${equiposAsignados.length}`);
      
      // ========================================
      // 3. DEFINIR EQUIPO PRINCIPAL Y COLABORADORES
      // ========================================
      const equipoPrincipal = equiposAsignados[0]; // Primer equipo asignado
      const equiposColaboradores = equiposAsignados.slice(1); // Resto de equipos
      
      console.log(`🎯 Equipo principal: ${equipoPrincipal.nombre}`);
      console.log(`👥 Equipos colaboradores: ${equiposColaboradores.length}`);
      
      // ========================================
      // 4. OBTENER INTEGRANTES DEL EQUIPO PRINCIPAL
      // ========================================
      const [integrantesPrincipales] = await db.query(`
        SELECT 
          i.id, i.nombre, i.apellido, i.telefono_personal, i.whatsapp, 
          i.disponibilidad, i.es_coordinador, i.rol
        FROM integrantes i
        INNER JOIN equipos_integrantes ei ON i.id = ei.integrante_id
        WHERE ei.equipo_id = ? AND i.disponibilidad IN ('disponible', 'ocupado')
        ORDER BY i.es_coordinador DESC, i.nombre ASC
      `, [equipoPrincipal.id]);
      
      // ========================================
      // 5. OBTENER INTEGRANTES DE EQUIPOS COLABORADORES
      // ========================================
      let integrantesColaboradores = [];
      if (equiposColaboradores.length > 0) {
        const equipoColaboradorIds = equiposColaboradores.map(e => e.id);
        const placeholders = equipoColaboradorIds.map(() => '?').join(',');
        
        const [integrantesColab] = await db.query(`
          SELECT 
            i.id, i.nombre, i.apellido, i.telefono_personal, i.whatsapp, 
            i.disponibilidad, i.es_coordinador, i.rol,
            et.id as equipo_id, et.nombre as equipo_nombre, et.color as equipo_color
          FROM integrantes i
          INNER JOIN equipos_integrantes ei ON i.id = ei.integrante_id
          INNER JOIN equipos_tecnicos et ON ei.equipo_id = et.id
          WHERE ei.equipo_id IN (${placeholders}) AND i.disponibilidad IN ('disponible', 'ocupado')
          ORDER BY et.nombre ASC, i.es_coordinador DESC, i.nombre ASC
        `, equipoColaboradorIds);
        
        integrantesColaboradores = integrantesColab;
      }
      
      // ========================================
      // 6. CONSTRUIR FLUJO DINÁMICO
      // ========================================
      const flujo = {
        // Información del sistema
        sistema_id: sistemaId,
        sistema_nombre: sistema.nombre,
        criticidad: sistema.criticidad,
        categoria: sistema.categoria,
        estado: sistema.estado,
        
        // Información del equipo principal
        equipo_primario_id: equipoPrincipal.id,
        equipo_primario_nombre: equipoPrincipal.nombre,
        equipo_primario_telefono: equipoPrincipal.telefono_guardia,
        equipo_primario_color: equipoPrincipal.color,
        equipo_primario_descripcion: equipoPrincipal.descripcion,
        
        // Integrantes del equipo principal
        integrantes_primarios: integrantesPrincipales,
        
        // Información de equipos colaboradores (si existen)
        tiene_colaboradores: equiposColaboradores.length > 0,
        equipos_colaboradores: equiposColaboradores,
        integrantes_colaboradores: integrantesColaboradores,
        
        // Configuración del flujo (sin tiempos de escalamiento)
        tiempo_escalamiento_minutos: null, // No aplica en este flujo
        condicion_escalamiento: equiposColaboradores.length > 0 ? 
          'Puede involucrar otros equipos para la solución si es necesario' : 
          'Resolución directa por el equipo responsable',
        
        // Información adicional
        total_equipos_asignados: equiposAsignados.length,
        total_integrantes_disponibles: integrantesPrincipales.length + integrantesColaboradores.length,
        activo: true
      };
      
      console.log(`✅ Flujo dinámico generado exitosamente para ${sistema.nombre}`);
      console.log(`📊 Resumen: ${flujo.total_equipos_asignados} equipos, ${flujo.total_integrantes_disponibles} integrantes`);
      
      return flujo;
      
    } catch (error) {
      console.error('❌ Error al generar flujo dinámico:', error);
      throw error;
    }
  }
  // ===============================
  // BÚSQUEDAS Y FILTROS
  // ===============================
  
  static async buscarContactos(termino) {
    try {
      const [resultados] = await db.query(`
        SELECT 
          'equipo' as tipo,
          et.id,
          et.nombre as titulo,
          et.descripcion,
          et.telefono_guardia as telefono,
          et.email_grupo as email,
          et.color,
          NULL as rol
        FROM equipos_tecnicos et
        WHERE et.estado = 'activo' 
          AND (et.nombre LIKE ? OR et.descripcion LIKE ?)
        
        UNION ALL
        
        SELECT 
          'integrante' as tipo,
          i.id,
          CONCAT(i.nombre, ' ', i.apellido) as titulo,
          i.rol as descripcion,
          i.telefono_personal as telefono,
          i.email,
          '#6c757d' as color,
          i.rol
        FROM integrantes i
        WHERE i.nombre LIKE ? OR i.apellido LIKE ? OR i.rol LIKE ?
        
        UNION ALL
        
        SELECT 
          'sistema' as tipo,
          s.id,
          s.nombre as titulo,
          s.descripcion,
          NULL as telefono,
          NULL as email,
          CASE 
            WHEN s.criticidad = 'alta' THEN '#dc3545'
            WHEN s.criticidad = 'media' THEN '#ffc107' 
            ELSE '#28a745'
          END as color,
          s.categoria as rol
        FROM sistemas_monitoreados s
        WHERE s.estado IN ('operativo', 'mantenimiento')
          AND (s.nombre LIKE ? OR s.descripcion LIKE ? OR s.categoria LIKE ?)
        
        ORDER BY tipo, titulo
      `, [
        `%${termino}%`, `%${termino}%`, // equipos
        `%${termino}%`, `%${termino}%`, `%${termino}%`, // integrantes  
        `%${termino}%`, `%${termino}%`, `%${termino}%`  // sistemas
      ]);
      
      return resultados;
    } catch (error) {
      console.error('Error en búsqueda de contactos:', error);
      throw error;
    }
  }
  
  // ===============================
  // HISTORIAL DE CONTACTOS
  // ===============================
  
  static async registrarContacto(contactoData) {
    try {
      const [result] = await db.query(
        `INSERT INTO historial_incidentes_contactos 
         (sistema_id, equipo_contactado_id, integrante_contactado_id, fecha_incidente, 
          medio_contacto, tiempo_respuesta_minutos, resuelto, observaciones, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contactoData.sistema_id || null,
          contactoData.equipo_contactado_id || null,
          contactoData.integrante_contactado_id || null,
          contactoData.fecha_incidente || new Date(),
          contactoData.medio_contacto || 'telefono',
          contactoData.tiempo_respuesta_minutos || null,
          contactoData.resuelto || false,
          contactoData.observaciones || null,
          contactoData.created_by || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error al registrar contacto:', error);
      throw error;
    }
  }

  static async getHistorialContactos(sistemaId = null, equipoId = null, limit = 50) {
    try {
      let whereClause = '1=1';
      let params = [];
      
      if (sistemaId) {
        whereClause += ' AND hic.sistema_id = ?';
        params.push(sistemaId);
      }
      
      if (equipoId) {
        whereClause += ' AND hic.equipo_contactado_id = ?';
        params.push(equipoId);
      }
      
      params.push(limit);
      
      const [historial] = await db.query(`
        SELECT 
          hic.*,
          s.nombre as sistema_nombre,
          et.nombre as equipo_nombre,
          CONCAT(i.nombre, ' ', i.apellido) as integrante_nombre,
          u.nombre as created_by_nombre
        FROM historial_incidentes_contactos hic
        LEFT JOIN sistemas_monitoreados s ON hic.sistema_id = s.id
        LEFT JOIN equipos_tecnicos et ON hic.equipo_contactado_id = et.id
        LEFT JOIN integrantes i ON hic.integrante_contactado_id = i.id
        LEFT JOIN usuarios u ON hic.created_by = u.id
        WHERE ${whereClause}
        ORDER BY hic.fecha_incidente DESC
        LIMIT ?
      `, params);
      
      return historial;
    } catch (error) {
      console.error('Error al obtener historial de contactos:', error);
      throw error;
    }
  }

  // ===============================
  // ASIGNACIONES
  // ===============================

  static async asignarIntegrantes(equipoId, integranteIds) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Primero eliminar asignaciones existentes
      await connection.query(
        'DELETE FROM equipos_integrantes WHERE equipo_id = ?',
        [equipoId]
      );
      
      // Luego agregar las nuevas asignaciones
      if (integranteIds.length > 0) {
        for (const integranteId of integranteIds) {
          await connection.query(
            'INSERT INTO equipos_integrantes (equipo_id, integrante_id, fecha_asignacion) VALUES (?, ?, NOW())',
            [equipoId, integranteId]
          );
        }
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error al asignar integrantes:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async asignarSistemas(equipoId, sistemaIds) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Primero eliminar asignaciones existentes
      await connection.query(
        'DELETE FROM equipos_sistemas WHERE equipo_id = ?',
        [equipoId]
      );
      
      // Luego agregar las nuevas asignaciones
      if (sistemaIds.length > 0) {
        for (const sistemaId of sistemaIds) {
          await connection.query(
            'INSERT INTO equipos_sistemas (equipo_id, sistema_id, nivel_responsabilidad) VALUES (?, ?, ?)',
            [equipoId, sistemaId, 'primario']
          );
        }
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error al asignar sistemas:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async asignarEquiposASistema(sistemaId, equipoIds) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Primero eliminar asignaciones existentes
      await connection.query(
        'DELETE FROM equipos_sistemas WHERE sistema_id = ?',
        [sistemaId]
      );
      
      // Luego agregar las nuevas asignaciones
      if (equipoIds.length > 0) {
        for (const equipoId of equipoIds) {
          await connection.query(
            'INSERT INTO equipos_sistemas (equipo_id, sistema_id, nivel_responsabilidad) VALUES (?, ?, ?)',
            [equipoId, sistemaId, 'primario']
          );
        }
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error al asignar equipos a sistema:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ContactosModel;