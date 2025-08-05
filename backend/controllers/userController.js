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

// Obtener todos los usuarios con filtros y paginación
const getAllUsers = async (req, res) => {
    try {
        const { nombre, email, rol, estado, page = 1, limit } = req.query;
        
        // 🔧 CORRECCIÓN: Manejar el caso cuando limit = 'all'
        let shouldPaginate = true;
        let limitNum = 10; // valor por defecto
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
                   GROUP_CONCAT(DISTINCT r.nombre) as roles
            FROM Usuarios u
            LEFT JOIN usuario_rol ur ON u.id = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id
            WHERE 1=1
        `;
        
        // Array para parámetros de la consulta
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
            // Verificar si rol es un número (ID) o un string (nombre)
            const isNumeric = !isNaN(rol) && !isNaN(parseFloat(rol));
            
            if (isNumeric) {
                // Si es un número, filtrar por ID del rol
                sqlQuery += ` AND r.id = ?`;
                queryParams.push(parseInt(rol));
            } else {
                // Si es un string, filtrar por nombre del rol
                sqlQuery += ` AND r.nombre = ?`;
                queryParams.push(rol);
            }
        }
        
        if (estado) {
            sqlQuery += ` AND u.estado = ?`;
            queryParams.push(estado);
        }
        
        // Agrupar por ID de usuario
        sqlQuery += ` GROUP BY u.id ORDER BY u.nombre ASC`;
        
        // 🔧 CORRECCIÓN: Solo agregar LIMIT si shouldPaginate es true
        if (shouldPaginate) {
            sqlQuery += ` LIMIT ? OFFSET ?`;
            queryParams.push(limitNum, offset);
        }
        
        console.log('🔍 Ejecutando consulta de usuarios:', {
            shouldPaginate,
            limit: limit,
            limitNum,
            offset,
            totalParams: queryParams.length,
            rol: rol,
            rolType: typeof rol,
            isNumeric: rol ? (!isNaN(rol) && !isNaN(parseFloat(rol))) : false
        });
        
        console.log('📝 SQL Query:', sqlQuery);
        console.log('📝 Query Params:', queryParams);
        
        // Ejecutar consulta principal
        const [results] = await db.query(sqlQuery, queryParams);
        
        console.log('✅ Resultados de la consulta:', results.length, 'usuarios encontrados');
        if (results.length > 0) {
            console.log('✅ Primer resultado:', results[0]);
        }
        
        // Consulta para el total de registros (para paginación)
        let countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM Usuarios u
            LEFT JOIN usuario_rol ur ON u.id = ur.id_usuario
            LEFT JOIN Roles r ON ur.id_rol = r.id
            WHERE 1=1
        `;
        
        // Los mismos filtros para el conteo
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
            // Aplicar la misma lógica de filtro que en la consulta principal
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
        
        // Ejecutar consulta de conteo
        const [countResult] = await db.query(countQuery, countParams);
        const totalUsers = countResult[0].total;
        
        // Convertir roles de cadena a array para cada usuario
        const users = results.map(user => ({
            ...user,
            roles: user.roles ? user.roles.split(',') : []
        }));
        
        console.log(`✅ Usuarios obtenidos: ${users.length} de ${totalUsers} total`);
        
        // Preparar respuesta
        const response = {
            success: true,
            data: users,
            count: users.length, // 🔧 AGREGAR: count para compatibilidad
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
    
    // Validar datos requeridos
    if (!nombre || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos requeridos (nombre, email, password)'
        });
    }
    
    try {
        // Verificar si el email ya está registrado
        const [existingUser] = await db.query(
            'SELECT id FROM Usuarios WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }
        
        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Iniciar transacción para mantener la integridad de los datos
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // 1. Insertar el usuario
            const [result] = await connection.query(
                'INSERT INTO Usuarios (nombre, email, password, estado) VALUES (?, ?, ?, ?)',
                [nombre, email, hashedPassword, estado || 'activo']
            );
            
            const userId = result.insertId;
            
            // 2. Asignar roles si se proporcionaron
            if (roles && Array.isArray(roles) && roles.length > 0) {
                // Obtener IDs de los roles proporcionados
                const [rolesData] = await connection.query(
                    'SELECT id, nombre FROM Roles WHERE nombre IN (?)',
                    [roles]
                );
                
                // Asignar roles
                for (const role of rolesData) {
                    await connection.query(
                        'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
                        [userId, role.id]
                    );
                }
            } else {
                // Si no se proporcionaron roles, asignar el rol predeterminado (is_default = 1)
                const [defaultRole] = await connection.query(
                    'SELECT id FROM Roles WHERE is_default = 1 LIMIT 1'
                );
                
                if (defaultRole.length > 0) {
                    await connection.query(
                        'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
                        [userId, defaultRole[0].id]
                    );
                }
            }
            
            // Confirmar la transacción
            await connection.commit();
            connection.release();
            
            res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                userId: userId
            });
        } catch (error) {
            // Revertir cambios en caso de error
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('Error creando usuario:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al crear usuario',
            error: err.message
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
    const { nombre, email, password, roles, estado } = req.body;
    
    try {
        // Iniciar transacción para mantener la integridad de los datos
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // 1. Actualizar datos básicos del usuario
            if (password) {
                // Si se proporciona una nueva contraseña, encriptarla
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                
                await connection.query(
                    'UPDATE Usuarios SET nombre = ?, email = ?, estado = ?, password = ? WHERE id = ?',
                    [nombre, email, estado, hashedPassword, userId]
                );
            } else {
                // Si no se proporciona contraseña, actualizar sin ella
                await connection.query(
                    'UPDATE Usuarios SET nombre = ?, email = ?, estado = ? WHERE id = ?',
                    [nombre, email, estado, userId]
                );
            }
            
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
const getMyPermissions = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Consulta para obtener todos los permisos del usuario a través de sus roles
        const sql = `
            SELECT DISTINCT p.nombre as permiso
            FROM Usuarios u
            JOIN usuario_rol ur ON u.id = ur.id_usuario
            JOIN Roles r ON ur.id_rol = r.id
            JOIN rol_permiso rp ON r.id = rp.id_rol
            JOIN Permisos p ON rp.id_permiso = p.id
            WHERE u.id = ?
            ORDER BY p.nombre
        `;
        
        const [results] = await db.query(sql, [userId]);
        
        // Extraer solo los nombres de los permisos en un array
        const permissions = results.map(row => row.permiso);
        
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

// Obtener conteo de usuarios (para dashboard)
const getUserCount = async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM Usuarios');
        const count = result[0].count;
        
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

module.exports = {
    getUserProfile,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserProfile,
    getUserPermissions,
    getMyPermissions,
    getUserCount
};