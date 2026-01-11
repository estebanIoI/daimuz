const db = require('../../config/database');
const { invalidateAll } = require('../../services/cacheService');
const createInvoice = require('../invoices/create');

module.exports = async function registerPayment(payload, req) {
  const { order_id, payment_method, amount_received, closed_at } = payload;

  if (!order_id || !payment_method || !amount_received) {
    throw new Error("Se requieren: 'order_id', 'payment_method', 'amount_received'");
  }

  // Verificar que el usuario esté autenticado
  if (!req.user || !req.user.id) {
    throw new Error("Usuario no autenticado");
  }

  // Verificar total del pedido
  const [orderRows] = await db.query('SELECT total, table_id FROM orders WHERE id = ?', [order_id]);
  const order = orderRows[0];
  if (!order) throw new Error("Pedido no encontrado");

  // Generar transaction_id único
  const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Insertar en tabla de pagos con cashier_id y transaction_id
  // Nota: La tabla payments solo tiene 'amount', no 'amount_received'
  await db.query(`
    INSERT INTO payments (order_id, cashier_id, method, amount, transaction_id, status)
    VALUES (?, ?, ?, ?, ?, 'completado')
  `, [order_id, req.user.id, payment_method, order.total, transaction_id]);

  // Cerrar el pedido y actualizar closed_at
  const closedDateTime = closed_at ? new Date(closed_at) : new Date();
  // Convertir a formato MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
  const mysqlDateTime = closedDateTime.toISOString().slice(0, 19).replace('T', ' ');
  await db.query(`
    UPDATE orders SET status = 'cerrado', closed_at = ? WHERE id = ?
  `, [mysqlDateTime, order_id]);

  // Liberar mesa
  await db.query(`
    UPDATE tables SET status = 'libre', current_waiter_id = NULL WHERE id = ?
  `, [order.table_id]);

  // Invalidar todos los QR codes de la mesa (ya no podrán hacer más pedidos)
  await db.query(`
    UPDATE table_qr_codes SET is_active = FALSE, expires_at = NOW() WHERE table_id = ?
  `, [order.table_id]);
  console.log(`🔐 QR codes invalidados para mesa con table_id: ${order.table_id}`);

  // Invalidar todas las sesiones de clientes de la mesa
  // Usamos CONCAT para generar un token invalidado único para cada guest
  await db.query(`
    UPDATE table_guests SET is_active = FALSE, session_token = CONCAT('PAID-', id, '-', UNIX_TIMESTAMP()) WHERE table_id = ?
  `, [order.table_id]);
  console.log(`🔐 Sesiones de clientes invalidadas para mesa con table_id: ${order.table_id}`);

  // Invalidar todo el cache porque el pago afecta a todas las vistas
  invalidateAll();
  console.log('🔄 Todo el cache invalidado tras procesar pago');

  // Crear factura automáticamente (verificar que no exista una ya)
  let invoiceData = null;
  try {
    // Verificar si ya existe una factura para esta orden
    const [existingInvoice] = await db.query('SELECT id, invoice_number FROM invoices WHERE order_id = ?', [order_id]);
    
    if (existingInvoice.length > 0) {
      console.log(`📄 Factura ya existe para orden ${order_id}: ${existingInvoice[0].invoice_number}`);
      // Obtener la factura existente completa
      const [fullInvoice] = await db.query(`
        SELECT 
          id, invoice_number, order_id, table_number, waiter_name, cashier_name,
          subtotal, total, payment_method, transaction_id, items, notes, created_at
        FROM invoices 
        WHERE order_id = ?
      `, [order_id]);
      invoiceData = fullInvoice[0];
    } else {
      // Crear nueva factura
      const invoiceResult = await createInvoice({
        order_id,
        payment_method,
        transaction_id
      }, req);
      
      invoiceData = invoiceResult.invoice;
      console.log('📄 Nueva factura creada:', invoiceResult.invoice.invoice_number);
    }
  } catch (invoiceError) {
    console.error('❌ Error al crear/obtener factura:', invoiceError);
    // No fallar el pago si hay error en la factura, solo registrar el error
  }

  return { 
    message: "Pago registrado y pedido cerrado exitosamente.",
    transaction_id: transaction_id,
    cashier_id: req.user.id,
    closed_at: mysqlDateTime,
    invoice: invoiceData // Incluir datos de factura en la respuesta
  };
};
