const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function testPassword() {
  try {
    const [rows] = await db.query('SELECT email, password_hash FROM users WHERE email = ?', ['admin@sirius.com']);
    const user = rows[0];
    
    console.log('User:', user.email);
    console.log('Stored hash:', user.password_hash);
    
    // Test common passwords
    const passwords = ['password', 'admin123', 'admin', '123456', 'sirius'];
    
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.password_hash);
      console.log(`Password "${pwd}":`, match ? '✅ MATCH' : '❌ no match');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPassword();
