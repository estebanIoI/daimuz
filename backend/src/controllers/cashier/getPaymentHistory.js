const db = require('../../config/database');

module.exports = async function getPaymentHistory(_, req) {
  try {
    const [payments] = await db.query(`
      SELECT 
        p.id, p.order_id, p.method, 
        CAST(p.amount AS DECIMAL(10,2)) AS amount, 
        p.transaction_id, p.created_at,
        t.number AS table_number,
        u.name AS waiter_name,
        c.name AS cashier_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.waiter_id = u.id
      LEFT JOIN users c ON p.cashier_id = c.id
      WHERE DATE(p.created_at) = CURDATE()
      AND p.status = 'completado'
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    return payments;
  } catch (error) {
    console.error('Error en getPaymentHistory:', error);
    throw new Error('Error al obtener historial de pagos');
  }
};
