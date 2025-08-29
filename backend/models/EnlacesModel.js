// El modelo para la base de datos SQL Server para manejar enlaces

const db = require('../config/db');

// Obtener todos los enlaces con información de categoría y URLs adicionales
const getAllEnlaces = async () => {
  try {
    // Primero, obtener los enlaces principales
    const [enlaces] = await db.query(`
      SELECT e.*, ec.nombre as categoria_nombre, ec.color as categoria_color 
      FROM taskmanagementsystem.enlaces e 
      LEFT JOIN taskmanagementsystem.enlaces_categorias ec ON e.categoria_id = ec.id 
      ORDER BY e.titulo ASC
    `);
    
    // Para cada enlace, obtener sus URLs adicionales
    for (let enlace of enlaces) {
      const [urls] = await db.query(`
        SELECT id, url, titulo, orden
        FROM taskmanagementsystem.enlaces_urls
        WHERE enlace_id = ?
        ORDER BY orden ASC
      `, [enlace.id]);
      
      enlace.urls_adicionales = urls;
    }
    
    return enlaces;
  } catch (error) {
    console.error('Error al obtener enlaces:', error);
    throw error;
  }
};

// Obtener un enlace por ID
const getEnlaceById = async (id) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, ec.nombre as categoria_nombre, ec.color as categoria_color 
      FROM taskmanagementsystem.enlaces e 
      LEFT JOIN taskmanagementsystem.enlaces_categorias ec ON e.categoria_id = ec.id 
      WHERE e.id = ?
    `, [id]);
    
    if (rows.length === 0) return null;
    
    const enlace = rows[0];
    
    // Obtener las URLs adicionales
    const [urls] = await db.query(`
      SELECT id, url, titulo, orden
      FROM taskmanagementsystem.enlaces_urls
      WHERE enlace_id = ?
      ORDER BY orden ASC
    `, [enlace.id]);
    
    enlace.urls_adicionales = urls;
    
    return enlace;
  } catch (error) {
    console.error('Error al obtener enlace por ID:', error);
    throw error;
  }
};

// Obtener enlaces por letra inicial
const getEnlacesByLetra = async (letra) => {
  try {
    const [enlaces] = await db.query(`
      SELECT e.*, ec.nombre as categoria_nombre, ec.color as categoria_color 
      FROM taskmanagementsystem.enlaces e 
      LEFT JOIN taskmanagementsystem.enlaces_categorias ec ON e.categoria_id = ec.id 
      WHERE e.titulo LIKE ? 
      ORDER BY e.titulo ASC
    `, [`${letra}%`]);
    
    // Para cada enlace, obtener sus URLs adicionales
    for (let enlace of enlaces) {
      const [urls] = await db.query(`
        SELECT id, url, titulo, orden
        FROM taskmanagementsystem.enlaces_urls
        WHERE enlace_id = ?
        ORDER BY orden ASC
      `, [enlace.id]);
      
      enlace.urls_adicionales = urls;
    }
    
    return enlaces;
  } catch (error) {
    console.error('Error al obtener enlaces por letra:', error);
    throw error;
  }
};

// Obtener enlaces que comienzan con números
const getEnlacesConNumeros = async () => {
  try {
    const [enlaces] = await db.query(`
      SELECT e.*, ec.nombre as categoria_nombre, ec.color as categoria_color 
      FROM taskmanagementsystem.enlaces e 
      LEFT JOIN taskmanagementsystem.enlaces_categorias ec ON e.categoria_id = ec.id 
      WHERE e.titulo LIKE '[0-9]%' 
      ORDER BY e.titulo ASC
    `);
    
    // Para cada enlace, obtener sus URLs adicionales
    for (let enlace of enlaces) {
      const [urls] = await db.query(`
        SELECT id, url, titulo, orden
        FROM taskmanagementsystem.enlaces_urls
        WHERE enlace_id = ?
        ORDER BY orden ASC
      `, [enlace.id]);
      
      enlace.urls_adicionales = urls;
    }
    
    return enlaces;
  } catch (error) {
    console.error('Error al obtener enlaces con números:', error);
    throw error;
  }
};

// Buscar enlaces
const buscarEnlaces = async (busqueda) => {
  try {
    // Buscar enlaces principales que coincidan con el término de búsqueda
    const [enlaces] = await db.query(`
      SELECT DISTINCT e.*, ec.nombre as categoria_nombre, ec.color as categoria_color 
      FROM taskmanagementsystem.enlaces e 
      LEFT JOIN taskmanagementsystem.enlaces_categorias ec ON e.categoria_id = ec.id 
      LEFT JOIN taskmanagementsystem.enlaces_urls eu ON e.id = eu.enlace_id
      WHERE e.titulo LIKE ? OR e.descripcion LIKE ? OR e.url LIKE ? 
      OR eu.url LIKE ? OR eu.titulo LIKE ?
      ORDER BY e.titulo ASC
    `, [`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`]);
    
    // Para cada enlace, obtener sus URLs adicionales
    for (let enlace of enlaces) {
      const [urls] = await db.query(`
        SELECT id, url, titulo, orden
        FROM taskmanagementsystem.enlaces_urls
        WHERE enlace_id = ?
        ORDER BY orden ASC
      `, [enlace.id]);
      
      enlace.urls_adicionales = urls;
    }
    
    return enlaces;
  } catch (error) {
    console.error('Error al buscar enlaces:', error);
    throw error;
  }
};

// Agregar un nuevo enlace con URLs adicionales
const agregarEnlace = async (titulo, url, descripcion, categoria_id, creado_por, urls_adicionales = []) => {
  const connection = await db.getConnection();
  
  try {
    const transaction = await connection.beginTransaction();
    
    // Insertar el enlace principal
    const [result] = await transaction.query(
      'INSERT INTO taskmanagementsystem.enlaces (titulo, url, descripcion, categoria_id, creado_por) VALUES (?, ?, ?, ?, ?)',
      [titulo, url, descripcion, categoria_id, creado_por]
    );
    
    const enlaceId = result.insertId;
    
    // Verificar que obtuvimos un ID válido
    if (!enlaceId || enlaceId <= 0) {
      throw new Error('No se pudo obtener ID del enlace insertado');
    }
    
    // Insertar URLs adicionales si existen
    if (urls_adicionales && urls_adicionales.length > 0) {
      for (let i = 0; i < urls_adicionales.length; i++) {
        const { url, titulo } = urls_adicionales[i];
        if (url) {
          await transaction.query(
            'INSERT INTO taskmanagementsystem.enlaces_urls (enlace_id, url, titulo, orden) VALUES (?, ?, ?, ?)',
            [enlaceId, url, titulo || '', i + 1]
          );
        }
      }
    }
    
    await transaction.commit();
    return enlaceId;
  } catch (error) {
    await connection.rollback();
    console.error('Error al agregar enlace:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Actualizar un enlace con sus URLs adicionales
const actualizarEnlace = async (id, titulo, url, descripcion, categoria_id, urls_adicionales = []) => {
  const connection = await db.getConnection();
  
  try {
    const transaction = await connection.beginTransaction();
    
    // Actualizar el enlace principal
    const [result] = await transaction.query(
      'UPDATE taskmanagementsystem.enlaces SET titulo = ?, url = ?, descripcion = ?, categoria_id = ? WHERE id = ?',
      [titulo, url, descripcion, categoria_id, id]
    );
    
    // Eliminar URLs adicionales existentes para este enlace
    await transaction.query('DELETE FROM taskmanagementsystem.enlaces_urls WHERE enlace_id = ?', [id]);
    
    // Insertar nuevas URLs adicionales
    if (urls_adicionales && urls_adicionales.length > 0) {
      for (let i = 0; i < urls_adicionales.length; i++) {
        const { url, titulo } = urls_adicionales[i];
        if (url) {
          await transaction.query(
            'INSERT INTO taskmanagementsystem.enlaces_urls (enlace_id, url, titulo, orden) VALUES (?, ?, ?, ?)',
            [id, url, titulo || '', i + 1]
          );
        }
      }
    }
    
    await transaction.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar enlace:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Eliminar un enlace (y sus URLs adicionales gracias a ON DELETE CASCADE)
const eliminarEnlace = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM taskmanagementsystem.enlaces WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al eliminar enlace:', error);
    throw error;
  }
};

// Obtener todas las categorías
const getAllCategorias = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM taskmanagementsystem.enlaces_categorias ORDER BY nombre ASC');
    return rows;
  } catch (error) {
    console.error('Error al obtener categorías de enlaces:', error);
    throw error;
  }
};

// Obtener enlaces por categoría
const getEnlacesByCategoria = async (categoriaId) => {
  try {
    const [enlaces] = await db.query(`
      SELECT e.*, ec.nombre as categoria_nombre, ec.color as categoria_color 
      FROM taskmanagementsystem.enlaces e 
      LEFT JOIN taskmanagementsystem.enlaces_categorias ec ON e.categoria_id = ec.id 
      WHERE e.categoria_id = ? 
      ORDER BY e.titulo ASC
    `, [categoriaId]);
    
    // Para cada enlace, obtener sus URLs adicionales
    for (let enlace of enlaces) {
      const [urls] = await db.query(`
        SELECT id, url, titulo, orden
        FROM taskmanagementsystem.enlaces_urls
        WHERE enlace_id = ?
        ORDER BY orden ASC
      `, [enlace.id]);
      
      enlace.urls_adicionales = urls;
    }
    
    return enlaces;
  } catch (error) {
    console.error('Error al obtener enlaces por categoría:', error);
    throw error;
  }
};

module.exports = {
  getAllEnlaces,
  getEnlaceById,
  getEnlacesByLetra,
  getEnlacesConNumeros,
  buscarEnlaces,
  agregarEnlace,
  actualizarEnlace,
  eliminarEnlace,
  getAllCategorias,
  getEnlacesByCategoria
};