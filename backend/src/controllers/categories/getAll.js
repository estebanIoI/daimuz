const db = require('../../config/database');

module.exports = async function getAllCategories(_, req) {
  const [categories] = await db.query(`
    SELECT id, name, description
    FROM categories
    ORDER BY name ASC
  `);

  return categories;
};
