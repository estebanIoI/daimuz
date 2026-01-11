const db = require('../../config/database');

module.exports = async function createCategory(payload, req) {
  const { name, description } = payload;

  if (!name) {
    throw new Error("El campo 'name' es obligatorio.");
  }

  const [exists] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
  if (exists.length > 0) {
    throw new Error('Ya existe una categoría con ese nombre.');
  }

  const [result] = await db.query(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description || null]
  );

  return {
    id: result.insertId,
    name,
    description
  };
};
