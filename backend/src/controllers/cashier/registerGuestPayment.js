const db = require('../../config/database');
const { invalidateAll } = require('../../services/cacheService');

/**
 * Registrar pago individual de un invitado
 * Descuenta el consumo del invitado del total de la mesa
 */
module.exports = async function registerGuestPayment(payload, req) {
  const { guest_id, order_id, payment_method, amount_received } = payload;

  if (!guest_id || !order_id || !payment_method) {
    throw new Error("Se requieren: 'guest_id', 'order_id', 'payment_method'");
  }

  // Verificar que el usuario esté autenticado
  if (!req.user || !req.user.id) {
    throw new Error("Usuario no autenticado");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener información del invitado
    const [guestRows] = await connection.query(
      `SELECT g.*, t.number as table_number
       FROM table_guests g
       JOIN tables t ON g.table_id = t.id
       WHERE g.id = ? AND g.is_active = TRUE`,
      [guest_id]
    );

    if (guestRows.length === 0) {
      throw new Error("Invitado no encontrado o ya inactivo");
    }

    const guest = guestRows[0];

    // Obtener los items del invitado en esta orden
    const [guestItems] = await connection.query(
      `SELECT id, subtotal FROM order_items 
       WHERE guest_id = ? AND order_id = ?`,
      [guest_id, order_id]
    );

    if (guestItems.length === 0) {
      throw new Error("El invitado no tiene items en este pedido");
    }

    // Calcular total del invitado (el precio ya incluye IVA)
    const guestTotal = guestItems.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    // Validar monto recibido
    const received = parseFloat(amount_received) || guestTotal;
    if (received < guestTotal) {
      throw new Error(`Monto insuficiente. Total: $${Math.round(guestTotal).toLocaleString('es-CO')}, Recibido: $${Math.round(received).toLocaleString('es-CO')}`);
    }

    // Generar transaction_id único que incluye los IDs de items pagados
    const itemIds = guestItems.map(i => i.id).join(',');
    const transaction_id = `TXN-G${guest_id}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Registrar pago parcial (guardamos info del guest en transaction_id)
    await connection.query(`
      INSERT INTO payments (order_id, cashier_id, method, amount, transaction_id, status)
      VALUES (?, ?, ?, ?, ?, 'completado')
    `, [
      order_id, 
      req.user.id, 
      payment_method, 
      guestTotal, 
      `${transaction_id}|ITEMS:${itemIds}|GUEST:${guest.guest_name}`
    ]);
    console.log(`💳 Pago individual registrado - ${guest.guest_name}: $${Math.round(guestTotal).toLocaleString('es-CO')}`);

    // Guardar los item_ids que fueron pagados para referencia
    const paidItemIds = guestItems.map(i => i.id);
    
    // Eliminar los items pagados del pedido (ya están registrados en el payment)
    // Esto evita que se cobren doble y mantiene consistencia con los triggers de totales
    await connection.query(
      `DELETE FROM order_items WHERE id IN (?) AND order_id = ?`,
      [paidItemIds, order_id]
    );
    console.log(`📦 ${paidItemIds.length} items del cliente ${guest.guest_name} procesados y removidos del pedido`);

    // Desactivar al invitado e invalidar su sesión (ya no podrá hacer más pedidos)
    // Usamos un token invalidado en lugar de NULL porque la columna tiene restricción NOT NULL
    const invalidatedToken = `PAID-${guest_id}-${Date.now()}`;
    await connection.query(
      `UPDATE table_guests SET is_active = FALSE, session_token = ? WHERE id = ?`,
      [invalidatedToken, guest_id]
    );
    console.log(`🔐 Sesión invalidada para cliente ${guest.guest_name} (ID: ${guest_id})`);

    // Al eliminar los items, los triggers de MySQL recalculan automáticamente
    // el total de la orden (subtotal, tax_amount, total)

    // Verificar si quedan guests activos (que aún no han pagado)
    const [activeGuests] = await connection.query(
      `SELECT COUNT(*) as count FROM table_guests 
       WHERE table_id = ? AND is_active = TRUE AND id != ?`,
      [guest.table_id, guest_id]
    );

    // Verificar si quedan items pendientes (incluyendo los del mesero)
    const [remainingItems] = await connection.query(
      `SELECT COUNT(*) as count FROM order_items WHERE order_id = ?`,
      [order_id]
    );

    // Solo cerrar la orden si no quedan guests activos Y no quedan items pendientes
    let orderClosed = false;
    if (activeGuests[0].count === 0 && remainingItems[0].count === 0) {
      await connection.query(
        `UPDATE orders SET status = 'cerrado', closed_at = NOW() WHERE id = ?`,
        [order_id]
      );
      
      // Liberar mesa y desactivar todos los QR codes
      await connection.query(
        `UPDATE tables SET status = 'libre', current_waiter_id = NULL WHERE id = ?`,
        [guest.table_id]
      );
      
      // Invalidar todos los QR codes de la mesa
      await connection.query(
        `UPDATE table_qr_codes SET is_active = FALSE, expires_at = NOW() WHERE table_id = ?`,
        [guest.table_id]
      );
      
      console.log(`🔐 QR codes invalidados y mesa ${guest.table_number} liberada`);
      
      orderClosed = true;
    }

    await connection.commit();

    // Invalidar cache
    invalidateAll();
    console.log('🔄 Cache invalidado tras pago individual de invitado');

    return {
      success: true,
      message: `Pago de ${guest.guest_name} procesado correctamente`,
      payment: {
        guest_id,
        guest_name: guest.guest_name,
        table_number: guest.table_number,
        amount: guestTotal,
        payment_method,
        transaction_id,
        change: received - guestTotal
      },
      orderClosed,
      remainingGuests: parseInt(activeGuests[0].count)
    };

  } catch (error) {
    await connection.rollback();
    console.error('Error en registerGuestPayment:', error);
    throw error;
  } finally {
    connection.release();
  }
};
