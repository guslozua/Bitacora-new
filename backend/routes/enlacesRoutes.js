// Rutas para los enlaces

const express = require('express');
const router = express.Router();
const enlacesController = require('../controllers/enlacesController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener todos los enlaces
router.get('/', enlacesController.getAllEnlaces);

// Obtener enlaces que comienzan con números
router.get('/numeros', enlacesController.getEnlacesConNumeros);

// Obtener enlaces por letra inicial
router.get('/letra/:letra', enlacesController.getEnlacesByLetra);

// Buscar enlaces
router.get('/buscar', enlacesController.buscarEnlaces);

// Obtener todas las categorías
router.get('/categorias', enlacesController.getAllCategorias);

// Obtener enlaces por categoría
router.get('/categoria/:categoriaId', enlacesController.getEnlacesByCategoria);

// Obtener un enlace específico
router.get('/:id', enlacesController.getEnlaceById);

// Agregar un nuevo enlace (protegido por autenticación)
router.post('/', authMiddleware, enlacesController.agregarEnlace);

// Actualizar un enlace (protegido por autenticación)
router.put('/:id', authMiddleware, enlacesController.actualizarEnlace);

// Eliminar un enlace (protegido por autenticación)
router.delete('/:id', authMiddleware, enlacesController.eliminarEnlace);

module.exports = router;