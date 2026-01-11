const db = require('../../config/database');

module.exports = async function waiterPerformance(_, req) {
  try {
    // Obtener rendimiento de meseros agrupando directamente por mesero
    // Cuenta las órdenes cerradas y suma los totales por cada mesero
    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.name AS waiterName,
        COUNT(DISTINCT o.id) AS ordersServed,
        CAST(COALESCE(SUM(o.total), 0) AS DECIMAL(10,2)) AS totalRevenue,
        CAST(COALESCE(AVG(o.total), 0) AS DECIMAL(10,2)) AS avgOrderValue,
        MAX(o.closed_at) AS lastOrderDate
      FROM users u
      INNER JOIN orders o ON u.id = o.waiter_id AND o.status = 'cerrado'
      WHERE u.role = 'mesero'
      GROUP BY u.id, u.name
      ORDER BY totalRevenue DESC
    `);

    // Si no hay datos, intentar obtener todos los meseros con 0 órdenes
    if (!rows || rows.length === 0) {
      const [waiters] = await db.query(`
        SELECT 
          u.id,
          u.name AS waiterName,
          0 AS ordersServed,
          0 AS totalRevenue,
          0 AS avgOrderValue,
          NULL AS lastOrderDate
        FROM users u
        WHERE u.role = 'mesero' AND u.active = true
        ORDER BY u.name
      `);

      return waiters.map(row => ({
        id: row.id,
        waiterName: row.waiterName || 'Sin nombre',
        ordersServed: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        lastOrderDate: null
      }));
    }

    return rows.map(row => ({
      id: row.id,
      waiterName: row.waiterName || 'Sin nombre',
      ordersServed: parseInt(row.ordersServed) || 0,
      totalRevenue: parseFloat(row.totalRevenue) || 0,
      avgOrderValue: parseFloat(row.avgOrderValue) || 0,
      lastOrderDate: row.lastOrderDate || null
    }));
  } catch (error) {
    console.error('Error en waiterPerformance:', error);
    return [];
  }
};
