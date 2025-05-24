// controllers/notificaciones.controller.js
const pool = require('../config/db');

// Obtener notificaciones de un usuario
exports.getNotificacionesUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { solo_no_leidas = false } = req.query;
    
    let query = `
      SELECT * FROM notificaciones 
      WHERE id_usuario = ?
    `;
    
    const params = [id_usuario];
    
    if (solo_no_leidas === 'true') {
      query += ' AND leida = FALSE';
    }
    
    query += ' ORDER BY fecha_creacion DESC';
    
    const [notificaciones] = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      data: notificaciones
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

// Marcar notificación como leída
exports.marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'UPDATE notificaciones SET leida = TRUE WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída',
      error: error.message
    });
  }
};

// Marcar todas las notificaciones como leídas
exports.marcarTodasComoLeidas = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    
    await pool.query(
      'UPDATE notificaciones SET leida = TRUE WHERE id_usuario = ? AND leida = FALSE',
      [id_usuario]
    );
    
    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas las notificaciones como leídas',
      error: error.message
    });
  }
};

// Obtener contador de notificaciones no leídas
exports.getContadorNoLeidas = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    
    const [result] = await pool.query(
      'SELECT COUNT(*) as total FROM notificaciones WHERE id_usuario = ? AND leida = FALSE',
      [id_usuario]
    );
    
    res.status(200).json({
      success: true,
      data: { total: result[0].total }
    });
  } catch (error) {
    console.error('Error al obtener contador de notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contador de notificaciones',
      error: error.message
    });
  }
};

module.exports = exports;