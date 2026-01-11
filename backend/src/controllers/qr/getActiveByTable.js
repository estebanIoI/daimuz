// src/controllers/qr/getActiveByTable.js
const qrService = require('../../services/qrService');

module.exports = async function getActiveByTable(payload) {
    const { tableId } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    return await qrService.getActiveByTable(tableId);
};
