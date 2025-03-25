// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear el pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taskmanagementsystem',// Asegúrate de que coincida con el nombre real
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 segundos de timeout
});

// Probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos MySQL establecida correctamente');
    connection.release(); // Liberar la conexión
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1); // Detener la aplicación si no se puede conectar
  }
};

// Ejecutar prueba de conexión al iniciar la aplicación
testConnection();

module.exports = pool;