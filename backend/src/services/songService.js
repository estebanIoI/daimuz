// src/services/songService.js
const db = require('../config/database');

/**
 * Solicitar una canción
 */
async function requestSong(tableId, guestId, songData) {
    const { songName, artist, songUrl, platform = 'youtube', durationSeconds } = songData;
    
    // Verificar primero si puede solicitar canciones
    const eligibility = await canRequestSong(tableId);
    if (!eligibility.canRequest) {
        throw new Error(`El consumo de la mesa debe ser mínimo $${eligibility.minimumAmount.toLocaleString('es-CO')} COP. Faltan $${eligibility.remaining.toLocaleString('es-CO')} COP.`);
    }
    
    const [result] = await db.query(
        `INSERT INTO song_requests 
         (table_id, guest_id, song_name, artist, song_url, platform, duration_seconds) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tableId, guestId || null, songName, artist || null, songUrl || null, platform, durationSeconds || null]
    );
    
    return {
        id: result.insertId,
        tableId,
        guestId,
        songName,
        artist,
        status: 'pending'
    };
}

/**
 * Obtener cola de canciones
 */
async function getQueue(status = null) {
    let query = `
        SELECT sr.*, 
               g.guest_name, 
               t.number as table_number
        FROM song_requests sr
        LEFT JOIN table_guests g ON sr.guest_id = g.id
        INNER JOIN tables t ON sr.table_id = t.id
    `;
    
    const params = [];
    
    if (status) {
        query += ' WHERE sr.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY sr.requested_at ASC';
    
    const [rows] = await db.query(query, params);
    return rows;
}

/**
 * Obtener canciones pendientes y en reproducción para vista del DJ
 */
async function getActiveQueue() {
    const [rows] = await db.query(`
        SELECT sr.*, 
               g.guest_name, 
               t.number as table_number
        FROM song_requests sr
        LEFT JOIN table_guests g ON sr.guest_id = g.id
        INNER JOIN tables t ON sr.table_id = t.id
        WHERE sr.status IN ('pending', 'playing')
        ORDER BY 
            CASE sr.status 
                WHEN 'playing' THEN 0 
                WHEN 'pending' THEN 1 
            END,
            sr.requested_at ASC
    `);
    
    return rows;
}

/**
 * Obtener canciones de una mesa
 */
async function getByTable(tableId) {
    const [rows] = await db.query(
        `SELECT sr.*, g.guest_name
         FROM song_requests sr
         LEFT JOIN table_guests g ON sr.guest_id = g.id
         WHERE sr.table_id = ?
         ORDER BY sr.requested_at DESC`,
        [tableId]
    );
    
    return rows;
}

/**
 * Actualizar estado de canción
 */
async function updateStatus(songId, status) {
    const validStatuses = ['pending', 'playing', 'played', 'skipped', 'rejected'];
    
    if (!validStatuses.includes(status)) {
        throw new Error('Estado inválido');
    }
    
    // Si se está poniendo en "playing", primero poner las demás "playing" en "played"
    if (status === 'playing') {
        await db.query(
            "UPDATE song_requests SET status = 'played', played_at = NOW() WHERE status = 'playing'"
        );
    }
    
    const playedAt = status === 'played' ? new Date() : null;
    
    await db.query(
        'UPDATE song_requests SET status = ?, played_at = COALESCE(?, played_at) WHERE id = ?',
        [status, playedAt, songId]
    );
    
    // Obtener la canción actualizada
    const [rows] = await db.query(
        `SELECT sr.*, g.guest_name, t.number as table_number
         FROM song_requests sr
         LEFT JOIN table_guests g ON sr.guest_id = g.id
         INNER JOIN tables t ON sr.table_id = t.id
         WHERE sr.id = ?`,
        [songId]
    );
    
    return rows[0] || { id: songId, status };
}

/**
 * Verificar si una mesa puede solicitar canciones
 */
async function canRequestSong(tableId) {
    // Obtener monto mínimo de configuración
    const [settings] = await db.query(
        'SELECT setting_value FROM settings WHERE setting_key = ?',
        ['song_minimum_amount']
    );
    
    const minimumAmount = parseFloat(settings[0]?.setting_value || 600000);
    
    // Solo contar órdenes ACTIVAS de la mesa actual
    // Las órdenes cerradas pertenecen a clientes anteriores que ya pagaron
    const [totals] = await db.query(
        `SELECT COALESCE(SUM(o.total), 0) as table_total
         FROM orders o
         WHERE o.table_id = ? 
         AND o.status = 'activo'`,
        [tableId]
    );
    
    const tableTotal = parseFloat(totals[0]?.table_total || 0);
    
    return {
        canRequest: tableTotal >= minimumAmount,
        tableTotal,
        minimumAmount,
        remaining: Math.max(0, minimumAmount - tableTotal)
    };
}

/**
 * Obtener estadísticas de canciones del día
 */
async function getDailyStats() {
    const [stats] = await db.query(`
        SELECT 
            COUNT(*) as total_requests,
            SUM(CASE WHEN status = 'played' THEN 1 ELSE 0 END) as played,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'playing' THEN 1 ELSE 0 END) as playing,
            SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM song_requests
        WHERE DATE(requested_at) = CURDATE()
    `);
    
    return stats[0];
}

module.exports = {
    requestSong,
    getQueue,
    getActiveQueue,
    getByTable,
    updateStatus,
    canRequestSong,
    getDailyStats
};
