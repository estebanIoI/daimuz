const db = require('../../config/database');

/**
 * Obtener los items consumidos por un invitado específico
 */
module.exports = async function getGuestItems(payload, req) {
  const { guest_id, order_id } = payload;

  if (!guest_id) {
    throw new Error("Se requiere 'guest_id'");
  }

  // Obtener información del invitado
  const [guestRows] = await db.query(
    `SELECT g.*, t.number as table_number
     FROM table_guests g
     JOIN tables t ON g.table_id = t.id
     WHERE g.id = ?`,
    [guest_id]
  );

  if (guestRows.length === 0) {
    throw new Error("Invitado no encontrado");
  }

  const guest = guestRows[0];

  // Construir query base
  // Los items ya pagados fueron eliminados del pedido
  let itemsQuery = `
    SELECT 
      oi.id as order_item_id,
      oi.order_id,
      oi.quantity,
      oi.subtotal,
      oi.unit_price,
      oi.notes,
      oi.status,
      mi.id as menu_item_id,
      mi.name as menu_item_name,
      mi.description,
      mi.price,
      mi.image_url,
      c.name as category_name
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    LEFT JOIN categories c ON mi.category_id = c.id
    WHERE oi.guest_id = ?
  `;
  
  const params = [guest_id];

  // Si se especifica order_id, filtrar solo esa orden
  if (order_id) {
    itemsQuery += ' AND oi.order_id = ?';
    params.push(order_id);
  }

  itemsQuery += ' ORDER BY oi.created_at DESC';

  const [items] = await db.query(itemsQuery, params);

  // Calcular totales
  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    guest: {
      id: guest.id,
      name: guest.guest_name,
      phone: guest.phone,
      table_id: guest.table_id,
      table_number: guest.table_number,
      joined_at: guest.joined_at,
      is_active: guest.is_active
    },
    items: items.map(item => ({
      order_item_id: item.order_item_id,
      order_id: item.order_id,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price || item.price),
      subtotal: parseFloat(item.subtotal),
      notes: item.notes,
      status: item.status,
      menu_item: {
        id: item.menu_item_id,
        name: item.menu_item_name,
        description: item.description,
        price: parseFloat(item.price),
        image_url: item.image_url,
        category_name: item.category_name
      }
    })),
    totalItems: items.length,
    totalQuantity,
    totalAmount
  };
};
