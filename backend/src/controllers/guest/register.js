// src/controllers/guest/register.js
const guestService = require('../../services/guestService');

module.exports = async function registerGuest(payload) {
    const { qrToken, guestName, phone } = payload;
    
    if (!qrToken) {
        throw new Error("El campo 'qrToken' es obligatorio");
    }
    
    if (!guestName || guestName.trim() === '') {
        throw new Error("El campo 'guestName' es obligatorio");
    }
    
    return await guestService.registerGuest(qrToken, guestName.trim(), phone || null);
};
