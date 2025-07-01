// Rutas para el glosario actualizado con categorías

const express = require('express');
const router = express.Router();
const glosarioController = require('../controllers/glosarioController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener todos los términos del glosario
router.get('/', glosarioController.getAllTerminos);

// Obtener términos que comienzan con números
router.get('/numeros', glosarioController.getTerminosConNumeros);

// Obtener términos por letra inicial
router.get('/letra/:letra', glosarioController.getTerminosByLetra);

// Buscar términos
router.get('/buscar', glosarioController.buscarTerminos);

// Obtener todas las categorías
router.get('/categorias', glosarioController.getAllCategorias);

// Obtener términos por categoría
router.get('/categoria/:categoriaId', glosarioController.getTerminosByCategoria);



// Agregar un nuevo término (protegido por autenticación)
router.post('/', authMiddleware, glosarioController.agregarTermino);

// Actualizar un término (protegido por autenticación)
router.put('/:id', authMiddleware, glosarioController.actualizarTermino);

// Eliminar un término (protegido por autenticación)
router.delete('/:id', authMiddleware, glosarioController.eliminarTermino);

module.exports = router;