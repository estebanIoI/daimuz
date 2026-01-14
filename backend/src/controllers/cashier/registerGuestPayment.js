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

    // Obtener los items del invitado en esta orden con detalles para la factura
    const [guestItems] = await connection.query(
      `SELECT oi.*, mi.name as menu_item_name 
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.guest_id = ? AND oi.order_id = ?`,
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

    // Generar transaction_id único
    const transaction_id = `TXN-G${guest_id}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // --- GENERAR FACTURA ESPECÍFICA PARA EL CLIENTE ---
    const invoiceNumber = `INV-G${guest_id}-${Date.now()}`;
    const [cashierResult] = await connection.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const cashierName = cashierResult[0]?.name || 'Cajero';

    await connection.query(`
      INSERT INTO invoices (
        order_id,
        invoice_number,
        table_number,
        waiter_id,
        waiter_name,
        cashier_id,
        cashier_name,
        subtotal,
        total,
        payment_method,
        transaction_id,
        items,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      order_id,
      invoiceNumber,
      guest.table_number,
      null, // No asociamos mesero específico a la factura individual necesariamente
      'Sistema Bar',
      req.user.id,
      cashierName,
      guestTotal,
      guestTotal,
      payment_method,
      transaction_id,
      JSON.stringify(guestItems.map(item => ({
        order_item_id: item.id,
        menu_item_name: item.menu_item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }))),
      `Pago individual de: ${guest.guest_name}`
    ]);
    console.log(`🧾 Factura individual generada: ${invoiceNumber} para ${guest.guest_name}`);

    // Registrar pago
    await connection.query(`
      INSERT INTO payments (order_id, cashier_id, method, amount, transaction_id, status)
      VALUES (?, ?, ?, ?, ?, 'completado')
    `, [
      order_id,
      req.user.id,
      payment_method,
      guestTotal,
      `${transaction_id}|FACTURA:${invoiceNumber}|GUEST:${guest.guest_name}`,
      'completado'
    ]);
    console.log(`💳 Pago individual registrado - ${guest.guest_name}: $${Math.round(guestTotal).toLocaleString('es-CO')}`);

    // Eliminar los items pagados del pedido
    const paidItemIds = guestItems.map(i => i.id);
    await connection.query(
      `DELETE FROM order_items WHERE id IN (?) AND order_id = ?`,
      [paidItemIds, order_id]
    );
    console.log(`📦 ${paidItemIds.length} items removidos del pedido tras pago individual`);

    // Desactivar al invitado e invalidar su token de sesión
    // Esto asegura que la sesión del teléfono quede completamente deshabilitada
    const invalidatedToken = `PAID-${guest_id}-${Date.now()}`;
    await connection.query(
      `UPDATE table_guests SET is_active = FALSE, session_token = ? WHERE id = ?`,
      [invalidatedToken, guest_id]
    );
    console.log(`🔐 Sesión invalidada definitivamente para ${guest.guest_name}`);

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

    // --- INVALIDAR EL QR DE LA MESA ---
    // Apenas alguien paga su consumo individual, invalidamos el QR para que nadie más se una a esta sesión
    // o para que el cliente que pagó no pueda volver a entrar con el mismo QR.
    await connection.query(
      `UPDATE table_qr_codes SET is_active = FALSE, expires_at = NOW() WHERE table_id = ?`,
      [guest.table_id]
    );
    console.log(`🔐 QR codes invalidados para mesa ${guest.table_number} tras pago individual`);

    // Solo cerrar la orden si no quedan guests activos Y no quedan items pendientes
    let orderClosed = false;
    if (activeGuests[0].count === 0 && remainingItems[0].count === 0) {
      await connection.query(
        `UPDATE orders SET status = 'cerrado', closed_at = NOW() WHERE id = ?`,
        [order_id]
      );

      // Liberar mesa 
      await connection.query(
        `UPDATE tables SET status = 'libre', current_waiter_id = NULL WHERE id = ?`,
        [guest.table_id]
      );

      console.log(`🔐 Mesa ${guest.table_number} liberada (era el último cliente)`);

      orderClosed = true;
    }

    // Obtener la factura completa para retornar al frontend
    const [fullInvoiceRows] = await connection.query(`
      SELECT * FROM invoices WHERE invoice_number = ?
    `, [invoiceNumber]);
    const fullInvoice = fullInvoiceRows[0];

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
        change: received - guestTotal,
        invoice_number: invoiceNumber
      },
      invoice: fullInvoice,
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
