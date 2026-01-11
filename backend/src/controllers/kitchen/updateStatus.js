const db = require('../../config/database');
const { invalidateKitchen, invalidateOrders } = require('../../services/cacheService');

module.exports = async function updateKitchenItemStatus(payload, req) {
  const { item_id, status } = payload;

  // Validar estados según el ENUM de la base de datos
  const validStatuses = ['pendiente', 'preparacion', 'listo', 'entregado'];
  if (!item_id || !validStatuses.includes(status)) {
    throw new Error("Datos inválidos. Estado permitido: 'pendiente', 'preparacion', 'listo', 'entregado'");
  }

  await db.query(
    'UPDATE order_items SET status = ? WHERE id = ?',
    [status, item_id]
  );

  // Invalidar cache cuando hay cambios
  invalidateKitchen();
  invalidateOrders();
  console.log('🔄 Cache invalidado tras actualización de estado');

  return { message: 'Estado del ítem actualizado con éxito.', item_id, status };
};
