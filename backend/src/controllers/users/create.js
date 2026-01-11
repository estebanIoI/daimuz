const db = require('../../config/database');
const bcrypt = require('bcryptjs');

module.exports = async function createUser(payload, req) {
  const { name, email, password, role, active } = payload;

  if (!name || !email || !password || !role) {
    throw new Error('Todos los campos son requeridos: name, email, password, role');
  }

  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new Error('El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    `INSERT INTO users (name, email, password_hash, role, active)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, passwordHash, role, active ?? true]
  );

  return {
    id: result.insertId,
    name,
    email,
    role,
    active: active ?? true
  };
};
