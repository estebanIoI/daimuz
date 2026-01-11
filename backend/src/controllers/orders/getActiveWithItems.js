const db = require('../../config/database');
const { ordersCache } = require('../../services/cacheService');

module.exports = async function getActiveOrdersWithItems(_, req) {
  try {
    // Intentar obtener de cache primero
    const cacheKey = 'active-orders-with-items';
    const cachedData = ordersCache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Órdenes activas desde cache');
      return cachedData;
    }

    // Si no hay cache, consultar BD
    const [orders] = await db.query(`
      SELECT 
        o.id AS order_id,
        o.table_id,
        t.number AS table_number,
        u.name AS waiter_name,
        o.total,
        o.status,
        o.notes AS table_notes,
        o.created_at
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      JOIN users u ON o.waiter_id = u.id
      WHERE o.status = 'activo'
      ORDER BY o.created_at DESC
    `);

    // Para cada orden, obtener sus items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query(`
          SELECT 
            oi.id AS order_item_id,
            oi.quantity,
            oi.unit_price,
            oi.subtotal,
            oi.status AS item_status,
            oi.notes,
            mi.id AS menu_item_id,
            mi.name AS menu_item_name,
            mi.description,
            mi.price,
            mi.category_id,
            mi.image_url,
            mi.available,
            mi.preparation_time,
            c.name AS category_name
          FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          JOIN categories c ON mi.category_id = c.id
          WHERE oi.order_id = ?
        `, [order.order_id]);

        return {
          ...order,
          items
        };
      })
    );

    // Guardar en cache
    ordersCache.set(cacheKey, ordersWithItems);
    console.log('💾 Órdenes activas guardadas en cache');

    return ordersWithItems;
  } catch (error) {
    console.error('Error al obtener órdenes activas:', error);
    throw error;
  }
};
