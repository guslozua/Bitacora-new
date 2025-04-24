// controllers/abmStatsController.js
const pool = require('../config/db');

exports.getAbmStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    const where = [];
    if (year) where.push(`YEAR(fecha) = ${parseInt(year)}`);
    if (month) where.push(`MONTH(fecha) = ${parseInt(month)}`);

    // Construir las cláusulas WHERE correctamente
    // Si hay condiciones de fecha, añadimos el tipo con AND, sino comenzamos con WHERE para el tipo
    const makeSqlCondition = (baseWhere, additionalCondition) => {
      if (baseWhere.length) {
        return `WHERE ${baseWhere.join(' AND ')} AND ${additionalCondition}`;
      }
      return `WHERE ${additionalCondition}`;
    };

    // Totales por plataforma y tipo
    const [[{ total_altas_pic }]] = await pool.query(
      `SELECT SUM(cant_usuarios) AS total_altas_pic FROM abm_pic ${makeSqlCondition(where, "tipo = 'Alta'")}`
    );
    const [[{ total_bajas_pic }]] = await pool.query(
      `SELECT SUM(cant_usuarios) AS total_bajas_pic FROM abm_pic ${makeSqlCondition(where, "tipo = 'Baja'")}`
    );
    const [[{ total_altas_social }]] = await pool.query(
      `SELECT SUM(cant_usuarios) AS total_altas_social FROM abm_social ${makeSqlCondition(where, "tipo = 'Alta'")}`
    );
    const [[{ total_bajas_social }]] = await pool.query(
      `SELECT SUM(cant_usuarios) AS total_bajas_social FROM abm_social ${makeSqlCondition(where, "tipo = 'Baja'")}`
    );

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Totales netos (altas - bajas)
    const neto_pic = (total_altas_pic || 0) - (total_bajas_pic || 0);
    const neto_social = (total_altas_social || 0) - (total_bajas_social || 0);

    // Para consultas que incluyen el tipo en la cláusula GROUP BY o en otras partes de la consulta,
    // no necesitamos modificar la cláusula WHERE.
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Por mes con más detalle
    const [porMesPic] = await pool.query(`
      SELECT 
        MONTH(fecha) AS mes,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE 0 END) AS usuarios,
        SUM(CASE WHEN tipo = 'Baja' THEN cant_usuarios ELSE 0 END) AS bajas
      FROM abm_pic ${whereClause}
      GROUP BY mes ORDER BY mes
    `);

    const [porMesSocial] = await pool.query(`
      SELECT 
        MONTH(fecha) AS mes,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE 0 END) AS usuarios,
        SUM(CASE WHEN tipo = 'Baja' THEN cant_usuarios ELSE 0 END) AS bajas
      FROM abm_social ${whereClause}
      GROUP BY mes ORDER BY mes
    `);

    const porMesPicFormat = porMesPic.map(row => ({
      mes: meses[row.mes - 1],
      usuarios: row.usuarios,
      bajas: row.bajas,
      neto: row.usuarios - row.bajas
    }));

    const porMesSocialFormat = porMesSocial.map(row => ({
      mes: meses[row.mes - 1],
      usuarios: row.usuarios,
      bajas: row.bajas,
      neto: row.usuarios - row.bajas
    }));

    // Altas por centro
    const [topCentrosPic] = await pool.query(`
      SELECT centro, SUM(cant_usuarios) AS total
      FROM abm_pic ${makeSqlCondition(where, "tipo = 'Alta' AND centro IS NOT NULL")}
      GROUP BY centro ORDER BY total DESC LIMIT 10
    `);

    const [topCentrosSocial] = await pool.query(`
      SELECT centro, SUM(cant_usuarios) AS total
      FROM abm_social ${makeSqlCondition(where, "tipo = 'Alta' AND centro IS NOT NULL")}
      GROUP BY centro ORDER BY total DESC LIMIT 10
    `);

    // Altas por operación
    const [topOperacionesPic] = await pool.query(`
      SELECT operacion, SUM(cant_usuarios) AS total
      FROM abm_pic ${makeSqlCondition(where, "tipo = 'Alta' AND operacion IS NOT NULL")}
      GROUP BY operacion ORDER BY total DESC LIMIT 10
    `);

    const [topOperacionesSocial] = await pool.query(`
      SELECT operacion, SUM(cant_usuarios) AS total
      FROM abm_social ${makeSqlCondition(where, "tipo = 'Alta' AND operacion IS NOT NULL")}
      GROUP BY operacion ORDER BY total DESC LIMIT 10
    `);

    // Altas por gestión
    const [topGestionesPic] = await pool.query(`
      SELECT gestion, SUM(cant_usuarios) AS total
      FROM abm_pic ${makeSqlCondition(where, "tipo = 'Alta' AND gestion IS NOT NULL")}
      GROUP BY gestion ORDER BY total DESC LIMIT 10
    `);

    const [topGestionesSocial] = await pool.query(`
      SELECT gestion, SUM(cant_usuarios) AS total
      FROM abm_social ${makeSqlCondition(where, "tipo = 'Alta' AND gestion IS NOT NULL")}
      GROUP BY gestion ORDER BY total DESC LIMIT 10
    `);

    // Tendencia por año (nuevo)
    const tendenciaWhereClause = year ? 'WHERE YEAR(fecha) <= ' + parseInt(year) : '';

    const [tendenciaPic] = await pool.query(`
      SELECT 
        YEAR(fecha) AS anio,
        MONTH(fecha) AS mes, 
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE 0 END) AS altas,
        SUM(CASE WHEN tipo = 'Baja' THEN cant_usuarios ELSE 0 END) AS bajas,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE -cant_usuarios END) AS neto
      FROM abm_pic ${tendenciaWhereClause}
      GROUP BY anio, mes 
      ORDER BY anio, mes
      LIMIT 12
    `);

    const [tendenciaSocial] = await pool.query(`
      SELECT 
        YEAR(fecha) AS anio,
        MONTH(fecha) AS mes, 
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE 0 END) AS altas,
        SUM(CASE WHEN tipo = 'Baja' THEN cant_usuarios ELSE 0 END) AS bajas,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE -cant_usuarios END) AS neto
      FROM abm_social ${tendenciaWhereClause}
      GROUP BY anio, mes 
      ORDER BY anio, mes
      LIMIT 12
    `);

    // Últimas cargas (nuevo) usando created_at
    const [ultimasCargasPic] = await pool.query(`
    SELECT 
      fuente, 
      DATE_FORMAT(MAX(created_at), '%d/%m/%Y') AS ultima_fecha,
      SUM(cant_usuarios) AS total_usuarios
    FROM abm_pic
    GROUP BY fuente
    ORDER BY MAX(created_at) DESC
    LIMIT 5
    `);

    const [ultimasCargasSocial] = await pool.query(`
    SELECT 
      fuente, 
      DATE_FORMAT(MAX(created_at), '%d/%m/%Y') AS ultima_fecha,
      SUM(cant_usuarios) AS total_usuarios
    FROM abm_social
    GROUP BY fuente
    ORDER BY MAX(created_at) DESC
    LIMIT 5
    `);
    // Agregar console.log para verificar las fechas obtenidas
    console.log("Ultima fecha PIC:", ultimasCargasPic);
    console.log("Ultima fecha YSocial:", ultimasCargasSocial);

    // Resumen por tipo de gestión (nuevo)
    const [resumenGestionPic] = await pool.query(`
      SELECT 
        gestion,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE 0 END) AS altas,
        SUM(CASE WHEN tipo = 'Baja' THEN cant_usuarios ELSE 0 END) AS bajas,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE -cant_usuarios END) AS neto
      FROM abm_pic ${whereClause}
      GROUP BY gestion
      ORDER BY altas DESC
      LIMIT 10
    `);

    const [resumenGestionSocial] = await pool.query(`
      SELECT 
        gestion,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE 0 END) AS altas,
        SUM(CASE WHEN tipo = 'Baja' THEN cant_usuarios ELSE 0 END) AS bajas,
        SUM(CASE WHEN tipo = 'Alta' THEN cant_usuarios ELSE -cant_usuarios END) AS neto
      FROM abm_social ${whereClause}
      GROUP BY gestion
      ORDER BY altas DESC
      LIMIT 10
    `);

    res.json({
      total_altas_pic: total_altas_pic || 0,
      total_bajas_pic: total_bajas_pic || 0,
      total_altas_social: total_altas_social || 0,
      total_bajas_social: total_bajas_social || 0,
      neto_pic,
      neto_social,
      porMesPic: porMesPicFormat,
      porMesSocial: porMesSocialFormat,
      topCentrosPic,
      topCentrosSocial,
      topOperacionesPic,
      topOperacionesSocial,
      topGestionesPic,
      topGestionesSocial,
      tendenciaPic,
      tendenciaSocial,
      ultimasCargasPic,
      ultimasCargasSocial,
      resumenGestionPic,
      resumenGestionSocial
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de ABM:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas de ABM' });
  }
};