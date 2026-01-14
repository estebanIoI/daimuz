// src/services/guestService.js
const crypto = require('crypto');
const db = require('../config/database');

/**
 * Registrar un nuevo invitado
 */
async function registerGuest(qrToken, guestName, phone = null) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Validar QR
        const [qrRows] = await connection.query(
            `SELECT * FROM table_qr_codes 
             WHERE qr_token = ? 
             AND is_active = TRUE 
             AND expires_at > NOW()`,
            [qrToken]
        );

        if (qrRows.length === 0) {
            throw new Error('QR inválido o expirado');
        }

        const qrCode = qrRows[0];

        // Generar token de sesión
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // Insertar invitado
        const [result] = await connection.query(
            `INSERT INTO table_guests (table_id, qr_code_id, guest_name, session_token, phone) 
             VALUES (?, ?, ?, ?, ?)`,
            [qrCode.table_id, qrCode.id, guestName, sessionToken, phone]
        );

        await connection.commit();

        // Obtener número de mesa
        const [tableInfo] = await db.query(
            'SELECT number FROM tables WHERE id = ?',
            [qrCode.table_id]
        );

        return {
            guestId: result.insertId,
            sessionToken,
            tableId: qrCode.table_id,
            tableNumber: tableInfo[0]?.number,
            guestName
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Obtener información de sesión del invitado
 * Retorna is_active para que el frontend sepa si la sesión sigue válida
 */
async function getSessionInfo(sessionToken) {
    // Primero buscar el guest sin importar si está activo
    const [guestRows] = await db.query(
        `SELECT g.id, g.guest_name, g.table_id, g.is_active, g.qr_code_id
         FROM table_guests g
         WHERE g.session_token = ?`,
        [sessionToken]
    );

    if (guestRows.length === 0) {
        throw new Error('Sesión inválida o expirada');
    }

    const guest = guestRows[0];

    // Si el guest no está activo, retornar con is_active = false y buscar su última factura
    if (!guest.is_active) {
        const [tableInfo] = await db.query(
            'SELECT number FROM tables WHERE id = ?',
            [guest.table_id]
        );

        // Buscar última factura de este invitado
        const [invoiceRows] = await db.query(
            `SELECT invoice_number, total, items, created_at 
             FROM invoices 
             WHERE notes LIKE ? 
             ORDER BY created_at DESC LIMIT 1`,
            [`%Pago individual de: ${guest.guest_name}%`]
        );

        return {
            id: guest.id,
            guest_name: guest.guest_name,
            table_id: guest.table_id,
            table_number: tableInfo[0]?.number || 0,
            is_active: false,
            session_closed: true,
            invoice: invoiceRows[0] || null
        };
    }

    // Si está activo, obtener toda la información
    const [rows] = await db.query(
        `SELECT g.*, t.number as table_number, t.capacity,
                qc.qr_url, qc.qr_token,
                (SELECT id FROM orders WHERE table_id = g.table_id AND status = 'activo' LIMIT 1) as active_order_id
         FROM table_guests g
         INNER JOIN tables t ON g.table_id = t.id
         INNER JOIN table_qr_codes qc ON g.qr_code_id = qc.id
         WHERE g.session_token = ? 
         AND g.is_active = TRUE`,
        [sessionToken]
    );

    if (rows.length === 0) {
        // El guest está activo pero el QR expiró
        const [tableInfo] = await db.query(
            'SELECT number FROM tables WHERE id = ?',
            [guest.table_id]
        );
        return {
            id: guest.id,
            guest_name: guest.guest_name,
            table_id: guest.table_id,
            table_number: tableInfo[0]?.number || 0,
            is_active: false,
            session_closed: true
        };
    }

    // Actualizar última actividad
    await db.query(
        'UPDATE table_guests SET last_activity = NOW() WHERE session_token = ?',
        [sessionToken]
    );

    return {
        ...rows[0],
        is_active: true
    };
}

/**
 * Obtener los items del pedido de un invitado específico
 */
async function getMyItems(guestId, sessionToken) {
    // Validar sesión
    const [guestRows] = await db.query(
        `SELECT g.id, g.table_id, g.is_active
         FROM table_guests g
         WHERE g.id = ? AND g.session_token = ?`,
        [guestId, sessionToken]
    );

    if (guestRows.length === 0) {
        throw new Error('Sesión inválida');
    }

    const guest = guestRows[0];

    // Si el guest no está activo, la sesión fue cerrada (pagó)
    if (!guest.is_active) {
        return {
            items: [],
            total: 0,
            session_closed: true
        };
    }

    // Obtener items del invitado
    const [items] = await db.query(
        `SELECT 
            oi.id as order_item_id,
            oi.quantity,
            oi.unit_price,
            oi.subtotal,
            oi.notes,
            oi.status as item_status,
            m.name as menu_item_name,
            m.description,
            m.image_url,
            c.name as category_name
         FROM order_items oi
         INNER JOIN menu_items m ON oi.menu_item_id = m.id
         INNER JOIN categories c ON m.category_id = c.id
         WHERE oi.guest_id = ?
         ORDER BY oi.created_at DESC`,
        [guestId]
    );

    // Calcular total
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    return {
        items,
        total,
        session_closed: false
    };
}

/**
 * Obtener todos los invitados de una mesa
 */
async function getByTable(tableId) {
    const [rows] = await db.query(
        `SELECT g.*, 
                COUNT(DISTINCT oi.id) as order_count,
                COALESCE(SUM(oi.subtotal), 0) as total_spent
         FROM table_guests g
         LEFT JOIN order_items oi ON g.id = oi.guest_id
         WHERE g.table_id = ? 
         AND g.is_active = TRUE
         GROUP BY g.id
         ORDER BY g.joined_at ASC`,
        [tableId]
    );

    return rows;
}

/**
 * Actualizar actividad del invitado
 */
async function updateActivity(sessionToken) {
    const [result] = await db.query(
        'UPDATE table_guests SET last_activity = NOW() WHERE session_token = ? AND is_active = TRUE',
        [sessionToken]
    );

    if (result.affectedRows === 0) {
        throw new Error('Sesión no encontrada');
    }

    return { success: true };
}

/**
 * Desactivar invitado
 */
async function deactivateGuest(guestId) {
    await db.query(
        'UPDATE table_guests SET is_active = FALSE WHERE id = ?',
        [guestId]
    );

    return { success: true };
}

module.exports = {
    registerGuest,
    getSessionInfo,
    getByTable,
    getMyItems,
    updateActivity,
    deactivateGuest
};

