// controllers/permisoController.js
const PermisoModel = require('../models/permisoModel');

exports.getAllPermisos = (req, res) => {
  PermisoModel.getAllPermisos((err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener permisos' });
    res.json(results);
  });
};

exports.createPermiso = (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre de permiso requerido' });

  PermisoModel.createPermiso(nombre, (err, result) => {
    if (err) return res.status(500).json({ message: 'Error al crear permiso' });
    res.json({ message: 'Permiso creado', id: result.insertId });
  });
};

exports.asignarPermisoARol = (req, res) => {
  const { id_rol, id_permiso } = req.body;
  if (!id_rol || !id_permiso) return res.status(400).json({ message: 'Datos incompletos' });

  PermisoModel.asignarPermisoARol(id_rol, id_permiso, (err) => {
    if (err) return res.status(500).json({ message: 'Error al asignar permiso' });
    res.json({ message: 'Permiso asignado al rol' });
  });
};

exports.getPermisosPorRol = (req, res) => {
  const { id } = req.params;
  PermisoModel.getPermisosPorRol(id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error al obtener permisos del rol' });
    res.json(results);
  });
};
