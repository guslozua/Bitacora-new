// Controlador para gestionar las operaciones de enlaces

const EnlacesModel = require('../models/EnlacesModel');

// Obtener todos los enlaces
const getAllEnlaces = async (req, res) => {
  try {
    const enlaces = await EnlacesModel.getAllEnlaces();
    res.json(enlaces);
  } catch (error) {
    console.error('Error en getAllEnlaces:', error);
    res.status(500).json({ message: 'Error al obtener enlaces' });
  }
};

// Obtener un enlace específico por ID
const getEnlaceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const enlace = await EnlacesModel.getEnlaceById(id);
    
    if (!enlace) {
      return res.status(404).json({ message: 'Enlace no encontrado' });
    }
    
    res.json(enlace);
  } catch (error) {
    console.error('Error en getEnlaceById:', error);
    res.status(500).json({ message: 'Error al obtener el enlace' });
  }
};

// Obtener enlaces por letra inicial
const getEnlacesByLetra = async (req, res) => {
  try {
    const { letra } = req.params;
    if (!letra || letra.length !== 1) {
      return res.status(400).json({ message: 'Se requiere una letra válida' });
    }
    
    const enlaces = await EnlacesModel.getEnlacesByLetra(letra.toUpperCase());
    res.json(enlaces);
  } catch (error) {
    console.error('Error en getEnlacesByLetra:', error);
    res.status(500).json({ message: 'Error al obtener enlaces por letra' });
  }
};

// Obtener enlaces que comienzan con números
const getEnlacesConNumeros = async (req, res) => {
  try {
    const enlaces = await EnlacesModel.getEnlacesConNumeros();
    res.json(enlaces);
  } catch (error) {
    console.error('Error en getEnlacesConNumeros:', error);
    res.status(500).json({ message: 'Error al obtener enlaces con números' });
  }
};

// Buscar enlaces
const buscarEnlaces = async (req, res) => {
  try {
    const { busqueda } = req.query;
    if (!busqueda) {
      return res.status(400).json({ message: 'Se requiere un término de búsqueda' });
    }
    
    const enlaces = await EnlacesModel.buscarEnlaces(busqueda);
    res.json(enlaces);
  } catch (error) {
    console.error('Error en buscarEnlaces:', error);
    res.status(500).json({ message: 'Error al buscar enlaces' });
  }
};

// Función para validar URL - Versión más permisiva
const isValidUrl = (url) => {
  // Si la URL está vacía, no es válida
  if (!url || url.trim() === '') return false;
  
  try {
    // Si empieza con http:// o https://, asumimos que es válida
    if (url.match(/^https?:\/\//i)) {
      return true;
    }
    
    // Para URLs sin protocolo, verificamos que tenga al menos un carácter antes de /
    if (url.includes('/')) {
      const parts = url.split('/');
      return parts[0].trim().length > 0;
    }
    
    // Para URLs más simples (sólo dominio)
    return url.trim().length > 0;
  } catch (error) {
    console.error('Error validando URL:', error);
    return false;
  }
};

// Agregar un nuevo enlace
const agregarEnlace = async (req, res) => {
  try {
    const { titulo, url, descripcion, categoria_id, creado_por, urls_adicionales } = req.body;
    
    // Validar campos obligatorios
    if (!titulo || !url) {
      return res.status(400).json({ message: 'El título y la URL son obligatorios' });
    }
    
    // Validar formato de URL con la nueva función más permisiva
    if (!isValidUrl(url)) {
      return res.status(400).json({ message: 'Formato de URL inválido' });
    }
    
    // Validar URLs adicionales si existen
    if (urls_adicionales && urls_adicionales.length > 0) {
      for (const item of urls_adicionales) {
        if (item.url && !isValidUrl(item.url)) {
          return res.status(400).json({ 
            message: `Formato de URL adicional inválido: ${item.url}` 
          });
        }
      }
    }
    
    const id = await EnlacesModel.agregarEnlace(
      titulo, 
      url, 
      descripcion, 
      categoria_id, 
      creado_por, 
      urls_adicionales
    );
    
    res.status(201).json({ 
      message: 'Enlace agregado correctamente', 
      id 
    });
  } catch (error) {
    console.error('Error en agregarEnlace:', error);
    res.status(500).json({ message: 'Error al agregar enlace' });
  }
};

// Actualizar un enlace
const actualizarEnlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, url, descripcion, categoria_id, urls_adicionales } = req.body;
    
    // Validar campos obligatorios
    if (!titulo || !url) {
      return res.status(400).json({ message: 'El título y la URL son obligatorios' });
    }
    
    // Validar formato de URL con la nueva función más permisiva
    if (!isValidUrl(url)) {
      return res.status(400).json({ message: 'Formato de URL inválido' });
    }
    
    // Validar URLs adicionales si existen
    if (urls_adicionales && urls_adicionales.length > 0) {
      for (const item of urls_adicionales) {
        if (item.url && !isValidUrl(item.url)) {
          return res.status(400).json({ 
            message: `Formato de URL adicional inválido: ${item.url}` 
          });
        }
      }
    }
    
    const success = await EnlacesModel.actualizarEnlace(
      id, 
      titulo, 
      url, 
      descripcion, 
      categoria_id,
      urls_adicionales
    );
    
    if (success) {
      res.json({ message: 'Enlace actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Enlace no encontrado' });
    }
  } catch (error) {
    console.error('Error en actualizarEnlace:', error);
    res.status(500).json({ message: 'Error al actualizar enlace' });
  }
};

// Eliminar un enlace
const eliminarEnlace = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await EnlacesModel.eliminarEnlace(id);
    
    if (success) {
      res.json({ message: 'Enlace eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Enlace no encontrado' });
    }
  } catch (error) {
    console.error('Error en eliminarEnlace:', error);
    res.status(500).json({ message: 'Error al eliminar enlace' });
  }
};

// Obtener todas las categorías
const getAllCategorias = async (req, res) => {
  try {
    const categorias = await EnlacesModel.getAllCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error en getAllCategorias:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

// Obtener enlaces por categoría
const getEnlacesByCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    
    const enlaces = await EnlacesModel.getEnlacesByCategoria(categoriaId);
    res.json(enlaces);
  } catch (error) {
    console.error('Error en getEnlacesByCategoria:', error);
    res.status(500).json({ message: 'Error al obtener enlaces por categoría' });
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