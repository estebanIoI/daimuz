// src/controllers/categories/getPublic.js
// Endpoint público para obtener categorías (sin autenticación)
const db = require('../../config/database');

module.exports = async function getPublic(payload) {
    const [categories] = await db.query(`
        SELECT id, name, description, active
        FROM categories
        WHERE active = TRUE
        ORDER BY name
    `);
    
    return categories;
};
