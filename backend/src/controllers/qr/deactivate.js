// src/controllers/qr/deactivate.js
const qrService = require('../../services/qrService');

module.exports = async function deactivateQR(payload) {
    const { tableId } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    return await qrService.deactivateQR(tableId);
};
