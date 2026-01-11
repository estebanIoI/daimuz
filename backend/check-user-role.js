/**
 * Script para verificar el rol del usuario actual usando un token JWT
 * Ejecutar con: node check-user-role.js "tu-token-jwt"
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function checkUserRole() {
  // Obtener el token del argumento de la línea de comandos
  const token = process.argv[2];
  
  if (!token) {
    console.error('❌ Error: Debe proporcionar un token JWT como argumento');
    console.log('Ejemplo: node check-user-role.js "eyJhbGciOiJIUzI1NiIsIn..."');
    return;
  }
  
  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido');
    console.log('Información decodificada:', decoded);
    
    // Conectar a la base de datos para obtener información completa del usuario
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT id, name, email, role, active FROM users WHERE id = ?', [decoded.userId]);
    await conn.end();
    
    if (rows.length === 0) {
      console.error('❌ Error: Usuario no encontrado en la base de datos');
      return;
    }
    
    const user = rows[0];
    console.log('\nInformación del usuario en la base de datos:');
    console.log('ID:', user.id);
    console.log('Nombre:', user.name);
    console.log('Email:', user.email);
    console.log('Rol:', user.role);
    console.log('Activo:', user.active ? 'Sí' : 'No');
    
    if (user.role !== 'admin') {
      console.log('\n⚠️ Este usuario no tiene rol de administrador. Se requiere rol "admin" para acceder a funciones de respaldo.');
    } else {
      console.log('\n✅ Este usuario tiene permisos de administrador.');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar el token:', error.message);
    if (error.name === 'TokenExpiredError') {
      console.log('El token ha expirado. Debes iniciar sesión nuevamente.');
    }
  }
}

checkUserRole().catch(console.error);
