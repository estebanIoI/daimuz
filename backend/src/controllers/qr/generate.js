// src/controllers/qr/generate.js
const qrService = require('../../services/qrService');

module.exports = async function generateQR(payload, req) {
    const { tableId } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    // Usar el ID del usuario autenticado como creador
    const waiterId = req.user?.id;
    
    if (!waiterId) {
        throw new Error("Usuario no autenticado");
    }
    
    return await qrService.generateQR(tableId, waiterId);
};
