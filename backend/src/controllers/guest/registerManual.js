// src/controllers/guest/registerManual.js
// Registrar un invitado manualmente (sin QR) - usado por meseros
const crypto = require('crypto');
const db = require('../../config/database');

module.exports = async function registerManualGuest(payload, req) {
    const { tableId, guestName, phone } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    if (!guestName || guestName.trim() === '') {
        throw new Error("El campo 'guestName' es obligatorio");
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Verificar que la mesa existe
        const [tableRows] = await connection.query(
            'SELECT id, number FROM tables WHERE id = ?',
            [tableId]
        );
        
        if (tableRows.length === 0) {
            throw new Error('Mesa no encontrada');
        }
        
        const table = tableRows[0];
        
        // Buscar o crear un código QR activo para la mesa (para asociar al invitado)
        let qrCodeId = null;
        const [existingQR] = await connection.query(
            `SELECT id FROM table_qr_codes 
             WHERE table_id = ? 
             AND is_active = TRUE 
             AND expires_at > NOW()
             LIMIT 1`,
            [tableId]
        );
        
        if (existingQR.length > 0) {
            qrCodeId = existingQR[0].id;
        } else {
            // Crear un QR temporal para el invitado manual
            const qrToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
            
            const [qrResult] = await connection.query(
                `INSERT INTO table_qr_codes (table_id, qr_token, expires_at, is_active, qr_url)
                 VALUES (?, ?, ?, TRUE, ?)`,
                [tableId, qrToken, expiresAt, `manual-guest-${qrToken}`]
            );
            qrCodeId = qrResult.insertId;
        }
        
        // Generar token de sesión para el invitado
        const sessionToken = crypto.randomBytes(32).toString('hex');
        
        // Insertar el invitado
        const [result] = await connection.query(
            `INSERT INTO table_guests (table_id, qr_code_id, guest_name, session_token, phone) 
             VALUES (?, ?, ?, ?, ?)`,
            [tableId, qrCodeId, guestName.trim(), sessionToken, phone || null]
        );
        
        await connection.commit();
        
        console.log(`✅ Invitado manual registrado: ${guestName} en mesa ${table.number}`);
        
        return {
            success: true,
            guestId: result.insertId,
            sessionToken,
            tableId: tableId,
            tableNumber: table.number,
            guestName: guestName.trim(),
            message: `Invitado "${guestName.trim()}" agregado a la mesa ${table.number}`
        };
        
    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar invitado manual:', error);
        throw error;
    } finally {
        connection.release();
    }
};
