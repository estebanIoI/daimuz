const db = require('../../config/database');

module.exports = async function topProducts(_, req) {
  try {
    const [rows] = await db.query(`
      SELECT 
        mi.id,
        mi.name,
        c.name AS category,
        SUM(oi.quantity) AS unitsSold,
        CAST(SUM(oi.subtotal) AS DECIMAL(10,2)) AS revenue
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN categories c ON mi.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'cerrado'
      GROUP BY mi.id, mi.name, c.name
      ORDER BY unitsSold DESC
      LIMIT 10
    `);

    // Si no hay datos, retornar array vacío
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      unitsSold: parseInt(row.unitsSold) || 0,
      revenue: parseFloat(row.revenue) || 0
    }));
  } catch (error) {
    console.error('Error en topProducts:', error);
    return [];
  }
};
