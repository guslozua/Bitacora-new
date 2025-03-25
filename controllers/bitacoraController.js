const BitacoraModel = require('../models/BitacoraModel');

// Obtener bitácora completa o filtrada
const obtenerBitacora = async (req, res) => {
    const filtros = {
        id_usuario: req.query.id_usuario,
        id_proyecto: req.query.id_proyecto,
        id_tarea: req.query.id_tarea,
        id_subtarea: req.query.id_subtarea
    };

    try {
        const resultados = await BitacoraModel.obtenerBitacora(filtros);
        res.json(resultados);
    } catch (err) {
        console.error('Error al obtener bitácora:', err);
        return res.status(500).json({ message: 'Error al obtener bitácora' });
    }
};

// También podemos agregar un método para registrar eventos
const registrarEvento = async (req, res) => {
    const {
        tipo_evento,
        descripcion,
        id_usuario,
        id_proyecto,
        id_tarea,
        id_subtarea
    } = req.body;

    try {
        const resultado = await BitacoraModel.registrarEvento(
            tipo_evento,
            descripcion,
            id_usuario,
            id_proyecto,
            id_tarea,
            id_subtarea
        );
        
        res.status(201).json({
            message: 'Evento registrado con éxito',
            id: resultado.insertId
        });
    } catch (err) {
        console.error('Error al registrar evento:', err);
        return res.status(500).json({ message: 'Error al registrar evento en la bitácora' });
    }
};

module.exports = {
    obtenerBitacora,
    registrarEvento
};