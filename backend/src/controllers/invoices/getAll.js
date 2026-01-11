const db = require('../../config/database');

module.exports = async function getAllInvoices(payload, req) {
  try {
    const { limit = 50, offset = 0, date_from, date_to } = payload || {};

    let query = `
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
    `;

    const params = [];

    // Agregar filtros de fecha si se proporcionan
    if (date_from || date_to) {
      query += ' WHERE ';
      const conditions = [];
      
      if (date_from) {
        conditions.push('DATE(i.created_at) >= ?');
        params.push(date_from);
      }
      
      if (date_to) {
        conditions.push('DATE(i.created_at) <= ?');
        params.push(date_to);
      }
      
      query += conditions.join(' AND ');
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [invoices] = await db.query(query, params);

    // Parsear los items JSON de forma segura
    const invoicesWithParsedItems = invoices.map(invoice => {
      let parsedItems = [];
      
      try {
        // Si items ya es un objeto/array, usarlo directamente
        if (typeof invoice.items === 'object' && invoice.items !== null) {
          parsedItems = Array.isArray(invoice.items) ? invoice.items : [invoice.items];
        }
        // Si es string, intentar parsearlo
        else if (typeof invoice.items === 'string' && invoice.items.trim()) {
          // Verificar si parece un JSON válido
          if (invoice.items.startsWith('[') || invoice.items.startsWith('{')) {
            parsedItems = JSON.parse(invoice.items);
          } else {
            console.warn(`⚠️ Formato de items inválido en factura ${invoice.id}: ${invoice.items.substring(0, 50)}...`);
            parsedItems = [];
          }
        }
        // Si está vacío o es null
        else {
          parsedItems = [];
        }
      } catch (error) {
        console.error(`❌ Error parseando items de factura ${invoice.id}:`, error.message);
        console.error(`Datos problemáticos: ${JSON.stringify(invoice.items).substring(0, 100)}...`);
        parsedItems = [];
      }

      return {
        ...invoice,
        items: parsedItems
      };
    });

    // Obtener el total de facturas para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM invoices';
    const countParams = [];
    
    if (date_from || date_to) {
      countQuery += ' WHERE ';
      const conditions = [];
      
      if (date_from) {
        conditions.push('DATE(created_at) >= ?');
        countParams.push(date_from);
      }
      
      if (date_to) {
        conditions.push('DATE(created_at) <= ?');
        countParams.push(date_to);
      }
      
      countQuery += conditions.join(' AND ');
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    console.log(`📄 Consultando facturas: ${invoicesWithParsedItems.length} de ${total} total`);

    return {
      invoices: invoicesWithParsedItems,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    };
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    throw error;
  }
};