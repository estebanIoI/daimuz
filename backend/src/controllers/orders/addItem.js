const db = require('../../config/database');
const { invalidateOrders, invalidateKitchen } = require('../../services/cacheService');

module.exports = async function addItem(payload, req) {
  const { order_id, menu_item_id, quantity, notes, guest_id } = payload;

  if (!order_id || !menu_item_id || !quantity) {
    throw new Error("Faltan campos obligatorios: 'order_id', 'menu_item_id', 'quantity'");
  }

  // Si se proporciona guest_id, buscar items de ese cliente específico
  // Si no, buscar cualquier item del mismo producto en la orden
  let existing;
  if (guest_id) {
    [existing] = await db.query(
      'SELECT id, quantity FROM order_items WHERE order_id = ? AND menu_item_id = ? AND guest_id = ?',
      [order_id, menu_item_id, guest_id]
    );
  } else {
    [existing] = await db.query(
      'SELECT id, quantity FROM order_items WHERE order_id = ? AND menu_item_id = ? AND guest_id IS NULL',
      [order_id, menu_item_id]
    );
  }

  const [itemData] = await db.query('SELECT price FROM menu_items WHERE id = ?', [menu_item_id]);
  const unit_price = itemData[0]?.price ?? 0;

  let itemId, newQuantity;

  if (existing.length > 0) {
    const newQty = existing[0].quantity + quantity;
    await db.query(
      'UPDATE order_items SET quantity = ?, subtotal = ? WHERE id = ?',
      [newQty, unit_price * newQty, existing[0].id]
    );
    itemId = existing[0].id;
    newQuantity = newQty;
  } else {
    const [result] = await db.query(`
      INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, notes, guest_id)
      VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)
    `, [order_id, menu_item_id, quantity, unit_price, quantity * unit_price, notes || null, guest_id || null]);
    itemId = result.insertId;
    newQuantity = quantity;
  }

  // Recalcular totales del pedido de forma más robusta
  const [recalcResult] = await db.query(`
    UPDATE orders 
    SET 
      subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?),
      total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?)
    WHERE id = ?
  `, [order_id, order_id, order_id]);

  // Verificar que el recálculo fue exitoso
  const [updatedOrder] = await db.query('SELECT total FROM orders WHERE id = ?', [order_id]);
  
  // Invalidar cache cuando hay cambios
  invalidateOrders();
  invalidateKitchen();
  console.log('🔄 Cache invalidado tras agregar ítem');
  
  return {
    order_item_id: itemId,
    quantity: newQuantity,
    unit_price,
    subtotal: unit_price * newQuantity,
    order_total: updatedOrder[0]?.total || 0
  };
};
