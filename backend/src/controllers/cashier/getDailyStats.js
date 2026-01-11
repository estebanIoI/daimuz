const db = require('../../config/database');

module.exports = async function getDailyStats(_, req) {
  try {
    // Obtener estadísticas del día actual
    const [stats] = await db.query(`
      SELECT 
        COALESCE(SUM(CAST(p.amount AS DECIMAL(10,2))), 0) AS total_sales,
        COUNT(DISTINCT p.order_id) AS total_orders,
        COALESCE(SUM(CASE WHEN p.method = 'efectivo' THEN CAST(p.amount AS DECIMAL(10,2)) ELSE 0 END), 0) AS cash_sales,
        COALESCE(SUM(CASE WHEN p.method = 'tarjeta' THEN CAST(p.amount AS DECIMAL(10,2)) ELSE 0 END), 0) AS card_sales,
        COALESCE(SUM(CASE WHEN p.method = 'nequi' THEN CAST(p.amount AS DECIMAL(10,2)) ELSE 0 END), 0) AS nequi_sales
      FROM payments p
      WHERE DATE(p.created_at) = CURDATE()
      AND p.status = 'completado'
    `);

    // Obtener órdenes pendientes
    const [pendingOrders] = await db.query(`
      SELECT 
        COUNT(*) AS pending_count,
        COALESCE(SUM(CAST(o.total AS DECIMAL(10,2))), 0) AS pending_amount
      FROM orders o
      WHERE o.status = 'activo'
    `);

    const result = {
      daily_sales: parseFloat(stats[0]?.total_sales || 0),
      total_orders: parseInt(stats[0]?.total_orders || 0),
      cash_sales: parseFloat(stats[0]?.cash_sales || 0),
      card_sales: parseFloat(stats[0]?.card_sales || 0),
      nequi_sales: parseFloat(stats[0]?.nequi_sales || 0),
      pending_orders: parseInt(pendingOrders[0]?.pending_count || 0),
      pending_amount: parseFloat(pendingOrders[0]?.pending_amount || 0)
    };

    return result;
  } catch (error) {
    console.error('Error obteniendo estadísticas diarias:', error);
    throw new Error('Error al obtener estadísticas del día');
  }
};
