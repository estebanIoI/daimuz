// src/controllers/orders/createGuest.js
// Crear orden desde cliente/invitado
const db = require('../../config/database');
const { invalidateOrders, invalidateKitchen } = require('../../services/cacheService');

module.exports = async function createGuest(payload) {
    const { tableId, guestId, sessionToken, notes } = payload;

    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }

    if (!guestId && !sessionToken) {
        throw new Error("Se requiere 'guestId' o 'sessionToken'");
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Si se proporciona sessionToken, obtener el guestId
        let finalGuestId = guestId;
        if (sessionToken && !guestId) {
            const [guestRows] = await connection.query(
                'SELECT id, table_id FROM table_guests WHERE session_token = ? AND is_active = TRUE',
                [sessionToken]
            );
            
            if (guestRows.length === 0) {
                throw new Error('Sesión de invitado inválida');
            }
            
            finalGuestId = guestRows[0].id;
            
            // Verificar que el tableId coincide
            if (guestRows[0].table_id !== tableId) {
                throw new Error('El invitado no pertenece a esta mesa');
            }
        }

        // Buscar si hay un mesero asignado a la mesa (o usar el del QR)
        const [qrRows] = await connection.query(
            `SELECT tqc.created_by as waiter_id
             FROM table_guests tg
             INNER JOIN table_qr_codes tqc ON tg.qr_code_id = tqc.id
             WHERE tg.id = ?`,
            [finalGuestId]
        );
        
        const waiterId = qrRows[0]?.waiter_id || 1; // Fallback a usuario 1 si no hay mesero

        // Buscar orden activa de la mesa
        const [existingOrders] = await connection.query(
            "SELECT id FROM orders WHERE table_id = ? AND status = 'activo'",
            [tableId]
        );

        let orderId;

        if (existingOrders.length > 0) {
            // Usar orden existente
            orderId = existingOrders[0].id;
        } else {
            // Crear nueva orden
            const [result] = await connection.query(
                `INSERT INTO orders (table_id, waiter_id, guest_id, status, notes, subtotal, tax_amount, total) 
                 VALUES (?, ?, ?, 'activo', ?, 0, 0, 0)`,
                [tableId, waiterId, finalGuestId, notes || null]
            );
            orderId = result.insertId;

            // Actualizar estado de la mesa a ocupada
            await connection.query(
                'UPDATE tables SET status = "ocupada", current_waiter_id = ? WHERE id = ?',
                [waiterId, tableId]
            );
        }

        await connection.commit();

        // Invalidar cache
        invalidateOrders();
        invalidateKitchen();

        return {
            order_id: orderId,
            table_id: tableId,
            guest_id: finalGuestId,
            waiter_id: waiterId,
            status: 'activo'
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
