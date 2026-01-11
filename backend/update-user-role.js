/**
 * Script para actualizar el rol de un usuario existente a "admin"
 * Ejecutar con: node update-user-role.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function updateUserRole() {
  const conn = await mysql.createConnection(dbConfig);
  
  try {
    // Reemplaza con el email del usuario que quieres hacer admin
    const email = 'tu-email@ejemplo.com';
    
    // Primero verifica si el usuario existe
    const [userRows] = await conn.execute('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    
    if (userRows.length === 0) {
      console.error(`No se encontró ningún usuario con el email ${email}`);
      return;
    }
    
    const user = userRows[0];
    console.log('Usuario encontrado:', user);
    
    // Actualiza el rol a "admin"
    await conn.execute('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
    console.log(`✅ Usuario ${user.name} (${user.email}) actualizado a rol "admin"`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await conn.end();
  }
}

updateUserRole().catch(console.error);
