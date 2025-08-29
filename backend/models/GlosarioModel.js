// El modelo para la base de datos SQL Server actualizado para manejar categorías

const db = require('../config/db');

// Obtener todos los términos del glosario con información de categoría
const getAllTerminos = async () => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, gc.nombre as categoria_nombre, gc.color as categoria_color 
      FROM taskmanagementsystem.glosario g 
      LEFT JOIN taskmanagementsystem.glosario_categorias gc ON g.categoria_id = gc.id 
      ORDER BY g.termino ASC
    `);
    return rows;
  } catch (error) {
    console.error('Error al obtener términos de glosario:', error);
    throw error;
  }
};

// Obtener un término por ID
const getTerminoById = async (id) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, gc.nombre as categoria_nombre, gc.color as categoria_color 
      FROM taskmanagementsystem.glosario g 
      LEFT JOIN taskmanagementsystem.glosario_categorias gc ON g.categoria_id = gc.id 
      WHERE g.id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error al obtener término por ID:', error);
    throw error;
  }
};

// Obtener términos por letra inicial
const getTerminosByLetra = async (letra) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, gc.nombre as categoria_nombre, gc.color as categoria_color 
      FROM taskmanagementsystem.glosario g 
      LEFT JOIN taskmanagementsystem.glosario_categorias gc ON g.categoria_id = gc.id 
      WHERE g.termino LIKE ? 
      ORDER BY g.termino ASC
    `, [`${letra}%`]);
    return rows;
  } catch (error) {
    console.error('Error al obtener términos por letra:', error);
    throw error;
  }
};

// Obtener términos que comienzan con números
const getTerminosConNumeros = async () => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, gc.nombre as categoria_nombre, gc.color as categoria_color 
      FROM taskmanagementsystem.glosario g 
      LEFT JOIN taskmanagementsystem.glosario_categorias gc ON g.categoria_id = gc.id 
      WHERE g.termino LIKE '[0-9]%' 
      ORDER BY g.termino ASC
    `);
    return rows;
  } catch (error) {
    console.error('Error al obtener términos con números:', error);
    throw error;
  }
};

// Buscar términos
const buscarTerminos = async (busqueda) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, gc.nombre as categoria_nombre, gc.color as categoria_color 
      FROM taskmanagementsystem.glosario g 
      LEFT JOIN taskmanagementsystem.glosario_categorias gc ON g.categoria_id = gc.id 
      WHERE g.termino LIKE ? OR g.definicion LIKE ? 
      ORDER BY g.termino ASC
    `, [`%${busqueda}%`, `%${busqueda}%`]);
    return rows;
  } catch (error) {
    console.error('Error al buscar términos:', error);
    throw error;
  }
};

// Agregar un nuevo término
const agregarTermino = async (termino, definicion, categoria_id, creado_por) => {
  try {
    // Verificar si el término ya existe (prevenir duplicados)
    const [existingRows] = await db.query(
      'SELECT id FROM taskmanagementsystem.glosario WHERE LOWER(TRIM(termino)) = LOWER(TRIM(?))',
      [termino]
    );
    
    if (existingRows.length > 0) {
      throw new Error(`El término "${termino}" ya existe en el glosario`);
    }
    
    const [result] = await db.query(
      'INSERT INTO taskmanagementsystem.glosario (termino, definicion, categoria_id, creado_por) VALUES (?, ?, ?, ?)',
      [termino, definicion, categoria_id, creado_por]
    );
    
    // Verificar que el ID generado sea válido
    if (!result.insertId || result.insertId <= 0) {
      throw new Error('Error: No se pudo obtener un ID válido para el término insertado');
    }
    
    return result.insertId;
  } catch (error) {
    console.error('Error al agregar término:', error);
    throw error;
  }
};

// Actualizar un término
const actualizarTermino = async (id, termino, definicion, categoria_id) => {
  try {
    const [result] = await db.query(
      'UPDATE taskmanagementsystem.glosario SET termino = ?, definicion = ?, categoria_id = ? WHERE id = ?',
      [termino, definicion, categoria_id, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al actualizar término:', error);
    throw error;
  }
};

// Eliminar un término
const eliminarTermino = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM taskmanagementsystem.glosario WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al eliminar término:', error);
    throw error;
  }
};

// Obtener todas las categorías
const getAllCategorias = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM taskmanagementsystem.glosario_categorias ORDER BY nombre ASC');
    return rows;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

// Obtener términos por categoría
const getTerminosByCategoria = async (categoriaId) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, gc.nombre as categoria_nombre, gc.color as categoria_color 
      FROM taskmanagementsystem.glosario g 
      LEFT JOIN taskmanagementsystem.glosario_categorias gc ON g.categoria_id = gc.id 
      WHERE g.categoria_id = ? 
      ORDER BY g.termino ASC
    `, [categoriaId]);
    return rows;
  } catch (error) {
    console.error('Error al obtener términos por categoría:', error);
    throw error;
  }
};



module.exports = {
  getAllTerminos,
  getTerminoById,
  getTerminosByLetra,
  getTerminosConNumeros,
  buscarTerminos,
  agregarTermino,
  actualizarTermino,
  eliminarTermino,
  getAllCategorias,
  getTerminosByCategoria,
};