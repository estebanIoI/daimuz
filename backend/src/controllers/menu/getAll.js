// src/controllers/menu/getAll.js
const db = require('../../config/database');

module.exports = async function getAllMenuItems(_, req) {
  console.log("🔍 getAllMenuItems invocado");

  const [items] = await db.query(`
    SELECT 
      mi.id, mi.name, mi.description, mi.price,
      mi.category_id, c.name AS category_name,
      mi.image_url, mi.available, mi.preparation_time
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    ORDER BY c.name, mi.name
  `);

  console.log(`📦 Se encontraron ${items.length} ítems de menú`);

  return items;
};
