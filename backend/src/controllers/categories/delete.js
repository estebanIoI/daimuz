const db = require('../../config/database');

module.exports = async function deleteCategory(payload, req) {
  const { id } = payload;

  if (!id) {
    throw new Error("El campo 'id' es obligatorio.");
  }

  const [linkedItems] = await db.query(
    'SELECT COUNT(*) AS total FROM menu_items WHERE category_id = ?',
    [id]
  );

  if (linkedItems[0].total > 0) {
    const err = new Error("No se puede eliminar la categoría, tiene productos asociados.");
    err.code = 409;
    throw err;
  }

  await db.query('DELETE FROM categories WHERE id = ?', [id]);

  return { message: 'Categoría eliminada con éxito.' };
};
