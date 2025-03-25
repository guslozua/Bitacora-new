//models/LogModel.js
const db = require('../config/db');

const LogModel = {
    createLog: (userId, action, description, callback) => {
        const sql = 'INSERT INTO Logs (user_id, action, description) VALUES (?, ?, ?)';
        db.query(sql, [userId, action, description], callback);
    }
};

module.exports = LogModel;
