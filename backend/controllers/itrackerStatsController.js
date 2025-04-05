const pool = require('../config/db');

exports.getItrackerStats = async (req, res) => {
  const year = req.query.year;
  const month = req.query.month;

  try {
    const conditions = [];
    const params = [];

    if (year && year !== 'all') {
      conditions.push("YEAR(fecha_apertura) = ?");
      params.push(year);
    }

    if (month && month !== 'all') {
      conditions.push("MONTH(fecha_apertura) = ?");
      params.push(month);
    }

    const runQuery = async (baseQuery, extraCondition = '', groupOrder = '') => {
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const fullQuery = `${baseQuery} ${where} ${extraCondition} ${groupOrder}`.trim();
      const [rows] = await pool.query(fullQuery, params);
      return rows;
    };

    const total = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data"))[0].total;
    const masivos = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data", "AND t_1 = 'Incidentes Masivos'"))[0].total;
    const puntuales = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data", "AND t_1 = 'Incidentes Puntuales'"))[0].total;
    const abm = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data", "AND t_1 LIKE '%ABM%'"))[0].total;

    const fechaMaxRows = await runQuery(
      "SELECT fecha_apertura, COUNT(*) AS cantidad FROM itracker_data",
      '',
      "GROUP BY fecha_apertura ORDER BY cantidad DESC LIMIT 1"
    );
    const fechaMax = fechaMaxRows[0]?.fecha_apertura || null;

    const porMes = await runQuery(
      "SELECT MONTH(fecha_apertura) AS mes, COUNT(*) AS cantidad FROM itracker_data",
      '',
      "GROUP BY mes ORDER BY mes"
    );

    const porCausa = await runQuery(
      "SELECT t_2 AS causa, COUNT(*) AS cantidad FROM itracker_data",
      '',
      "GROUP BY t_2 ORDER BY cantidad DESC"
    );

    const usuariosCierre = await runQuery(
      "SELECT usuario_cierre AS name, COUNT(*) AS cantidad FROM itracker_data",
      '',
      "GROUP BY usuario_cierre ORDER BY cantidad DESC"
    );

    const porCentro = await runQuery(
      "SELECT equipo_apertura AS centro, COUNT(*) AS cantidad FROM itracker_data",
      '',
      "GROUP BY equipo_apertura ORDER BY cantidad DESC"
    );

    const comentarios = await runQuery("SELECT cierre_comentario FROM itracker_data");

    const wordCounts = {};
    comentarios.forEach(({ cierre_comentario }) => {
      if (cierre_comentario) {
        cierre_comentario
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .split(/\s+/)
          .forEach((word) => {
            if (word.length > 3) {
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
          });
      }
    });

    const tags = Object.entries(wordCounts)
      .map(([palabra, veces]) => ({ palabra, veces }))
      .sort((a, b) => b.veces - a.veces)
      .slice(0, 20);

    res.json({
      total,
      masivos,
      puntuales,
      abm,
      fechaMax,
      porMes,
      porCausa,
      usuariosCierre,
      porCentro,
      tags,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de iTracker:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de iTracker' });
  }
};
