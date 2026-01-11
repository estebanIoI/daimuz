const db = require('../../config/database');

module.exports = async function tablePerformance(_, req) {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id,
        t.number AS tableNumber,
        COUNT(o.id) AS ordersServed,
        CAST(COALESCE(SUM(o.total), 0) AS DECIMAL(10,2)) AS totalRevenue,
        CAST(COALESCE(AVG(o.total), 0) AS DECIMAL(10,2)) AS avgOrderValue,
        (
          SELECT u.name 
          FROM orders o2 
          LEFT JOIN users u ON o2.waiter_id = u.id 
          WHERE o2.table_id = t.id AND o2.status = 'cerrado' AND u.name IS NOT NULL
          ORDER BY o2.created_at DESC 
          LIMIT 1
        ) AS waiterName
      FROM tables t
      LEFT JOIN orders o ON t.id = o.table_id AND o.status = 'cerrado'
      GROUP BY t.id, t.number
      ORDER BY totalRevenue DESC
    `);

    // Si no hay datos, retornar array vacío
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => ({
      id: row.id,
      tableNumber: row.tableNumber,
      ordersServed: parseInt(row.ordersServed) || 0,
      totalRevenue: parseFloat(row.totalRevenue) || 0,
      avgOrderValue: parseFloat(row.avgOrderValue) || 0,
      waiterName: row.waiterName || 'Sin asignar'
    }));
  } catch (error) {
    console.error('Error en tablePerformance:', error);
    return [];
  }
};
