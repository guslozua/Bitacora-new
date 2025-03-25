// models/UserModel.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

const UserModel = {
  createUser: (nombre, email, password, rol, callback) => {
    console.log('Iniciando creación de usuario...');
    console.log('Datos recibidos:', { nombre, email, rol });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error al cifrar la contraseña:', err);
        return callback(err, null);
      }

      console.log('Contraseña cifrada correctamente.');

      const sql = 'INSERT INTO Usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
      console.log('Ejecutando consulta SQL:', sql, [nombre, email, hash, rol || 'User']);

      db.query(sql, [nombre, email, hash, rol || 'User'])
        .then(([result]) => {
          console.log('Usuario creado exitosamente en la base de datos.');
          callback(null, result);
        })
        .catch((err) => {
          console.error('Error en la consulta SQL:', err);
          callback(err, null);
        });
    });
  },

  getUserByEmail: (email, callback) => {
    console.log('Buscando usuario por email:', email);

    const sql = 'SELECT * FROM Usuarios WHERE email = ?';
    console.log('Ejecutando consulta SQL:', sql, [email]);

    db.query(sql, [email])
      .then(([results]) => {
        if (results.length === 0) {
          console.log('No se encontró ningún usuario con el email:', email);
        } else {
          console.log('Usuario encontrado:', results[0]);
        }
        callback(null, results);
      })
      .catch((err) => {
        console.error('Error en la consulta SQL:', err);
        callback(err, null);
      });
  },

  getUserById: (id, callback) => {
    console.log('Buscando usuario por ID:', id);

    const sql = 'SELECT id, nombre, email, rol, password FROM Usuarios WHERE id = ?';
    console.log('Ejecutando consulta SQL:', sql, [id]);

    db.query(sql, [id])
      .then(([results]) => {
        if (results.length === 0) {
          console.log('No se encontró ningún usuario con el ID:', id);
        } else {
          console.log('Usuario encontrado:', results[0]);
        }
        callback(null, results);
      })
      .catch((err) => {
        console.error('Error en la consulta SQL:', err);
        callback(err, null);
      });
  },

  updatePassword: (userId, hashedPassword, callback) => {
    console.log('Actualizando contraseña para usuario ID:', userId);
    
    const sql = 'UPDATE Usuarios SET password = ? WHERE id = ?';
    console.log('Ejecutando consulta SQL:', sql, [hashedPassword, userId]);
    
    db.query(sql, [hashedPassword, userId])
      .then(([result]) => {
        console.log('Contraseña actualizada exitosamente.');
        callback(null, result);
      })
      .catch((err) => {
        console.error('Error en la consulta SQL de actualización:', err);
        callback(err, null);
      });
  }
};
/**
 * Obtener permisos por ID de usuario
 * Retorna todos los permisos asignados al usuario, incluyendo los heredados por sus roles
 */
UserModel.getPermisosByUserId = (userId, callback) => {
  console.log('Obteniendo permisos para usuario ID:', userId);

  const sql = `
    SELECT DISTINCT p.nombre AS permiso
    FROM Usuarios u
    JOIN Usuario_Rol ur ON u.id = ur.id_usuario
    JOIN Roles r ON ur.id_rol = r.id
    JOIN Rol_Permiso rp ON r.id = rp.id_rol
    JOIN Permisos p ON rp.id_permiso = p.id
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
};


module.exports = UserModel;