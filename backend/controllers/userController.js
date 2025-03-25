// controllers/userController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const UserModel = require('../models/UserModel');

// Obtener perfil del usuario autenticado
const getUserProfile = (req, res) => {
    console.log('Ejecutando getUserProfile');
    const userId = req.user.id;
    const sql = 'SELECT id, nombre, email, rol, estado FROM Usuarios WHERE id = ?';
    
    console.log('Consultando perfil para userId:', userId);
    
    db.query(sql, [userId])
    .then(([results]) => {
        console.log('Resultados de la consulta:', results);
        if (results.length === 0) {
            console.log('Usuario no encontrado');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        console.log('Enviando respuesta al cliente');
        res.json(results[0]);
        console.log('Respuesta enviada');
    })
    .catch((err) => {
        console.error('Error en la consulta:', err);
        return res.status(500).json({ message: 'Error obteniendo perfil de usuario', error: err });
    });
};

// Obtener todos los usuarios con filtros
const getAllUsers = (req, res) => {
    const { rol, estado } = req.query;
    let sql = 'SELECT id, nombre, email, rol, estado FROM Usuarios WHERE 1=1';
    const params = [];

    if (rol) {
        sql += ' AND rol = ?';
        params.push(rol);
    }
    if (estado) {
        sql += ' AND estado = ?';
        params.push(estado);
    }

    db.query(sql, params)
        .then(([results]) => {
            res.json(results);
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Error obteniendo usuarios', error: err });
        });
};

// Obtener un usuario por ID
const getUserById = (req, res) => {
    const userId = req.params.id;
    const sql = 'SELECT id, nombre, email, rol, estado FROM Usuarios WHERE id = ?';
    
    db.query(sql, [userId])
        .then(([results]) => {
            if (results.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            res.json(results[0]);
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Error obteniendo usuario', error: err });
        });
};

// Actualizar un usuario
const updateUser = (req, res) => {
    const userId = req.params.id;
    const { nombre, email, rol, estado } = req.body;
    
    const sql = 'UPDATE Usuarios SET nombre = ?, email = ?, rol = ?, estado = ? WHERE id = ?';
    
    db.query(sql, [nombre, email, rol, estado, userId])
        .then(() => {
            res.json({ message: 'Usuario actualizado correctamente' });
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Error actualizando usuario', error: err });
        });
};

// Eliminar usuario
const deleteUser = (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM Usuarios WHERE id = ?';
    
    db.query(sql, [userId])
        .then(() => {
            res.json({ message: 'Usuario eliminado correctamente' });
        })
        .catch((err) => {
            return res.status(500).json({ message: 'Error eliminando usuario', error: err });
        });
};

// Actualizar perfil del usuario autenticado
const updateUserProfile = (req, res) => {
    console.log('Ejecutando updateUserProfile');
    const userId = req.user.id;
    const { nombre, email } = req.body;
    
    console.log('Actualizando usuario con ID:', userId);
    console.log('Nuevos datos:', { nombre, email });
    
    const sql = 'UPDATE Usuarios SET nombre = ?, email = ? WHERE id = ?';
    
    db.query(sql, [nombre, email, userId])
        .then((result) => {
            console.log('Resultado de la actualización:', result);
            res.json({ message: 'Perfil actualizado correctamente' });
        })
        .catch((err) => {
            console.error('Error actualizando perfil:', err);
            return res.status(500).json({ message: 'Error actualizando perfil', error: err });
        });
};

// Obtener permisos por ID de usuario
const getUserPermissions = (req, res) => {
    const userId = req.params.id;
    UserModel.getPermisosByUserId(userId, (err, permisos) => {
        if (err) return res.status(500).json({ message: 'Error al obtener permisos' });
        res.json({ permisos });
    });
};

// Obtener permisos del usuario autenticado
const getMyPermissions = (req, res) => {
    const userId = req.user.id;
    UserModel.getPermisosByUserId(userId, (err, permisos) => {
        if (err) return res.status(500).json({ message: 'Error al obtener permisos' });
        res.json({ permisos });
    });
};

module.exports = {
    getUserProfile,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserProfile,
    getUserPermissions,
    getMyPermissions
};
