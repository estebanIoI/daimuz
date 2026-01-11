// Configuración de conexión MySQL usando mysql2 y promesas
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20, //Aumentado para múltiples usuarios
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  queueLimit: 0,
  ssl: false
}).promise();

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Error en pool de conexiones:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconectando...');
  } else {
    throw err;
  }
});

// Exporta el pool para usar en los controladores
module.exports = pool;


