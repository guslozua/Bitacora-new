// src/controllers/roleController.js
const db = require('../config/db');

// Obtener todos los roles
const getAllRoles = (req, res) => {
    const sql = 'SELECT * FROM Roles';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error obteniendo roles' });
        res.json(results);
    });
};

// Crear un nuevo rol
const createRole = (req, res) => {
    const { nombre } = req.body;
    const sql = 'INSERT INTO Roles (nombre) VALUES (?)';
    db.query(sql, [nombre], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error creando rol' });
        res.json({ message: 'Rol creado correctamente', roleId: result.insertId });
    });
};

// Asignar un rol a un usuario
const assignRoleToUser = (req, res) => {
    const { userId, roleId } = req.body;
    const sql = 'UPDATE Usuarios SET rol = ? WHERE id = ?';
    db.query(sql, [roleId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error asignando rol' });
        res.json({ message: 'Rol asignado correctamente' });
    });
};

module.exports = { getAllRoles, createRole, assignRoleToUser };
