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
      let fullConditions = [...conditions];
      let fullParams = [...params];

      if (extraCondition) {
        fullConditions.push(extraCondition.condition);
        fullParams.push(...(extraCondition.params || []));
      }

      const where = fullConditions.length ? `WHERE ${fullConditions.join(' AND ')}` : '';
      const fullQuery = `${baseQuery} ${where} ${groupOrder}`.trim();
      const [rows] = await pool.query(fullQuery, fullParams);
      return rows;
    };

    // Consulta para obtener la fecha del último registro cargado
    const [ultimaActualizacionRes] = await pool.query(`
      SELECT MAX(fecha_cierre) as ultima_fecha FROM itracker_data
    `);
    
    // Formateamos la fecha a dd/mm/yyyy para consistencia con el formato usado en AbmDashboard
    let ultimaActualizacion = 'Fecha no disponible';
    if (ultimaActualizacionRes[0]?.ultima_fecha) {
      const fechaUltima = new Date(ultimaActualizacionRes[0].ultima_fecha);
      if (!isNaN(fechaUltima.getTime())) {
        ultimaActualizacion = fechaUltima.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

    const total = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data"))[0].total;
    const masivos = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data", { condition: "t_1 = 'Incidentes Masivos'" }))[0].total;
    const puntuales = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data", { condition: "t_1 = 'Incidentes Puntuales'" }))[0].total;
    const abm = (await runQuery("SELECT COUNT(*) AS total FROM itracker_data", { condition: "t_1 LIKE '%ABM%'" }))[0].total;

    const fechaMaxRows = await runQuery(
      "SELECT fecha_apertura, COUNT(*) AS cantidad FROM itracker_data",
      null,
      "GROUP BY fecha_apertura ORDER BY cantidad DESC LIMIT 1"
    );
    const fechaMax = fechaMaxRows[0]?.fecha_apertura || null;

    const porMes = await runQuery(
      "SELECT MONTH(fecha_apertura) AS mes, COUNT(*) AS cantidad FROM itracker_data",
      null,
      "GROUP BY mes ORDER BY mes"
    );

    const porCausa = await runQuery(
      "SELECT t_2 AS causa, COUNT(*) AS cantidad FROM itracker_data",
      null,
      "GROUP BY t_2 ORDER BY cantidad DESC"
    );

    const usuariosCierre = await runQuery(
      "SELECT usuario_cierre AS name, COUNT(*) AS cantidad FROM itracker_data",
      null,
      "GROUP BY usuario_cierre ORDER BY cantidad DESC"
    );

    const porCentro = await runQuery(
      "SELECT equipo_apertura AS centro, COUNT(*) AS cantidad FROM itracker_data",
      null,
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
      ultimaActualizacion // Añadimos la fecha de última actualización a la respuesta
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de iTracker:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de iTracker' });
  }
};