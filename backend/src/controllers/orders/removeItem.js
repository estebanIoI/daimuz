const db = require('../../config/database');

module.exports = async function removeItem(payload, req) {
  const { order_id, item_id } = payload;

  if (!order_id || !item_id) {
    throw new Error("Faltan campos requeridos.");
  }

  await db.query('DELETE FROM order_items WHERE id = ? AND order_id = ?', [item_id, order_id]);

  // Recalcular totales del pedido
  await db.query(`
    UPDATE orders 
    SET 
      subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?),
      total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?)
    WHERE id = ?
  `, [order_id, order_id, order_id]);

  return { message: 'Ítem eliminado.' };
};
