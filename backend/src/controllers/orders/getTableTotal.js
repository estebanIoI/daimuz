// src/controllers/orders/getTableTotal.js
// Obtener el total acumulado de consumo de una mesa
const db = require('../../config/database');

module.exports = async function getTableTotal(payload) {
    const { tableId } = payload;

    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }

    // Solo contar órdenes ACTIVAS de la mesa actual
    // Las órdenes cerradas pertenecen a clientes anteriores que ya pagaron
    const [rows] = await db.query(
        `SELECT 
            COALESCE(SUM(o.total), 0) as accumulated_total,
            COUNT(DISTINCT o.id) as total_orders,
            COUNT(DISTINCT o.guest_id) as total_guests
         FROM orders o
         WHERE o.table_id = ? 
         AND o.status = 'activo'`,
        [tableId]
    );

    return rows[0] || { accumulated_total: 0, total_orders: 0, total_guests: 0 };
};
