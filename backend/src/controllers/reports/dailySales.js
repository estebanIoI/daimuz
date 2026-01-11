const db = require('../../config/database');

module.exports = async function dailySales(_, req) {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS total_payments,
        CAST(SUM(amount) AS DECIMAL(10,2)) AS total_sales
      FROM payments
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND status = 'completado'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Si no hay datos, retornar datos por defecto
    if (!rows || rows.length === 0) {
      return [{
        date: new Date().toISOString().split('T')[0],
        total_payments: 0,
        total_sales: 0
      }];
    }

    return rows.map(row => ({
      date: row.date,
      total_payments: parseInt(row.total_payments) || 0,
      total_sales: parseFloat(row.total_sales) || 0
    }));
  } catch (error) {
    console.error('Error en dailySales:', error);
    return [{
      date: new Date().toISOString().split('T')[0],
      total_payments: 0,
      total_sales: 0
    }];
  }
};
