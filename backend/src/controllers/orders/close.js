const db = require('../../config/database');

module.exports = async function closeOrder(payload, req) {
  const { order_id } = payload;

  if (!order_id) throw new Error("El campo 'order_id' es obligatorio.");

  const [order] = await db.query('SELECT table_id FROM orders WHERE id = ?', [order_id]);
  const table_id = order[0]?.table_id;

  await db.query(`
    UPDATE orders SET status = 'cerrado' WHERE id = ?
  `, [order_id]);

  await db.query(`
    UPDATE tables SET status = 'libre', current_waiter_id = NULL WHERE id = ?
  `, [table_id]);

  return { message: 'Pedido cerrado y mesa liberada exitosamente.' };
};
