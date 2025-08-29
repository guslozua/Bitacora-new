// models/UserModel.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

const UserModel = {
  // [Otros métodos existentes...]

  getUserById: (id, callback) => {
    console.log('Buscando usuario por ID:', id);

    // Actualizada para incluir el campo estado y todos los campos necesarios
    const sql = `
      SELECT u.id, u.nombre, u.email, u.password, u.estado, 
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
    
    console.log('Ejecutando consulta SQL:', sql, [id]);

    db.query(sql, [id])
      .then(([results]) => {
        if (results.length === 0) {
          console.log('No se encontró ningún usuario con el ID:', id);
        } else {
          console.log('Usuario encontrado:', results[0]);
          
          // Convertir los roles de string a array
          if (results[0].roles) {
            results[0].roles = results[0].roles.split(',');
          } else {
            results[0].roles = [];
          }
        }
        callback(null, results);
      })
      .catch((err) => {
        console.error('Error en la consulta SQL:', err);
        callback(err, null);
      });
  },

  // Actualización del método para obtener permisos
  getPermisosByUserId: (userId, callback) => {
    console.log('Obteniendo permisos para usuario ID:', userId);

    const sql = `
      SELECT DISTINCT p.nombre AS permiso
      FROM taskmanagementsystem.usuarios u
      JOIN taskmanagementsystem.usuario_rol ur ON u.id = ur.id_usuario
      JOIN taskmanagementsystem.roles r ON ur.id_rol = r.id
      JOIN taskmanagementsystem.rol_permiso rp ON r.id = rp.id_rol
      JOIN taskmanagementsystem.permisos p ON rp.id_permiso = p.id
      WHERE u.id = ?
    `;

    db.query(sql, [userId])
      .then(([results]) => {
        const permisos = results.map(row => row.permiso);
        console.log(`Permisos encontrados para el usuario ${userId}:`, permisos);
        callback(null, permisos);
      })
      .catch((err) => {
        console.error('Error al obtener permisos del usuario:', err);
        callback(err, null);
      });
  }
  
  // [Otros métodos que necesiten actualización...]
};

module.exports = UserModel;