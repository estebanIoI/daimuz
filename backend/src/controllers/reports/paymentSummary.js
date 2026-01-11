const db = require('../../config/database');

module.exports = async function paymentSummary(_, req) {
  try {
    const [rows] = await db.query(`
      SELECT 
        method,
        COUNT(*) AS transactions,
        CAST(SUM(amount) AS DECIMAL(10,2)) AS totalRevenue
      FROM payments
      WHERE status = 'completado'
      AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY method
      ORDER BY totalRevenue DESC
    `);

    // Si no hay datos, retornar datos por defecto
    if (!rows || rows.length === 0) {
      return [
        { method: 'efectivo', transactions: 0, totalRevenue: 0 },
        { method: 'tarjeta', transactions: 0, totalRevenue: 0 },
        { method: 'nequi', transactions: 0, totalRevenue: 0 }
      ];
    }

    return rows.map(row => ({
      method: row.method,
      transactions: parseInt(row.transactions) || 0,
      totalRevenue: parseFloat(row.totalRevenue) || 0
    }));
  } catch (error) {
    console.error('Error en paymentSummary:', error);
    return [
      { method: 'efectivo', transactions: 0, totalRevenue: 0 },
      { method: 'tarjeta', transactions: 0, totalRevenue: 0 },
      { method: 'nequi', transactions: 0, totalRevenue: 0 }
    ];
  }
};
