// testDB.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'taskmanagementsystem',
    });

    console.log('Conexión a la base de datos establecida correctamente');

    // Prueba una consulta simple
    const [rows] = await connection.execute('SELECT * FROM Usuarios');
    console.log('Resultado de la consulta:', rows);

    await connection.end();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

testConnection();