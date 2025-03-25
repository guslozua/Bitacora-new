// models/permisoModel.js
const db = require('../config/db');

exports.getAllPermisos = (callback) => {
  db.query('SELECT * FROM Permisos', callback);
};

exports.createPermiso = (nombre, callback) => {
  const sql = 'INSERT INTO Permisos (nombre) VALUES (?)';
  db.query(sql, [nombre], callback);
};

exports.asignarPermisoARol = (id_rol, id_permiso, callback) => {
  const sql = 'INSERT INTO Rol_Permiso (id_rol, id_permiso) VALUES (?, ?)';
  db.query(sql, [id_rol, id_permiso], callback);
};

exports.getPermisosPorRol = (id_rol, callback) => {
  const sql = `
    SELECT p.id, p.nombre
    FROM Permisos p
    INNER JOIN Rol_Permiso rp ON p.id = rp.id_permiso
    WHERE rp.id_rol = ?
  `;
  db.query(sql, [id_rol], callback);
};
