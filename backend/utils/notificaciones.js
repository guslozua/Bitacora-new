// utils/notificaciones.js
const db = require('../config/db');

/**
 * Enviar una notificación a un usuario
 * @param {Object} notificacionData - Datos de la notificación
 * @param {number} notificacionData.id_usuario - ID del usuario destinatario
 * @param {string} notificacionData.tipo - Tipo de notificación
 * @param {string} notificacionData.titulo - Título de la notificación
 * @param {string} notificacionData.mensaje - Mensaje de la notificación
 * @param {Object} notificacionData.datos_adicionales - Datos adicionales (opcional)
 */
const enviarNotificacion = async (notificacionData) => {
  try {
    const {
      id_usuario,
      tipo,
      titulo,
      mensaje,
      datos_adicionales = null
    } = notificacionData;

    // Extraer referencia_id y referencia_tipo de datos_adicionales si existen
    let referencia_id = null;
    let referencia_tipo = null;

    if (datos_adicionales) {
      if (datos_adicionales.id_incidente) {
        referencia_id = datos_adicionales.id_incidente;
        referencia_tipo = 'incidente';
      } else if (datos_adicionales.id_guardia) {
        referencia_id = datos_adicionales.id_guardia;
        referencia_tipo = 'guardia';
      }
    }

    const query = `
      INSERT INTO notificaciones 
      (id_usuario, tipo, titulo, mensaje, referencia_id, referencia_tipo, leida, fecha_creacion) 
      VALUES (?, ?, ?, ?, ?, ?, false, NOW())
    `;
    
    const [result] = await db.execute(query, [
      id_usuario,
      tipo,
      titulo,
      mensaje,
      referencia_id,
      referencia_tipo
    ]);

    console.log(`✅ Notificación enviada a usuario ${id_usuario}: ${titulo}`);
    return result.insertId;

  } catch (error) {
    console.error('❌ Error al enviar notificación:', error);
    throw error;
  }
};

/**
 * Enviar notificación a múltiples usuarios
 * @param {Array} usuarios - Array de IDs de usuarios
 * @param {Object} notificacionData - Datos de la notificación
 */
const enviarNotificacionMultiple = async (usuarios, notificacionData) => {
  try {
    const promesas = usuarios.map(id_usuario => 
      enviarNotificacion({
        ...notificacionData,
        id_usuario
      })
    );

    await Promise.all(promesas);
    console.log(`✅ Notificación enviada a ${usuarios.length} usuarios`);

  } catch (error) {
    console.error('❌ Error al enviar notificaciones múltiples:', error);
    throw error;
  }
};

module.exports = {
  enviarNotificacion,
  enviarNotificacionMultiple
};