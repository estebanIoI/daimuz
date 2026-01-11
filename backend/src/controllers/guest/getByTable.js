// src/controllers/guest/getByTable.js
const guestService = require('../../services/guestService');

module.exports = async function getByTable(payload) {
    const { tableId } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    return await guestService.getByTable(tableId);
};
