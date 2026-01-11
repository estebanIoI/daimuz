const db = require('../../config/database');

module.exports = async function updateMenuItem(payload, req) {
  const { id, name, description, price, category_id, image_url, available, preparation_time } = payload;

  if (!id) throw new Error("El campo 'id' es obligatorio.");

  const fields = [];
  const values = [];

  if (name !== undefined) { fields.push("name = ?"); values.push(name); }
  if (description !== undefined) { fields.push("description = ?"); values.push(description); }
  if (price !== undefined) { fields.push("price = ?"); values.push(price); }
  if (category_id !== undefined) { fields.push("category_id = ?"); values.push(category_id); }
  if (image_url !== undefined) { fields.push("image_url = ?"); values.push(image_url); }
  if (available !== undefined) { fields.push("available = ?"); values.push(available); }
  if (preparation_time !== undefined) { fields.push("preparation_time = ?"); values.push(preparation_time); }

  if (fields.length === 0) {
    throw new Error("No hay campos para actualizar.");
  }

  values.push(id);

  await db.query(`UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`, values);

  const [updated] = await db.query(`
    SELECT 
      mi.*, c.name AS category_name
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    WHERE mi.id = ?
  `, [id]);

  return updated[0];
};
