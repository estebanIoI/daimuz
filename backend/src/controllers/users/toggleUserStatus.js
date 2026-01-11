const db = require('../../config/database');

module.exports = async function toggleUserStatus(payload, req) {
  const { id, active } = payload;

  if (!id) {
    throw new Error("El campo 'id' es requerido");
  }

  if (typeof active !== "boolean") {
    throw new Error("El campo 'active' debe ser un valor booleano (true/false)");
  }

  // Verificar que el usuario existe
  const [existingUser] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
  if (existingUser.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  // Actualizar el estado del usuario
  await db.query('UPDATE users SET active = ? WHERE id = ?', [active, id]);

  // Retornar el usuario actualizado
  const [user] = await db.query('SELECT id, name, email, role, active FROM users WHERE id = ?', [id]);
  
  return {
    ...user[0],
    message: `Usuario ${active ? 'activado' : 'desactivado'} exitosamente`
  };
};
