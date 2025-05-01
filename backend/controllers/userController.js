// controllers/userController.js - actualización completa
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const UserModel = require('../models/UserModel');

// Obtener perfil del usuario autenticado
const getUserProfile = async (req, res) => {
    console.log('Ejecutando getUserProfile');
    const userId = req.user.id;
    
    try {
        // Consulta actualizada para usar la estructura de roles relacionales
        const sql = `
            SELECT u.id, u.nombre, u.email, u.estado, u.imagen_perfil, u.ultimo_acceso,
                   GROUP_CONCAT(DISTINCT r.nombre) as roles
            FROM Usuarios u
            LEFT JOIN usuario_rol ur ON u.id = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id
            WHERE u.id = ?
            GROUP BY u.id
        `;
        
        console.log('Consultando perfil para userId:', userId);
        
        const [results] = await db.query(sql, [userId]);
        console.log('Resultados de la consulta:', results);
        
        if (results.length === 0) {
            console.log('Usuario no encontrado');
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        // Convertir roles de string a array
        const user = results[0];
        user.roles = user.roles ? user.roles.split(',') : [];
        
        // No incluir la contraseña en la respuesta
        delete user.password;
        
        console.log('Enviando respuesta al cliente');
        res.json({ 
            success: true, 
            data: user 
        });
        console.log('Respuesta enviada');
    } catch (err) {
        console.error('Error en la consulta:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error obteniendo perfil de usuario', 
            error: err 
        });
    }
};

// Obtener todos los usuarios con filtros
const getAllUsers = async (req, res) => {
    try {
        const { rol, estado } = req.query;
        
        // Consulta base con JOIN para obtener roles
        let sql = `
            SELECT u.id, u.nombre, u.email, u.estado, u.ultimo_acceso,
                   GROUP_CONCAT(DISTINCT r.nombre) as roles
            FROM Usuarios u
            LEFT JOIN usuario_rol ur ON u.id = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Aplicar filtro por rol si se proporciona
        if (rol) {
            sql += ` AND r.nombre = ?`;
            params.push(rol);
        }
        
        // Aplicar filtro por estado si se proporciona
        if (estado) {
            sql += ` AND u.estado = ?`;
            params.push(estado);
        }
        
        // Agrupar por ID de usuario
        sql += ` GROUP BY u.id`;
        
        const [results] = await db.query(sql, params);
        
        // Convertir roles de cadena a array para cada usuario
        const users = results.map(user => ({
            ...user,
            roles: user.roles ? user.roles.split(',') : []
        }));
        
        res.json({
            success: true,
            data: users
        });
    } catch (err) {
        console.error('Error obteniendo usuarios:', err);
        return res.status(500).json({ 
            message: 'Error obteniendo usuarios', 
            error: err 
        });
    }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
    const userId = req.params.id;
    
    try {
        // Consulta actualizada para usar la estructura de roles relacionales
        const sql = `
            SELECT u.id, u.nombre, u.email, u.estado, u.imagen_perfil, u.ultimo_acceso,
                   GROUP_CONCAT(DISTINCT r.nombre) as roles
            FROM Usuarios u
            LEFT JOIN usuario_rol ur ON u.id = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id
            WHERE u.id = ?
            GROUP BY u.id
        `;
        
        const [results] = await db.query(sql, [userId]);
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        // Convertir roles de string a array
        const user = results[0];
        user.roles = user.roles ? user.roles.split(',') : [];
        
        // No incluir la contraseña en la respuesta
        delete user.password;
        
        res.json({ 
            success: true, 
            data: user 
        });
    } catch (err) {
        console.error('Error obteniendo usuario por ID:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error obteniendo usuario', 
            error: err 
        });
    }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { nombre, email, roles, estado } = req.body;
    
    try {
        // Iniciar transacción para mantener la integridad de los datos
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // 1. Actualizar datos básicos del usuario
            const updateUserSql = 'UPDATE Usuarios SET nombre = ?, email = ?, estado = ? WHERE id = ?';
            await connection.query(updateUserSql, [nombre, email, estado, userId]);
            
            // 2. Si se proporcionaron roles, actualizarlos
            if (roles && Array.isArray(roles) && roles.length > 0) {
                // Eliminar roles actuales del usuario
                await connection.query('DELETE FROM usuario_rol WHERE id_usuario = ?', [userId]);
                
                // Obtener IDs de los roles proporcionados
                const [rolesData] = await connection.query(
                    'SELECT id, nombre FROM Roles WHERE nombre IN (?)',
                    [roles]
                );
                
                // Asignar nuevos roles
                for (const role of rolesData) {
                    await connection.query(
                        'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
                        [userId, role.id]
                    );
                }
            }
            
            // Confirmar la transacción
            await connection.commit();
            connection.release();
            
            res.json({ 
                success: true, 
                message: 'Usuario actualizado correctamente' 
            });
        } catch (error) {
            // Revertir cambios en caso de error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('Error actualizando usuario:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error actualizando usuario', 
            error: err 
        });
    }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
    const userId = req.params.id;
    
    try {
        // Iniciar transacción para mantener la integridad de los datos
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Eliminar relaciones con roles
            await connection.query('DELETE FROM usuario_rol WHERE id_usuario = ?', [userId]);
            
            // Eliminar el usuario
            await connection.query('DELETE FROM Usuarios WHERE id = ?', [userId]);
            
            // Confirmar la transacción
            await connection.commit();
            connection.release();
            
            res.json({ 
                success: true, 
                message: 'Usuario eliminado correctamente' 
            });
        } catch (error) {
            // Revertir cambios en caso de error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error eliminando usuario', 
            error: err 
        });
    }
};

// Actualizar perfil del usuario autenticado
const updateUserProfile = async (req, res) => {
    console.log('Ejecutando updateUserProfile');
    const userId = req.user.id;
    const { nombre, email } = req.body;
    
    console.log('Actualizando usuario con ID:', userId);
    console.log('Nuevos datos:', { nombre, email });
    
    try {
        const sql = 'UPDATE Usuarios SET nombre = ?, email = ? WHERE id = ?';
        
        await db.query(sql, [nombre, email, userId]);
        
        // Refrescar perfil después de la actualización
        const [updatedUser] = await db.query(`
            SELECT u.id, u.nombre, u.email, u.estado, u.imagen_perfil, u.ultimo_acceso,
                   GROUP_CONCAT(DISTINCT r.nombre) as roles
            FROM Usuarios u
            LEFT JOIN usuario_rol ur ON u.id = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id
            WHERE u.id = ?
            GROUP BY u.id
        `, [userId]);
        
        if (updatedUser.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error al actualizar: Usuario no encontrado' 
            });
        }
        
        // Convertir roles a array
        updatedUser[0].roles = updatedUser[0].roles ? updatedUser[0].roles.split(',') : [];
        
        // Eliminar contraseña
        delete updatedUser[0].password;
        
        res.json({ 
            success: true, 
            message: 'Perfil actualizado correctamente',
            data: updatedUser[0]
        });
    } catch (err) {
        console.error('Error actualizando perfil:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error actualizando perfil', 
            error: err 
        });
    }
};

// Obtener permisos por ID de usuario
const getUserPermissions = (req, res) => {
    const userId = req.params.id;
    UserModel.getPermisosByUserId(userId, (err, permisos) => {
        if (err) return res.status(500).json({ message: 'Error al obtener permisos' });
        res.json({ 
            success: true,
            permisos 
        });
    });
};

// Obtener permisos del usuario autenticado
const getMyPermissions = (req, res) => {
    const userId = req.user.id;
    UserModel.getPermisosByUserId(userId, (err, permisos) => {
        if (err) return res.status(500).json({ message: 'Error al obtener permisos' });
        res.json({ 
            success: true,
            permisos 
        });
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