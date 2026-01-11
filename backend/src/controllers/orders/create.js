const db = require('../../config/database');

module.exports = async function createOrder(payload, req) {
  const { table_id, waiter_id, notes } = payload;

  if (!table_id || !waiter_id) {
    throw new Error("Los campos 'table_id' y 'waiter_id' son obligatorios.");
  }

  // Verificar si ya hay un pedido activo
  const [existing] = await db.query(`
    SELECT id FROM orders 
    WHERE table_id = ? AND status = 'activo'
  `, [table_id]);

  if (existing.length > 0) {
    throw new Error("Ya existe un pedido activo para esta mesa.");
  }

  const [result] = await db.query(`
    INSERT INTO orders (table_id, waiter_id, status, subtotal, tax_amount, total, notes)
    VALUES (?, ?, 'activo', 0, 0, 0, ?)
  `, [table_id, waiter_id, notes || null]);

  // Actualizar estado de la mesa
  await db.query(`
    UPDATE tables SET status = 'ocupada', current_waiter_id = ? WHERE id = ?
  `, [waiter_id, table_id]);

  return {
    order_id: result.insertId,
    table_id,
    waiter_id,
    status: 'activo',
    subtotal: 0,
    tax_amount: 0,
    total: 0,
    notes: notes || null
  };
};
