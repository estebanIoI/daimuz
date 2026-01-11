const db = require('../../config/database');

module.exports = async function createInvoice(payload, req) {
  const { order_id, payment_method, transaction_id } = payload;

  if (!order_id || !payment_method) {
    throw new Error("Se requieren: 'order_id', 'payment_method'");
  }

  // Verificar que el usuario esté autenticado
  if (!req.user || !req.user.id) {
    throw new Error("Usuario no autenticado");
  }

  try {
    // Obtener información completa del pedido
    const [orderResult] = await db.query(`
      SELECT 
        o.id,
        o.table_id,
        t.number AS table_number,
        o.waiter_id,
        u.name AS waiter_name,
        o.subtotal,
        o.total,
        o.notes,
        o.created_at,
        o.closed_at
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON o.waiter_id = u.id
      WHERE o.id = ?
    `, [order_id]);

    if (!orderResult || orderResult.length === 0) {
      throw new Error("Pedido no encontrado");
    }

    const order = orderResult[0];

    // Debug: Log de la orden para verificar totales
    console.log('📊 Orden para facturar:', {
      id: order.id,
      subtotal: order.subtotal,
      total: order.total,
      table_number: order.table_number
    });

    // Obtener todos los items del pedido con información completa
    const [itemsResult] = await db.query(`
      SELECT 
        oi.id AS order_item_id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        oi.notes,
        mi.id AS menu_item_id,
        mi.name AS menu_item_name,
        mi.description,
        mi.category_id,
        c.name AS category_name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN categories c ON mi.category_id = c.id
      WHERE oi.order_id = ?
    `, [order_id]);

    // Generar número de factura único
    const invoiceNumber = `INV-${Date.now()}-${order.table_number}`;

    // Obtener información del cajero
    const [cashierResult] = await db.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const cashierName = cashierResult[0]?.name || 'Cajero desconocido';

    // Insertar la factura
    const [invoiceResult] = await db.query(`
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
      order.table_number,
      order.waiter_id,
      order.waiter_name || 'Mesero no asignado',
      req.user.id,
      cashierName,
      order.total, // Usar total como subtotal ya que no hay impuestos
      order.total,
      payment_method,
      transaction_id,
      JSON.stringify(itemsResult),
      order.notes
    ]);

    console.log(`✅ Factura creada: ${invoiceNumber} para pedido ${order_id}`);

    return {
      message: 'Factura creada exitosamente',
      invoice: {
        id: invoiceResult.insertId,
        invoice_number: invoiceNumber,
        order_id: order_id,
        table_number: order.table_number,
        waiter_name: order.waiter_name || 'Mesero no asignado',
        cashier_name: cashierName,
        total: order.total,
        payment_method: payment_method,
        items: itemsResult,
        created_at: new Date()
      }
    };
  } catch (error) {
    console.error('Error al crear factura:', error);
    throw error;
  }
};