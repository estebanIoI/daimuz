// src/services/qrService.js
const crypto = require('crypto');
const db = require('../config/database');
const QRCode = require('qrcode');

/**
 * Genera un código QR único para una mesa
 */
async function generateQR(tableId, waiterId) {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Desactivar QRs anteriores de la mesa
        await connection.query(
            'UPDATE table_qr_codes SET is_active = FALSE WHERE table_id = ? AND is_active = TRUE',
            [tableId]
        );
        
        // Generar token único
        const qrToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
        
        // Obtener URL del frontend - prioridad: variable de entorno > settings > default
        let baseUrl = 'http://localhost:3000';
        
        // Primero intentar obtener de settings
        try {
            const [settings] = await connection.query(
                'SELECT setting_value FROM settings WHERE setting_key = ?',
                ['frontend_url']
            );
            if (settings.length > 0 && settings[0].setting_value) {
                baseUrl = settings[0].setting_value;
            }
        } catch (e) {
            console.log('Using default frontend URL');
        }
        
        // Variable de entorno tiene prioridad sobre settings
        if (process.env.FRONTEND_URL) {
            baseUrl = process.env.FRONTEND_URL;
        }
        
        const qrUrl = `${baseUrl}/cliente/${qrToken}`;
        
        // Insertar nuevo QR
        const [result] = await connection.query(
            `INSERT INTO table_qr_codes (table_id, qr_token, qr_url, created_by, expires_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [tableId, qrToken, qrUrl, waiterId, expiresAt]
        );
        
        // Generar imagen QR
        const qrImage = await QRCode.toDataURL(qrUrl, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        await connection.commit();
        
        return {
            id: result.insertId,
            qrToken,
            qrUrl,
            qrImage,
            tableId,
            expiresAt
        };
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Valida un token QR
 */
async function validateQR(qrToken) {
    const [rows] = await db.query(
        `SELECT qc.*, t.number as table_number, t.capacity 
         FROM table_qr_codes qc
         INNER JOIN tables t ON qc.table_id = t.id
         WHERE qc.qr_token = ? 
         AND qc.is_active = TRUE 
         AND qc.expires_at > NOW()`,
        [qrToken]
    );
    
    if (rows.length === 0) {
        throw new Error('QR inválido o expirado');
    }
    
    return rows[0];
}

/**
 * Obtener QR activo de una mesa
 */
async function getActiveByTable(tableId) {
    const [rows] = await db.query(
        `SELECT * FROM table_qr_codes 
         WHERE table_id = ? 
         AND is_active = TRUE 
         AND expires_at > NOW()
         ORDER BY created_at DESC 
         LIMIT 1`,
        [tableId]
    );
    
    if (rows.length === 0) {
        return null;
    }
    
    // Regenerar imagen QR para el código activo
    const qrImage = await QRCode.toDataURL(rows[0].qr_url, {
        width: 400,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });
    
    return {
        ...rows[0],
        qrImage
    };
}

/**
 * Desactivar QR (cuando se cierra la mesa)
 */
async function deactivateQR(tableId) {
    // Desactivar todos los invitados activos de la mesa
    await db.query(
        'UPDATE table_guests SET is_active = FALSE WHERE table_id = ?',
        [tableId]
    );
    
    // Desactivar el QR
    await db.query(
        'UPDATE table_qr_codes SET is_active = FALSE WHERE table_id = ?',
        [tableId]
    );
    
    return { success: true };
}

module.exports = {
    generateQR,
    validateQR,
    getActiveByTable,
    deactivateQR
};
