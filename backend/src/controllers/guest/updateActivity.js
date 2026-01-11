// src/controllers/guest/updateActivity.js
const guestService = require('../../services/guestService');

module.exports = async function updateActivity(payload) {
    const { sessionToken } = payload;
    
    if (!sessionToken) {
        throw new Error("El campo 'sessionToken' es obligatorio");
    }
    
    return await guestService.updateActivity(sessionToken);
};
