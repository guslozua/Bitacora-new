// controllers/permisoController.js
const db = require('../config/db');

// Obtener todos los permisos
const getAllPermisos = async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM Permisos ORDER BY categoria, nombre');
        
        res.json({
            success: true,
            data: results
        });
    } catch (err) {
        console.error('Error obteniendo permisos:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error obteniendo permisos', 
            error: err.message 
        });
    }
};

// Crear un nuevo permiso
const createPermiso = async (req, res) => {
    const { nombre, descripcion = '', categoria = 'general' } = req.body;
    
    if (!nombre) {
        return res.status(400).json({
            success: false,
            message: 'El nombre del permiso es requerido'
        });
    }
    
    try {
        // Verificar si ya existe un permiso con ese nombre
        const [existingPermisos] = await db.query('SELECT id FROM Permisos WHERE nombre = ?', [nombre]);
        
        if (existingPermisos.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un permiso con ese nombre'
            });
        }
        
        const [result] = await db.query(
            'INSERT INTO Permisos (nombre, descripcion, categoria) VALUES (?, ?, ?)',
            [nombre, descripcion, categoria]
        );
        
        res.status(201).json({
            success: true,
            message: 'Permiso creado correctamente',
            permisoId: result.insertId
        });
    } catch (err) {
        console.error('Error creando permiso:', err);
        return res.status(500).json({
            success: false,
            message: 'Error creando permiso',
            error: err.message
        });
    }
};

// Actualizar un permiso
const updatePermiso = async (req, res) => {
    const permisoId = req.params.id;
    const { nombre, descripcion, categoria } = req.body;
    
    if (!nombre) {
        return res.status(400).json({
            success: false,
            message: 'El nombre del permiso es requerido'
        });
    }
    
    try {
        // Verificar si ya existe un permiso con ese nombre (excepto el actual)
        const [existingPermisos] = await db.query(
            'SELECT id FROM Permisos WHERE nombre = ? AND id != ?',
            [nombre, permisoId]
        );
        
        if (existingPermisos.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe otro permiso con ese nombre'
            });
        }
        
        // Actualizar el permiso
        await db.query(
            'UPDATE Permisos SET nombre = ?, descripcion = ?, categoria = ? WHERE id = ?',
            [nombre, descripcion, categoria, permisoId]
        );
        
        res.json({
            success: true,
            message: 'Permiso actualizado correctamente'
        });
    } catch (err) {
        console.error('Error actualizando permiso:', err);
        return res.status(500).json({
            success: false,
            message: 'Error actualizando permiso',
            error: err.message
        });
    }
};

// Eliminar un permiso
const deletePermiso = async (req, res) => {
    const permisoId = req.params.id;
    
    try {
        // Verificar si hay roles con este permiso
        const [rolesWithPermiso] = await db.query(
            'SELECT COUNT(*) as count FROM rol_permiso WHERE id_permiso = ?',
            [permisoId]
        );
        
        if (rolesWithPermiso[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar el permiso porque está asignado a ${rolesWithPermiso[0].count} rol(es)`
            });
        }
        
        // Eliminar el permiso
        await db.query('DELETE FROM Permisos WHERE id = ?', [permisoId]);
        
        res.json({
            success: true,
            message: 'Permiso eliminado correctamente'
        });
    } catch (err) {
        console.error('Error eliminando permiso:', err);
        return res.status(500).json({
            success: false,
            message: 'Error eliminando permiso',
            error: err.message
        });
    }
};

// Obtener permisos por categoría
const getPermisosByCategoria = async (req, res) => {
    try {
        // Obtener todos los permisos y agruparlos por categoría en JavaScript
        const [results] = await db.query('SELECT * FROM Permisos ORDER BY categoria, nombre');
        
        // Agrupar por categoría
        const groupedByCategory = results.reduce((acc, permiso) => {
            if (!acc[permiso.categoria]) {
                acc[permiso.categoria] = [];
            }
            acc[permiso.categoria].push({
                id: permiso.id,
                nombre: permiso.nombre,
                descripcion: permiso.descripcion
            });
            return acc;
        }, {});
        
        // Convertir a array de objetos
        const categoryArray = Object.entries(groupedByCategory).map(([categoria, permisos]) => ({
            categoria,
            permisos
        }));
        
        res.json({
            success: true,
            data: categoryArray
        });
    } catch (err) {
        console.error('Error obteniendo permisos por categoría:', err);
        return res.status(500).json({
            success: false,
            message: 'Error obteniendo permisos por categoría',
            error: err.message
        });
    }
};

// Obtener permisos de un rol específico
const getPermisosPorRol = async (req, res) => {
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
            message: 'Error obteniendo permisos del rol',
            error: err.message
        });
    }
};

// Asignar permiso a rol (método individual - ya está en roleController como batch)
const asignarPermisoARol = async (req, res) => {
    const { id_rol, id_permiso } = req.body;
    
    if (!id_rol || !id_permiso) {
        return res.status(400).json({
            success: false,
            message: 'id_rol e id_permiso son requeridos'
        });
    }
    
    try {
        // Verificar si ya existe esta asignación
        const [existingAssignments] = await db.query(
            'SELECT id FROM rol_permiso WHERE id_rol = ? AND id_permiso = ?',
            [id_rol, id_permiso]
        );
        
        if (existingAssignments.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El rol ya tiene este permiso asignado'
            });
        }
        
        // Asignar el permiso
        await db.query(
            'INSERT INTO rol_permiso (id_rol, id_permiso) VALUES (?, ?)',
            [id_rol, id_permiso]
        );
        
        res.json({
            success: true,
            message: 'Permiso asignado correctamente al rol'
        });
    } catch (err) {
        console.error('Error asignando permiso:', err);
        return res.status(500).json({
            success: false,
            message: 'Error asignando permiso',
            error: err.message
        });
    }
};

// Quitar permiso de rol
const quitarPermisoDeRol = async (req, res) => {
    const { id_rol, id_permiso } = req.body;
    
    // 🔧 DEBUG: Agregar logs detallados
    console.log('🔍 DEBUG quitarPermisoDeRol - INICIO');
    console.log('📋 Body recibido:', req.body);
    console.log('🎯 id_rol:', id_rol, 'tipo:', typeof id_rol);
    console.log('🎯 id_permiso:', id_permiso, 'tipo:', typeof id_permiso);
    
    if (!id_rol || !id_permiso) {
        console.log('❌ ERROR: Faltan parámetros');
        return res.status(400).json({
            success: false,
            message: 'id_rol e id_permiso son requeridos'
        });
    }
    
    try {
        console.log('🔍 Verificando si existe la asignación...');
        // Verificar si existe la asignación
        const [existingAssignments] = await db.query(
            'SELECT id FROM rol_permiso WHERE id_rol = ? AND id_permiso = ?',
            [id_rol, id_permiso]
        );
        
        console.log('📊 Asignaciones encontradas:', existingAssignments.length);
        console.log('📋 Datos encontrados:', existingAssignments);
        
        if (existingAssignments.length === 0) {
            console.log('❌ No se encontró la asignación');
            return res.status(404).json({
                success: false,
                message: 'El rol no tiene este permiso asignado'
            });
        }
        
        console.log('🗑️ Ejecutando DELETE...');
        // Quitar el permiso
        const [result] = await db.query(
            'DELETE FROM rol_permiso WHERE id_rol = ? AND id_permiso = ?',
            [id_rol, id_permiso]
        );
        
        console.log('✅ DELETE ejecutado. Filas afectadas:', result.affectedRows);
        console.log('📊 Resultado completo:', result);
        
        res.json({
            success: true,
            message: 'Permiso eliminado correctamente del rol'
        });
        
        console.log('🎉 Respuesta enviada exitosamente');
    } catch (err) {
        console.error('💥 ERROR quitando permiso:', err);
        return res.status(500).json({
            success: false,
            message: 'Error quitando permiso',
            error: err.message
        });
    }
};

module.exports = {
    getAllPermisos,
    createPermiso,
    updatePermiso,
    deletePermiso,
    getPermisosByCategoria,
    getPermisosPorRol,
    asignarPermisoARol,
    quitarPermisoDeRol
};