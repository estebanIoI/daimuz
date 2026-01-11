const db = require('../../config/database');
const { tablesCache } = require('../../services/cacheService');

module.exports = async function getAllTables(_, req) {
  try {
    // Intentar obtener de cache primero
    const cacheKey = 'all-tables';
    const cachedData = tablesCache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Mesas desde cache');
      return cachedData;
    }

    // Si no hay cache, consultar BD
    const [tables] = await db.query(`
      SELECT 
        t.id, t.number, t.capacity, t.status, 
        t.current_waiter_id, u.name AS waiter_name
      FROM tables t
      LEFT JOIN users u ON t.current_waiter_id = u.id
    `);

    // Agregar pedidos activos a cada mesa
    for (const table of tables) {
      const [orders] = await db.query(`
        SELECT 
          o.id, o.status, o.total,
          JSON_ARRAYAGG(JSON_OBJECT(
            'id', oi.id,
            'menuItem', JSON_OBJECT(
              'id', mi.id,
              'name', mi.name,
              'price', mi.price,
              'category_id', mi.category_id,
              'category_name', c.name,
              'available', mi.available
            ),
            'quantity', oi.quantity
          )) AS items
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        JOIN categories c ON c.id = mi.category_id
        WHERE o.table_id = ? AND o.status = 'activo'
        GROUP BY o.id
      `, [table.id]);

      table.orders = orders.length ? orders[0].items : [];
      table.total = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    }

    // Guardar en cache
    tablesCache.set(cacheKey, tables);
    console.log('💾 Mesas guardadas en cache');

    return tables;
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    throw error;
  }
};
