const db = require('../../config/database');

module.exports = async function updateTableNotes(payload, req) {
  const { order_id, notes } = payload;

  if (!order_id) {
    throw new Error("Falta campo obligatorio: 'order_id'");
  }

  await db.query(
    'UPDATE orders SET notes = ? WHERE id = ?',
    [notes || null, order_id]
  );

  return {
    success: true,
    message: 'Notas de mesa actualizadas correctamente'
  };
};
