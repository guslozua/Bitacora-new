//models/roleModel.js
const db = require('../config/db');

const RoleModel = {
    getAllRoles: (callback) => {
        const sql = 'SELECT * FROM Roles';
        db.query(sql, callback);
    },
    
    createRole: (nombre, callback) => {
        const sql = 'INSERT INTO Roles (nombre) VALUES (?)';
        db.query(sql, [nombre], callback);
    },
    
    assignRoleToUser: (userId, roleId, callback) => {
        const sql = 'UPDATE Usuarios SET rol = ? WHERE id = ?';
        db.query(sql, [roleId, userId], callback);
    }
};

module.exports = RoleModel;
