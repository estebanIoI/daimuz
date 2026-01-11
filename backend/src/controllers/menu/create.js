const db = require('../../config/database');

module.exports = async function createMenuItem(payload, req) {
  const { name, description, price, category_id, image_url, available, preparation_time } = payload;

  if (!name || !price || !category_id) {
    throw new Error("Los campos 'name', 'price' y 'category_id' son obligatorios.");
  }

  const [result] = await db.query(
    `INSERT INTO menu_items 
      (name, description, price, category_id, image_url, available, preparation_time)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      description || '',
      price,
      category_id,
      image_url || null,
      available ?? true,
      preparation_time ?? 0
    ]
  );

  const [category] = await db.query('SELECT name FROM categories WHERE id = ?', [category_id]);

  return {
    id: result.insertId,
    name,
    description,
    price,
    category_id,
    category_name: category[0]?.name || '',
    image_url,
    available: available ?? true,
    preparation_time: preparation_time ?? 0
  };
};
