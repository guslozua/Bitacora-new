// Controlador para gestionar las operaciones del glosario actualizado con categorías

const GlosarioModel = require('../models/GlosarioModel');

// Obtener todos los términos del glosario
const getAllTerminos = async (req, res) => {
  try {
    const terminos = await GlosarioModel.getAllTerminos();
    res.json(terminos);
  } catch (error) {
    console.error('Error en getAllTerminos:', error);
    res.status(500).json({ message: 'Error al obtener términos del glosario' });
  }
};

// Obtener un término específico por ID
const getTerminoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const termino = await GlosarioModel.getTerminoById(id);
    
    if (!termino) {
      return res.status(404).json({ message: 'Término no encontrado' });
    }
    
    res.json(termino);
  } catch (error) {
    console.error('Error en getTerminoById:', error);
    res.status(500).json({ message: 'Error al obtener el término' });
  }
};

// Obtener términos por letra inicial
const getTerminosByLetra = async (req, res) => {
  try {
    const { letra } = req.params;
    if (!letra || letra.length !== 1) {
      return res.status(400).json({ message: 'Se requiere una letra válida' });
    }
    
    const terminos = await GlosarioModel.getTerminosByLetra(letra.toUpperCase());
    res.json(terminos);
  } catch (error) {
    console.error('Error en getTerminosByLetra:', error);
    res.status(500).json({ message: 'Error al obtener términos por letra' });
  }
};

// Obtener términos que comienzan con números
const getTerminosConNumeros = async (req, res) => {
  try {
    const terminos = await GlosarioModel.getTerminosConNumeros();
    res.json(terminos);
  } catch (error) {
    console.error('Error en getTerminosConNumeros:', error);
    res.status(500).json({ message: 'Error al obtener términos con números' });
  }
};

// Buscar términos
const buscarTerminos = async (req, res) => {
  try {
    const { busqueda } = req.query;
    if (!busqueda) {
      return res.status(400).json({ message: 'Se requiere un término de búsqueda' });
    }
    
    const terminos = await GlosarioModel.buscarTerminos(busqueda);
    res.json(terminos);
  } catch (error) {
    console.error('Error en buscarTerminos:', error);
    res.status(500).json({ message: 'Error al buscar términos' });
  }
};

// Agregar un nuevo término
const agregarTermino = async (req, res) => {
  try {
    const { termino, definicion, categoria_id, creado_por } = req.body;
    
    // Validar campos obligatorios
    if (!termino || !definicion) {
      return res.status(400).json({ message: 'El término y la definición son obligatorios' });
    }
    
    const id = await GlosarioModel.agregarTermino(termino, definicion, categoria_id, creado_por);
    
    res.status(201).json({ 
      message: 'Término agregado correctamente', 
      id 
    });
  } catch (error) {
    console.error('Error en agregarTermino:', error);
    res.status(500).json({ message: 'Error al agregar término' });
  }
};

// Actualizar un término
const actualizarTermino = async (req, res) => {
  try {
    const { id } = req.params;
    const { termino, definicion, categoria_id } = req.body;
    
    // Validar campos obligatorios
    if (!termino || !definicion) {
      return res.status(400).json({ message: 'El término y la definición son obligatorios' });
    }
    
    const success = await GlosarioModel.actualizarTermino(id, termino, definicion, categoria_id);
    
    if (success) {
      res.json({ message: 'Término actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Término no encontrado' });
    }
  } catch (error) {
    console.error('Error en actualizarTermino:', error);
    res.status(500).json({ message: 'Error al actualizar término' });
  }
};

// Eliminar un término
const eliminarTermino = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await GlosarioModel.eliminarTermino(id);
    
    if (success) {
      res.json({ message: 'Término eliminado correctamente' });
    } else {
      res.status(404).json({ message: 'Término no encontrado' });
    }
  } catch (error) {
    console.error('Error en eliminarTermino:', error);
    res.status(500).json({ message: 'Error al eliminar término' });
  }
};

// Obtener todas las categorías
const getAllCategorias = async (req, res) => {
  try {
    const categorias = await GlosarioModel.getAllCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error en getAllCategorias:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

// Obtener términos por categoría
const getTerminosByCategoria = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    
    const terminos = await GlosarioModel.getTerminosByCategoria(categoriaId);
    res.json(terminos);
  } catch (error) {
    console.error('Error en getTerminosByCategoria:', error);
    res.status(500).json({ message: 'Error al obtener términos por categoría' });
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
  getTerminosByCategoria
};