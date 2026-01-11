// src/controllers/menu/getPublic.js
// Endpoint público para obtener el menú (sin autenticación)
const db = require('../../config/database');

module.exports = async function getPublic(payload) {
    const [items] = await db.query(`
        SELECT 
            mi.id,
            mi.name,
            mi.description,
            mi.price,
            mi.category_id,
            c.name as category_name,
            mi.image_url,
            mi.available,
            mi.preparation_time
        FROM menu_items mi
        LEFT JOIN categories c ON mi.category_id = c.id
        WHERE mi.available = TRUE
        ORDER BY c.name, mi.name
    `);
    
    return items;
};
