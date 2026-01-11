const db = require('../../config/database');
const bcrypt = require('bcryptjs');

module.exports = async function resetPassword(payload, req) {
  const { id, new_password } = payload;

  if (!id || !new_password) {
    throw new Error("Se requieren 'id' y 'new_password'");
  }

  const passwordHash = await bcrypt.hash(new_password, 10);

  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

  return { message: 'Contraseña restablecida exitosamente.' };
};
