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
 */
async function getSessionInfo(sessionToken) {
    const [rows] = await db.query(
        `SELECT g.*, t.number as table_number, t.capacity,
                qc.qr_url, qc.qr_token
         FROM table_guests g
         INNER JOIN tables t ON g.table_id = t.id
         INNER JOIN table_qr_codes qc ON g.qr_code_id = qc.id
         WHERE g.session_token = ? 
         AND g.is_active = TRUE
         AND qc.is_active = TRUE
         AND qc.expires_at > NOW()`,
        [sessionToken]
    );
    
    if (rows.length === 0) {
        throw new Error('Sesión inválida o expirada');
    }
    
    // Actualizar última actividad
    await db.query(
        'UPDATE table_guests SET last_activity = NOW() WHERE session_token = ?',
        [sessionToken]
    );
    
    return rows[0];
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
    updateActivity,
    deactivateGuest
};
