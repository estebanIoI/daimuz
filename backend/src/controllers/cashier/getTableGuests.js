const db = require('../../config/database');

/**
 * Obtener los invitados de una mesa con su consumo detallado
 * para que el cajero pueda cobrar individual o grupalmente
 */
module.exports = async function getTableGuests(payload, req) {
  const { table_id } = payload;

  if (!table_id) {
    throw new Error("Se requiere 'table_id'");
  }

  // Obtener información de la mesa
  const [tableRows] = await db.query(
    'SELECT id, number, status FROM tables WHERE id = ?',
    [table_id]
  );

  if (tableRows.length === 0) {
    throw new Error("Mesa no encontrada");
  }

  const table = tableRows[0];

  // Obtener orden activa de la mesa
  const [orderRows] = await db.query(
    `SELECT o.id, o.total, o.waiter_id, u.name as waiter_name
     FROM orders o
     LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.table_id = ? AND o.status = 'activo'
     LIMIT 1`,
    [table_id]
  );

  if (orderRows.length === 0) {
    // Aunque no hay orden activa, pueden haber clientes registrados en la mesa
    // Obtener invitados activos de la mesa aunque no tengan consumo
    const [guestsWithoutOrder] = await db.query(
      `SELECT 
          g.id,
          g.guest_name,
          g.phone,
          g.joined_at,
          g.last_activity,
          g.is_active
       FROM table_guests g
       WHERE g.table_id = ? AND g.is_active = TRUE
       ORDER BY g.joined_at ASC`,
      [table_id]
    );

    return {
      table: {
        id: table.id,
        number: table.number,
        status: table.status
      },
      order: null,
      guests: guestsWithoutOrder.map(g => ({
        id: g.id,
        name: g.guest_name,
        guest_name: g.guest_name,
        phone: g.phone,
        joined_at: g.joined_at,
        last_activity: g.last_activity,
        is_active: g.is_active,
        item_count: 0,
        total_quantity: 0,
        total_spent: 0
      })),
      totalItems: 0,
      totalAmount: 0
    };
  }

  const order = orderRows[0];

  // Obtener invitados activos de la mesa con su consumo
  // Los items pagados ya fueron eliminados, solo contamos los pendientes
  // NOTA: El precio de los productos YA incluye IVA, no se aplica impuesto adicional
  const [guests] = await db.query(
    `SELECT 
        g.id,
        g.guest_name,
        g.phone,
        g.joined_at,
        g.last_activity,
        g.is_active,
        COUNT(DISTINCT oi.id) as item_count,
        COALESCE(SUM(oi.subtotal), 0) as total_spent,
        COALESCE(SUM(oi.quantity), 0) as total_quantity
     FROM table_guests g
     LEFT JOIN order_items oi ON g.id = oi.guest_id AND oi.order_id = ?
     WHERE g.table_id = ? AND g.is_active = TRUE
     GROUP BY g.id
     ORDER BY g.joined_at ASC`,
    [order.id, table_id]
  );

  // Obtener items del pedido que NO tienen guest_id (pedidos por mesero directamente)
  const [waiterItems] = await db.query(
    `SELECT 
        oi.id as order_item_id,
        oi.quantity,
        oi.subtotal,
        oi.notes,
        mi.id as menu_item_id,
        mi.name as menu_item_name,
        mi.price,
        c.name as category_name
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     LEFT JOIN categories c ON mi.category_id = c.id
     WHERE oi.order_id = ? AND oi.guest_id IS NULL`,
    [order.id]
  );

  const waiterTotal = waiterItems.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
  const waiterItemCount = waiterItems.reduce((sum, item) => sum + item.quantity, 0);

  // Obtener total de items pendientes de la mesa
  const [totalItemsResult] = await db.query(
    `SELECT COUNT(*) as count, COALESCE(SUM(quantity), 0) as total_quantity, COALESCE(SUM(subtotal), 0) as pending_total
     FROM order_items WHERE order_id = ?`,
    [order.id]
  );

  // Calcular total pendiente (suma de guests activos + items del mesero sin pagar)
  const pendingTotal = parseFloat(totalItemsResult[0].pending_total) || 0;

  return {
    table: {
      id: table.id,
      number: table.number,
      status: table.status
    },
    order: {
      id: order.id,
      total: parseFloat(order.total), // Total original
      pending_total: pendingTotal,    // Total pendiente de pago
      waiter_id: order.waiter_id,
      waiter_name: order.waiter_name
    },
    guests: guests.map(g => ({
      id: g.id,
      name: g.guest_name,
      guest_name: g.guest_name,
      phone: g.phone,
      joined_at: g.joined_at,
      last_activity: g.last_activity,
      is_active: g.is_active,
      item_count: parseInt(g.item_count),
      total_quantity: parseInt(g.total_quantity),
      total_spent: parseFloat(g.total_spent)  // Precio ya incluye IVA
    })),
    waiterOrders: {
      items: waiterItems,
      item_count: waiterItems.length,
      total_quantity: waiterItemCount,
      total: waiterTotal
    },
    totalItems: parseInt(totalItemsResult[0].count),
    totalQuantity: parseInt(totalItemsResult[0].total_quantity),
    totalAmount: parseFloat(order.total),
    pendingAmount: pendingTotal  // Total que falta por pagar
  };
};
