// src/controllers/qr/validate.js
const qrService = require('../../services/qrService');

module.exports = async function validateQR(payload) {
    const { qrToken } = payload;
    
    if (!qrToken) {
        throw new Error("El campo 'qrToken' es obligatorio");
    }
    
    return await qrService.validateQR(qrToken);
};
