// src/controllers/guest/getSessionInfo.js
const guestService = require('../../services/guestService');

module.exports = async function getSessionInfo(payload) {
    const { sessionToken } = payload;
    
    if (!sessionToken) {
        throw new Error("El campo 'sessionToken' es obligatorio");
    }
    
    return await guestService.getSessionInfo(sessionToken);
};
