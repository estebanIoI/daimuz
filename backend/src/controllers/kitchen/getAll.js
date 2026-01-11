const db = require('../../config/database');
const { kitchenCache } = require('../../services/cacheService');

module.exports = async function getKitchenOrders(_, req) {
  try {
    // Intentar obtener de cache primero
    const cacheKey = 'kitchen-orders';
    const cachedData = kitchenCache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Datos de cocina desde cache');
      return cachedData;
    }

    // Si no hay cache, consultar BD
    const [rows] = await db.query(`
      SELECT 
        o.id AS order_id,
        t.number AS table_number,
        oi.id AS item_id,
        mi.name AS item_name,
        mi.image_url AS item_image_url,
        oi.quantity,
        oi.status,
        oi.notes,
        u.name AS waiter_name
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      JOIN users u ON o.waiter_id = u.id
      WHERE o.status = 'activo' 
        AND oi.status IN ('pendiente', 'preparacion', 'listo')
      ORDER BY t.number ASC, o.id ASC
    `);

    // Guardar en cache
    kitchenCache.set(cacheKey, rows);
    console.log('💾 Datos de cocina guardados en cache');
    
    return rows;
  } catch (error) {
    console.error('Error al obtener órdenes de cocina:', error);
    throw error;
  }
};
