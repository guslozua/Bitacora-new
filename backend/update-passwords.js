const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Función para actualizar la contraseña de un usuario
async function updatePassword(userId, plainPassword) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE Usuarios SET password = ? WHERE id = ?';
        db.query(sql, [hashedPassword, userId], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

// Actualizar contraseñas de los usuarios existentes
async function updateAllPasswords() {
    try {
        console.log('Iniciando actualización de contraseñas...');
        await updatePassword(1, '123456'); // Para el usuario user
        await updatePassword(2, '123456'); // Para el usuario admin
        await updatePassword(3, '123456'); // Para el usuario superadmin
        console.log('¡Todas las contraseñas actualizadas correctamente!');
        process.exit(0);
    } catch (error) {
        console.error('Error al actualizar contraseñas:', error);
        process.exit(1);
    }
}

// Ejecutar el script
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        process.exit(1);
    }
    console.log('Conectado a MySQL ✅');
    updateAllPasswords();
});