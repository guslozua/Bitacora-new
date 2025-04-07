// controllers/itrackerListController.js
const pool = require('../config/db');

exports.getItrackerList = async (req, res) => {
  const { year, month, estado, usuario, equipo, causa, ticket } = req.query;

  const conditions = [];
  const params = [];

  if (ticket) {
    conditions.push('ticket_id = ?');
    params.push(ticket);
  } else {
    if (year && year !== 'all') {
      conditions.push('YEAR(fecha_apertura) = ?');
      params.push(year);
    }
    if (month && month !== 'all') {
      conditions.push('MONTH(fecha_apertura) = ?');
      params.push(month);
    }
    if (estado && estado !== 'all') {
      conditions.push('estado = ?');
      params.push(estado);
    }
    if (usuario && usuario !== 'all') {
      conditions.push('usuario_cierre = ?');
      params.push(usuario);
    }
    if (equipo && equipo !== 'all') {
      conditions.push('equipo_apertura = ?');
      params.push(equipo);
    }
    if (causa && causa !== 'all') {
      conditions.push('t_2 = ?');
      params.push(causa);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [rows] = await pool.query(
      `SELECT ticket_id, unido_a, t_1, t_2, fecha_apertura, equipo_apertura,
              apertura_descripcion_error,  -- ✅ agregado este campo
              fecha_cierre, usuario_cierre, cierre_tipo, cierre_comentario 
       FROM itracker_data
       ${where}
       ORDER BY fecha_apertura DESC
       LIMIT 1000`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener lista de tickets:', error);
    res.status(500).json({ error: 'Error al obtener la lista de tickets' });
  }
};
