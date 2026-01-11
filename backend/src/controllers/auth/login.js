const db = require('../../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = async function login(payload, req) {
  const { email, password } = payload;

  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos.');
  }

  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user || !user.password_hash) {
    throw new Error('Credenciales inválidas.');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Credenciales inválidas.');
  }

  if (!user.active) {
    throw new Error('Tu cuenta está inactiva.');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Actualizar último login
  await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};
