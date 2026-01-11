const db = require('../../config/database');

module.exports = async function getInvoiceById(payload, req) {
  const { invoice_id } = payload;

  if (!invoice_id) {
    throw new Error("El campo 'invoice_id' es obligatorio");
  }

  try {
    const [invoiceResult] = await db.query(`
      SELECT 
        i.id,
        i.invoice_number,
        i.order_id,
        i.table_number,
        i.waiter_id,
        COALESCE(u.name, i.waiter_name, 'N/A') AS waiter_name,
        i.cashier_name,
        i.subtotal,
        i.total,
        i.payment_method,
        i.transaction_id,
        i.items,
        i.notes,
        i.created_at
      FROM invoices i
      LEFT JOIN users u ON i.waiter_id = u.id AND u.role = 'mesero'
      WHERE i.id = ?
    `, [invoice_id]);

    if (!invoiceResult || invoiceResult.length === 0) {
      throw new Error("Factura no encontrada");
    }

    const invoice = invoiceResult[0];
    
    // Parsear los items JSON de forma segura
    try {
      // Si items ya es un objeto/array, usarlo directamente
      if (typeof invoice.items === 'object' && invoice.items !== null) {
        invoice.items = Array.isArray(invoice.items) ? invoice.items : [invoice.items];
      }
      // Si es string, intentar parsearlo
      else if (typeof invoice.items === 'string' && invoice.items.trim()) {
        // Verificar si parece un JSON válido
        if (invoice.items.startsWith('[') || invoice.items.startsWith('{')) {
          invoice.items = JSON.parse(invoice.items);
        } else {
          console.warn(`⚠️ Formato de items inválido en factura ${invoice.id}: ${invoice.items.substring(0, 50)}...`);
          invoice.items = [];
        }
      }
      // Si está vacío o es null
      else {
        invoice.items = [];
      }
    } catch (error) {
      console.error(`❌ Error parseando items de factura ${invoice.id}:`, error.message);
      invoice.items = [];
    }

    console.log(`📄 Factura consultada: ${invoice.invoice_number}`);

    return invoice;
  } catch (error) {
    console.error('Error al obtener factura:', error);
    throw error;
  }
};