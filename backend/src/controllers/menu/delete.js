const db = require('../../config/database');

module.exports = async function deleteMenuItem(payload, req) {
  const { id } = payload;

  if (!id) throw new Error("El campo 'id' es obligatorio.");

  await db.query('DELETE FROM menu_items WHERE id = ?', [id]);

  return { message: 'Producto eliminado correctamente.' };
};
