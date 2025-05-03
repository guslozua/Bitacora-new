// src/controllers/roleController.js
const db = require('../config/db');

// Obtener todos los roles
const getAllRoles = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Roles ORDER BY nombre');
        
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error obteniendo roles:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error obteniendo roles', 
            error: err.message 
        });
    }
};

// Crear un nuevo rol
const createRole = async (req, res) => {
    const { nombre, descripcion = '', is_default = 0 } = req.body;
    
    if (!nombre) {
        return res.status(400).json({
            success: false,
            message: 'El nombre del rol es requerido'
        });
    }
    
    try {
        // Verificar si ya existe un rol con ese nombre
        const [existingRoles] = await db.query('SELECT id FROM Roles WHERE nombre = ?', [nombre]);
        
        if (existingRoles.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un rol con ese nombre'
            });
        }
        
        const [result] = await db.query(
            'INSERT INTO Roles (nombre, descripcion, is_default) VALUES (?, ?, ?)',
            [nombre, descripcion, is_default]
        );
        
        res.status(201).json({
            success: true,
            message: 'Rol creado correctamente',
            roleId: result.insertId
        });
    } catch (err) {
        console.error('Error creando rol:', err);
        return res.status(500).json({
            success: false,
            message: 'Error creando rol',
            error: err.message
        });
    }
};

// Asignar un rol a un usuario
const assignRoleToUser = async (req, res) => {
    const { userId, roleId } = req.body;
    
    // Validar datos
    if (!userId || !roleId) {
        return res.status(400).json({
            success: false,
            message: 'Faltan datos requeridos (userId, roleId)'
        });
    }
    
    try {
        // Usar transacción para mantener integridad
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Verificar si ya existe esta asignación
            const [existingAssignments] = await connection.query(
                'SELECT id FROM usuario_rol WHERE id_usuario = ? AND id_rol = ?',
                [userId, roleId]
            );
            
            if (existingAssignments.length > 0) {
                await connection.release();
                return res.status(409).json({
                    success: false,
                    message: 'El usuario ya tiene este rol asignado'
                });
            }
            
            // Insertar la nueva asignación
            await connection.query(
                'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)',
                [userId, roleId]
            );
            
            await connection.commit();
            connection.release();
            
            res.json({
                success: true,
                message: 'Rol asignado correctamente'
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('Error asignando rol:', err);
        return res.status(500).json({
            success: false,
            message: 'Error asignando rol',
            error: err.message
        });
    }
};

// Quitar un rol a un usuario
const removeRoleFromUser = async (req, res) => {
    const { userId, roleId } = req.body;
    
    // Validar datos
    if (!userId || !roleId) {
        return res.status(400).json({
            success: false,
            message: 'Faltan datos requeridos (userId, roleId)'
        });
    }
    
    try {
        // Verificar si existe la asignación
        const [existingRole] = await db.query(
            'SELECT id FROM usuario_rol WHERE id_usuario = ? AND id_rol = ?',
            [userId, roleId]
        );
        
        if (existingRole.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El usuario no tiene asignado este rol'
            });
        }
        
        // Eliminar la asignación
        await db.query(
            'DELETE FROM usuario_rol WHERE id_usuario = ? AND id_rol = ?',
            [userId, roleId]
        );
        
        res.json({
            success: true,
            message: 'Rol eliminado correctamente del usuario'
        });
    } catch (err) {
        console.error('Error eliminando rol:', err);
        return res.status(500).json({
            success: false,
            message: 'Error eliminando rol',
            error: err.message
        });
    }
};

// Obtener roles de un usuario
const getUserRoles = async (req, res) => {
    const userId = req.params.userId;
    
    try {
        const [results] = await db.query(`
            SELECT r.* 
            FROM Roles r
            JOIN usuario_rol ur ON r.id = ur.id_rol
            WHERE ur.id_usuario = ?
            ORDER BY r.nombre
        `, [userId]);
        
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error obteniendo roles del usuario:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo roles',
            error: err.message
        });
    }
};

// Actualizar un rol
const updateRole = async (req, res) => {
    const roleId = req.params.id;
    const { nombre, descripcion, is_default } = req.body;
    
    if (!nombre) {
        return res.status(400).json({
            success: false,
            message: 'El nombre del rol es requerido'
        });
    }
    
    try {
        // Verificar si ya existe un rol con ese nombre (excepto el actual)
        const [existingRoles] = await db.query(
            'SELECT id FROM Roles WHERE nombre = ? AND id != ?',
            [nombre, roleId]
        );
        
        if (existingRoles.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe otro rol con ese nombre'
            });
        }
        
        // Si is_default es true (1), actualizar todos los demás roles primero
        if (is_default === 1) {
            await db.query('UPDATE Roles SET is_default = 0 WHERE id != ?', [roleId]);
        }
        
        // Actualizar el rol
        await db.query(
            'UPDATE Roles SET nombre = ?, descripcion = ?, is_default = ? WHERE id = ?',
            [nombre, descripcion, is_default, roleId]
        );
        
        res.json({
            success: true,
            message: 'Rol actualizado correctamente'
        });
    } catch (err) {
        console.error('Error actualizando rol:', err);
        return res.status(500).json({
            success: false,
            message: 'Error actualizando rol',
            error: err.message
        });
    }
};

// Eliminar un rol
const deleteRole = async (req, res) => {
    const roleId = req.params.id;
    
    try {
        // Verificar que no sea un rol por defecto
        const [defaultRole] = await db.query(
            'SELECT is_default FROM Roles WHERE id = ?',
            [roleId]
        );
        
        if (defaultRole.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }
        
        if (defaultRole[0].is_default === 1) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el rol por defecto'
            });
        }
        
        // Verificar si hay usuarios con este rol
        const [usersWithRole] = await db.query(
            'SELECT COUNT(*) as count FROM usuario_rol WHERE id_rol = ?',
            [roleId]
        );
        
        if (usersWithRole[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el rol porque está asignado a ${usersWithRole[0].count} usuario(s)`
            });
        }
        
        // Usar transacción para mantener integridad
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Eliminar permisos asociados al rol
            await connection.query('DELETE FROM rol_permiso WHERE id_rol = ?', [roleId]);
            
            // Eliminar el rol
            await connection.query('DELETE FROM Roles WHERE id = ?', [roleId]);
            
            await connection.commit();
            connection.release();
            
            res.json({
                success: true,
                message: 'Rol eliminado correctamente'
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('Error eliminando rol:', err);
        return res.status(500).json({
            success: false,
            message: 'Error eliminando rol',
            error: err.message
        });
    }
};

// Asignar permisos a un rol
const assignPermissionsToRole = async (req, res) => {
    const roleId = req.params.id;
    const { permisoIds } = req.body;
    
    if (!Array.isArray(permisoIds)) {
        return res.status(400).json({
            success: false,
            message: 'permisoIds debe ser un array de IDs'
        });
    }
    
    try {
        // Usar transacción para mantener integridad
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Eliminar permisos actuales
            await connection.query('DELETE FROM rol_permiso WHERE id_rol = ?', [roleId]);
            
            // Asignar nuevos permisos
            if (permisoIds.length > 0) {
                // Crear consulta con múltiples valores
                const values = permisoIds.map(permisoId => [roleId, permisoId]);
                
                await connection.query(
                    'INSERT INTO rol_permiso (id_rol, id_permiso) VALUES ?',
                    [values]
                );
            }
            
            await connection.commit();
            connection.release();
            
            res.json({
                success: true,
                message: 'Permisos asignados correctamente'
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (err) {
        console.error('Error asignando permisos:', err);
        return res.status(500).json({
            success: false,
            message: 'Error asignando permisos',
            error: err.message
        });
    }
};

// Obtener permisos de un rol
const getRolePermissions = async (req, res) => {
    const roleId = req.params.id;
    
    try {
        const [results] = await db.query(`
            SELECT p.* 
            FROM Permisos p
            JOIN rol_permiso rp ON p.id = rp.id_permiso
            WHERE rp.id_rol = ?
            ORDER BY p.categoria, p.nombre
        `, [roleId]);
        
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error obteniendo permisos del rol:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo permisos',
            error: err.message
        });
    }
};

module.exports = { 
    getAllRoles, 
    createRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
    removeRoleFromUser,
    getUserRoles,
    assignPermissionsToRole,
    getRolePermissions
};