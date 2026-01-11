const db = require('../../config/database');
const { ordersCache } = require('../../services/cacheService');

module.exports = async function getActiveOrders(_, req) {
  try {
    // Intentar obtener de cache primero
    const cacheKey = 'cashier-active-orders-v2';
    const cachedData = ordersCache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Órdenes del cajero desde cache');
      return cachedData;
    }

    // Si no hay cache, consultar BD - Obtener órdenes con info adicional
    const [rows] = await db.query(`
      SELECT 
        o.id AS order_id,
        t.number AS table_number,
        t.id AS table_id,
        u.name AS waiter_name,
        o.total,
        o.created_at,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
        (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.id) AS total_quantity,
        (SELECT COUNT(*) FROM table_guests WHERE table_id = t.id AND is_active = TRUE) AS guest_count
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      JOIN users u ON o.waiter_id = u.id
      WHERE o.status = 'activo'
      ORDER BY o.created_at DESC
    `);

    // Guardar en cache
    ordersCache.set(cacheKey, rows);
    console.log('💾 Órdenes del cajero guardadas en cache');

    return rows;
  } catch (error) {
    console.error('Error en getActiveOrders:', error);
    throw new Error('Error al obtener órdenes activas');
  }
};
