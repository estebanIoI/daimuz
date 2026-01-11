const db = require('../../config/database');

module.exports = async function updateItemNotes(payload, req) {
  const { order_id, item_id, notes } = payload;

  if (!order_id || !item_id) {
    throw new Error("Faltan campos obligatorios: 'order_id', 'item_id'");
  }

  await db.query(
    'UPDATE order_items SET notes = ? WHERE id = ? AND order_id = ?',
    [notes || null, item_id, order_id]
  );

  return {
    success: true,
    message: 'Notas del producto actualizadas correctamente'
  };
};
