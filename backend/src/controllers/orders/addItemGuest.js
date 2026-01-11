// src/controllers/orders/addItemGuest.js
// Agregar item a orden desde cliente/invitado
const db = require('../../config/database');
const { invalidateOrders, invalidateKitchen } = require('../../services/cacheService');

module.exports = async function addItemGuest(payload) {
    const { order_id, menu_item_id, quantity, notes, guestId, sessionToken } = payload;

    if (!order_id || !menu_item_id || !quantity) {
        throw new Error("Faltan campos obligatorios: 'order_id', 'menu_item_id', 'quantity'");
    }

    // Validar que el invitado existe
    let finalGuestId = guestId;
    if (sessionToken && !guestId) {
        const [guestRows] = await db.query(
            'SELECT id FROM table_guests WHERE session_token = ? AND is_active = TRUE',
            [sessionToken]
        );
        
        if (guestRows.length === 0) {
            throw new Error('Sesión de invitado inválida');
        }
        
        finalGuestId = guestRows[0].id;
    }

    // Verificar que el menú item existe y está disponible
    const [itemData] = await db.query(
        'SELECT id, price, available FROM menu_items WHERE id = ?',
        [menu_item_id]
    );

    if (itemData.length === 0) {
        throw new Error('Producto no encontrado');
    }

    if (!itemData[0].available) {
        throw new Error('Producto no disponible');
    }

    const unit_price = itemData[0].price;

    // Buscar si ya existe este item para este invitado en la orden
    const [existing] = await db.query(
        'SELECT id, quantity FROM order_items WHERE order_id = ? AND menu_item_id = ? AND guest_id = ?',
        [order_id, menu_item_id, finalGuestId]
    );

    let itemId, newQuantity;

    if (existing.length > 0) {
        // Actualizar cantidad existente
        const newQty = existing[0].quantity + quantity;
        await db.query(
            'UPDATE order_items SET quantity = ?, subtotal = ? WHERE id = ?',
            [newQty, unit_price * newQty, existing[0].id]
        );
        itemId = existing[0].id;
        newQuantity = newQty;
    } else {
        // Insertar nuevo item
        const [result] = await db.query(`
            INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, status, notes, guest_id)
            VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)
        `, [order_id, menu_item_id, quantity, unit_price, quantity * unit_price, notes || null, finalGuestId]);
        itemId = result.insertId;
        newQuantity = quantity;
    }

    // Recalcular totales del pedido
    await db.query(`
        UPDATE orders 
        SET 
            subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?),
            total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ?)
        WHERE id = ?
    `, [order_id, order_id, order_id]);

    // Obtener total actualizado
    const [updatedOrder] = await db.query('SELECT total FROM orders WHERE id = ?', [order_id]);
    
    // Invalidar cache
    invalidateOrders();
    invalidateKitchen();

    return {
        order_item_id: itemId,
        quantity: newQuantity,
        unit_price,
        subtotal: unit_price * newQuantity,
        order_total: updatedOrder[0]?.total || 0,
        guest_id: finalGuestId
    };
};
