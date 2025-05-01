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

// Asignar un rol a un usuario (actualizado para usar tabla usuario_rol)
const assignRoleToUser = (req, res) => {
    const { userId, roleId } = req.body;
    
    // Validar datos
    if (!userId || !roleId) {
        return res.status(400).json({ message: 'Faltan datos requeridos (userId, roleId)' });
    }
    
    // Usar transacción para mantener integridad
    db.getConnection().then(conn => {
        conn.beginTransaction().then(() => {
            // Verificar si ya existe esta asignación
            const checkSql = 'SELECT * FROM usuario_rol WHERE id_usuario = ? AND id_rol = ?';
            conn.query(checkSql, [userId, roleId])
                .then(([results]) => {
                    if (results.length > 0) {
                        conn.release();
                        return res.status(409).json({ message: 'El usuario ya tiene este rol asignado' });
                    }
                    
                    // Insertar la nueva asignación
                    const insertSql = 'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)';
                    return conn.query(insertSql, [userId, roleId]);
                })
                .then(() => {
                    return conn.commit();
                })
                .then(() => {
                    conn.release();
                    res.json({ message: 'Rol asignado correctamente' });
                })
                .catch(err => {
                    console.error('Error en la transacción:', err);
                    return conn.rollback()
                        .then(() => {
                            conn.release();
                            res.status(500).json({ message: 'Error asignando rol', error: err.message });
                        });
                });
        }).catch(err => {
            console.error('Error iniciando transacción:', err);
            conn.release();
            res.status(500).json({ message: 'Error en el servidor', error: err.message });
        });
    }).catch(err => {
        console.error('Error obteniendo conexión:', err);
        res.status(500).json({ message: 'Error en el servidor', error: err.message });
    });
};

// Nuevo método para quitar un rol a un usuario
const removeRoleFromUser = (req, res) => {
    const { userId, roleId } = req.body;
    
    // Validar datos
    if (!userId || !roleId) {
        return res.status(400).json({ message: 'Faltan datos requeridos (userId, roleId)' });
    }
    
    const sql = 'DELETE FROM usuario_rol WHERE id_usuario = ? AND id_rol = ?';
    db.query(sql, [userId, roleId])
        .then(() => {
            res.json({ message: 'Rol eliminado correctamente del usuario' });
        })
        .catch(err => {
            console.error('Error eliminando rol:', err);
            res.status(500).json({ message: 'Error eliminando rol', error: err.message });
        });
};

// Nuevo método para obtener roles de un usuario
const getUserRoles = (req, res) => {
    const userId = req.params.userId;
    
    const sql = `
        SELECT r.* 
        FROM Roles r
        JOIN usuario_rol ur ON r.id = ur.id_rol
        WHERE ur.id_usuario = ?
    `;
    
    db.query(sql, [userId])
        .then(([results]) => {
            res.json(results);
        })
        .catch(err => {
            console.error('Error obteniendo roles del usuario:', err);
            res.status(500).json({ message: 'Error obteniendo roles', error: err.message });
        });
};

module.exports = { 
    getAllRoles, 
    createRole, 
    assignRoleToUser,
    removeRoleFromUser,
    getUserRoles
};