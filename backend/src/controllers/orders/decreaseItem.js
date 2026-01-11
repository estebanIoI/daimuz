const db = require('../../config/database');

module.exports = async function decreaseItem(payload, req) {
  const { order_id, item_id } = payload;

  if (!order_id || !item_id) {
    throw new Error("Faltan campos: 'order_id' e 'item_id'");
  }

  const [existing] = await db.query(
    'SELECT quantity, unit_price FROM order_items WHERE id = ? AND order_id = ?',
    [item_id, order_id]
  );

  if (existing.length === 0) {
    throw new Error("El ítem no existe.");
  }

  const current = existing[0];

  if (current.quantity <= 1) {
    await db.query('DELETE FROM order_items WHERE id = ?', [item_id]);
  } else {
    const newQty = current.quantity - 1;
    await db.query(
      'UPDATE order_items SET quantity = ?, subtotal = ? WHERE id = ?',
      [newQty, newQty * current.unit_price, item_id]
    );
  }

  // Recalcular totales del pedido
  await db.query(`
    UPDATE orders 
    SET 
      subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?),
      total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?)
    WHERE id = ?
  `, [order_id, order_id, order_id]);

  return {
    message: 'Cantidad actualizada',
    updated_order_total: 'actualizado'
  };
};
