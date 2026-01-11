const db = require('../../config/database');

module.exports = async function updateUser(payload, req) {
  const { id, name, email, role, active } = payload;

  if (!id) throw new Error("El campo 'id' es requerido");

  const fields = [];
  const values = [];

  if (name) { fields.push("name = ?"); values.push(name); }
  if (email) { fields.push("email = ?"); values.push(email); }
  if (role) { fields.push("role = ?"); values.push(role); }
  if (typeof active === "boolean") { fields.push("active = ?"); values.push(active); }

  if (fields.length === 0) throw new Error("No hay campos para actualizar");

  values.push(id);

  await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

  const [user] = await db.query('SELECT id, name, email, role, active FROM users WHERE id = ?', [id]);
  return user[0];
};

