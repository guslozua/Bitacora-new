// controllers/userController.js - VERSIÓN CORREGIDA COMPLETA
const { query } = require('../config/db'); // Usar la función query corregida
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

// Obtener perfil del usuario autenticado
const getUserProfile = async (req, res) => {
    console.log('Ejecutando getUserProfile');
    const userId = req.user.id;
    
    try {
        // Consulta actualizada para usar la estructura de roles relacionales
        const sql = `
            SELECT u.id, u.nombre, u.email, u.estado, u.imagen_perfil, u.ultimo_acceso,
                   STUFF((
                       SELECT ',' + r.nombre
                       FROM taskmanagementsystem.usuario_rol ur2
                       LEFT JOIN taskmanagementsystem.roles r ON ur2.id_rol = r.id
                       WHERE ur2.id_usuario = u.id
                       FOR XML PATH('')
                   ), 1, 1, '') as roles
            FROM taskmanagementsystem.usuarios u
            WHERE u.id = ?
        `;
        
        console.log('Consultando perfil para userId:', userId);
        
        const results = await query(sql, [userId]);
        console.log('Resultados de la consulta:', results[0]);
        
        if (!results[0] || results[0].length === 0) {
            console.log('Usuario no encontrado');
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        // Convertir roles de string a array
        const user = results[0][0];
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
            error: err.message 
        });
    }
};

// Obtener todos los usuarios con filtros y paginación
const getAllUsers = async (req, res) => {
    try {
        const { nombre, email, rol, estado, page = 1, limit } = req.query;
        
        // Manejar el caso cuando limit = 'all'
        let shouldPaginate = true;
        let limitNum = 10;
        let offset = 0;
        
        if (limit === 'all' || limit === undefined) {
            shouldPaginate = false;
        } else {
            limitNum = parseInt(limit) || 10;
            offset = (parseInt(page) - 1) * limitNum;
        }
        
        // Consulta base con JOIN para obtener roles
        let sqlQuery = `
            SELECT u.id, u.nombre, u.email, u.estado, u.ultimo_acceso,
                   STUFF((
                       SELECT ',' + r.nombre
                       FROM taskmanagementsystem.usuario_rol ur2
                       LEFT JOIN taskmanagementsystem.roles r ON ur2.id_rol = r.id
                       WHERE ur2.id_usuario = u.id
                       FOR XML PATH('')
                   ), 1, 1, '') as roles
            FROM taskmanagementsystem.usuarios u
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        // Aplicar filtros
        if (nombre) {
            sqlQuery += ` AND u.nombre LIKE ?`;
            queryParams.push(`%${nombre}%`);
        }
        
        if (email) {
            sqlQuery += ` AND u.email LIKE ?`;
            queryParams.push(`%${email}%`);
        }
        
        if (rol) {
            sqlQuery = sqlQuery.replace(
                'FROM taskmanagementsystem.usuarios u',
                `FROM taskmanagementsystem.usuarios u
                 LEFT JOIN taskmanagementsystem.usuario_rol ur_filter ON u.id = ur_filter.id_usuario
                 LEFT JOIN taskmanagementsystem.roles r_filter ON ur_filter.id_rol = r_filter.id`
            );
            
            const isNumeric = !isNaN(rol) && !isNaN(parseFloat(rol));
            
            if (isNumeric) {
                sqlQuery += ` AND r_filter.id = ?`;
                queryParams.push(parseInt(rol));
            } else {
                sqlQuery += ` AND r_filter.nombre = ?`;
                queryParams.push(rol);
            }
        }
        
        if (estado) {
            sqlQuery += ` AND u.estado = ?`;
            queryParams.push(estado);
        }
        
        sqlQuery += ` ORDER BY u.nombre ASC`;
        
        if (shouldPaginate) {
            sqlQuery += ` OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
            queryParams.push(offset, limitNum);
        }
        
        console.log('Ejecutando consulta de usuarios:', sqlQuery);
        console.log('Parámetros:', queryParams);
        
        // Ejecutar consulta principal
        const results = await query(sqlQuery, queryParams);
        const users_data = results[0];
        
        console.log('✅ Resultados:', users_data.length, 'usuarios encontrados');
        
        // Consulta para el total de registros
        let countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM taskmanagementsystem.usuarios u
        `;
        
        if (rol) {
            countQuery += `
                LEFT JOIN taskmanagementsystem.usuario_rol ur ON u.id = ur.id_usuario
                LEFT JOIN taskmanagementsystem.roles r ON ur.id_rol = r.id
            `;
        }
        
        countQuery += ` WHERE 1=1`;
        
        const countParams = [];
        if (nombre) {
            countQuery += ` AND u.nombre LIKE ?`;
            countParams.push(`%${nombre}%`);
        }
        if (email) {
            countQuery += ` AND u.email LIKE ?`;
            countParams.push(`%${email}%`);
        }
        if (rol) {
            const isNumeric = !isNaN(rol) && !isNaN(parseFloat(rol));
            if (isNumeric) {
                countQuery += ` AND r.id = ?`;
                countParams.push(parseInt(rol));
            } else {
                countQuery += ` AND r.nombre = ?`;
                countParams.push(rol);
            }
        }
        if (estado) {
            countQuery += ` AND u.estado = ?`;
            countParams.push(estado);
        }
        
        const countResults = await query(countQuery, countParams);
        const totalUsers = countResults[0][0].total;
        
        // Convertir roles de cadena a array
        const users = users_data.map(user => ({
            ...user,
            roles: user.roles ? user.roles.split(',') : []
        }));
        
        const response = {
            success: true,
            data: users,
            count: users.length,
            pagination: {
                total: totalUsers,
                page: shouldPaginate ? parseInt(page) : 1,
                limit: shouldPaginate ? limitNum : totalUsers,
                totalPages: shouldPaginate ? Math.ceil(totalUsers / limitNum) : 1,
                hasMore: shouldPaginate ? (parseInt(page) * limitNum) < totalUsers : false
            }
        };
        
        res.json(response);
    } catch (err) {
        console.error('❌ Error obteniendo usuarios:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error obteniendo usuarios', 
            error: err.message
        });
    }
};

// Crear nuevo usuario
const createUser = async (req, res) => {
    const { nombre, email, password, roles, estado } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos requeridos (nombre, email, password)'
        });
    }
    
    try {
        // Verificar si el email ya está registrado
        const existingUserResult = await query(
            'SELECT id FROM taskmanagementsystem.usuarios WHERE email = ?',
            [email]
        );
        
        if (existingUserResult[0] && existingUserResult[0].length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }
        
        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insertar el usuario
        await query(
            'INSERT INTO taskmanagementsystem.usuarios (nombre, email, password, estado) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, estado || 'activo']
        );
        
        // Obtener el ID del usuario insertado
        const userIdResult = await query(
            'SELECT TOP 1 id FROM taskmanagementsystem.usuarios WHERE email = ? ORDER BY id DESC',
            [email]
        );
        const userId = userIdResult[0][0].id;
        
        // Asignar roles si se proporcionaron
        if (roles && Array.isArray(roles) && roles.length > 0) {
            // Obtener IDs de los roles
            const placeholders = roles.map(() => '?').join(',');
            const rolesResult = await query(
                `SELECT id, nombre FROM taskmanagementsystem.roles WHERE nombre IN (${placeholders})`,
                roles
            );
            
            // Asignar roles al usuario
            if (rolesResult[0] && rolesResult[0].length > 0) {
                for (const role of rolesResult[0]) {
                    await query(
                        'INSERT INTO taskmanagementsystem.usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
                        [userId, role.id]
                    );
                }
            }
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Usuario creado correctamente',
            data: { id: userId, nombre, email, estado: estado || 'activo' }
        });
    } catch (err) {
        console.error('Error creando usuario:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error creando usuario', 
            error: err.message 
        });
    }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
    const userId = req.params.id;
    
    try {
        const sql = `
            SELECT u.id, u.nombre, u.email, u.estado, u.imagen_perfil, u.ultimo_acceso,
                   STUFF((
                       SELECT ',' + r.nombre
                       FROM taskmanagementsystem.usuario_rol ur2
                       LEFT JOIN taskmanagementsystem.roles r ON ur2.id_rol = r.id
                       WHERE ur2.id_usuario = u.id
                       FOR XML PATH('')
                   ), 1, 1, '') as roles
            FROM taskmanagementsystem.usuarios u
            WHERE u.id = ?
        `;
        
        const results = await query(sql, [userId]);
        
        if (!results[0] || results[0].length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        const user = results[0][0];
        user.roles = user.roles ? user.roles.split(',') : [];
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
            error: err.message 
        });
    }
};

// Actualizar usuario
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { nombre, email, password, roles, estado } = req.body;
    
    try {
        // Actualizar datos básicos del usuario
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            await query(
                'UPDATE taskmanagementsystem.usuarios SET nombre = ?, email = ?, estado = ?, password = ? WHERE id = ?',
                [nombre, email, estado, hashedPassword, userId]
            );
        } else {
            await query(
                'UPDATE taskmanagementsystem.usuarios SET nombre = ?, email = ?, estado = ? WHERE id = ?',
                [nombre, email, estado, userId]
            );
        }
        
        // Actualizar roles si se proporcionaron
        if (roles && Array.isArray(roles) && roles.length > 0) {
            // Eliminar roles actuales
            await query('DELETE FROM taskmanagementsystem.usuario_rol WHERE id_usuario = ?', [userId]);
            
            // Obtener IDs de los nuevos roles
            const placeholders = roles.map(() => '?').join(',');
            const rolesResult = await query(
                `SELECT id, nombre FROM taskmanagementsystem.roles WHERE nombre IN (${placeholders})`,
                roles
            );
            
            // Asignar nuevos roles
            if (rolesResult[0] && rolesResult[0].length > 0) {
                for (const role of rolesResult[0]) {
                    await query(
                        'INSERT INTO taskmanagementsystem.usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
                        [userId, role.id]
                    );
                }
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Usuario actualizado correctamente' 
        });
    } catch (err) {
        console.error('Error actualizando usuario:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error actualizando usuario', 
            error: err.message 
        });
    }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
    const userId = req.params.id;
    
    try {
        // Eliminar relaciones con roles primero
        await query('DELETE FROM taskmanagementsystem.usuario_rol WHERE id_usuario = ?', [userId]);
        
        // Eliminar el usuario
        await query('DELETE FROM taskmanagementsystem.usuarios WHERE id = ?', [userId]);
        
        res.json({ 
            success: true, 
            message: 'Usuario eliminado correctamente' 
        });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error eliminando usuario', 
            error: err.message 
        });
    }
};

// Actualizar perfil del usuario autenticado
const updateUserProfile = async (req, res) => {
    const userId = req.user.id;
    const { nombre, email } = req.body;
    
    try {
        await query('UPDATE taskmanagementsystem.usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, userId]);
        
        // Obtener perfil actualizado
        const sql = `
            SELECT u.id, u.nombre, u.email, u.estado, u.imagen_perfil, u.ultimo_acceso,
                   STUFF((
                       SELECT ',' + r.nombre
                       FROM taskmanagementsystem.usuario_rol ur2
                       LEFT JOIN taskmanagementsystem.roles r ON ur2.id_rol = r.id
                       WHERE ur2.id_usuario = u.id
                       FOR XML PATH('')
                   ), 1, 1, '') as roles
            FROM taskmanagementsystem.usuarios u
            WHERE u.id = ?
        `;
        
        const results = await query(sql, [userId]);
        
        if (!results[0] || results[0].length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Error al actualizar: Usuario no encontrado' 
            });
        }
        
        const user = results[0][0];
        user.roles = user.roles ? user.roles.split(',') : [];
        delete user.password;
        
        res.json({ 
            success: true, 
            message: 'Perfil actualizado correctamente',
            data: user
        });
    } catch (err) {
        console.error('Error actualizando perfil:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error actualizando perfil', 
            error: err.message 
        });
    }
};

// Obtener permisos del usuario autenticado
const getMyPermissions = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const sql = `
            SELECT DISTINCT p.nombre as permiso
            FROM taskmanagementsystem.usuarios u
            JOIN taskmanagementsystem.usuario_rol ur ON u.id = ur.id_usuario
            JOIN taskmanagementsystem.roles r ON ur.id_rol = r.id
            JOIN taskmanagementsystem.rol_permiso rp ON r.id = rp.id_rol
            JOIN taskmanagementsystem.permisos p ON rp.id_permiso = p.id
            WHERE u.id = ?
            ORDER BY p.nombre
        `;
        
        const results = await query(sql, [userId]);
        const permissions = results[0] ? results[0].map(row => row.permiso) : [];
        
        res.json({ 
            success: true,
            permissions
        });
    } catch (err) {
        console.error('Error obteniendo permisos del usuario:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error al obtener permisos',
            error: err.message
        });
    }
};

// Obtener conteo de usuarios
const getUserCount = async (req, res) => {
    try {
        const result = await query('SELECT COUNT(*) as count FROM taskmanagementsystem.usuarios');
        const count = result[0][0].count;
        
        res.json({
            success: true,
            count
        });
    } catch (err) {
        console.error('Error al obtener conteo de usuarios:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener conteo de usuarios',
            error: err.message
        });
    }
};

// Obtener permisos de un usuario por ID
const getUserPermissions = async (req, res) => {
    const userId = req.params.id;
    
    try {
        const sql = `
            SELECT DISTINCT p.nombre as permiso, p.descripcion, p.categoria
            FROM taskmanagementsystem.usuarios u
            JOIN taskmanagementsystem.usuario_rol ur ON u.id = ur.id_usuario
            JOIN taskmanagementsystem.roles r ON ur.id_rol = r.id
            JOIN taskmanagementsystem.rol_permiso rp ON r.id = rp.id_rol
            JOIN taskmanagementsystem.permisos p ON rp.id_permiso = p.id
            WHERE u.id = ?
            ORDER BY p.categoria, p.nombre
        `;
        
        const results = await query(sql, [userId]);
        const permissions = results[0] || [];
        
        res.json({ 
            success: true,
            data: permissions
        });
    } catch (err) {
        console.error('Error obteniendo permisos del usuario:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Error al obtener permisos del usuario',
            error: err.message
        });
    }
};

module.exports = {
    getUserProfile,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserProfile,
    getMyPermissions,
    getUserCount,
    getUserPermissions
};
