// src/controllers/guest/getMyItems.js
const guestService = require('../../services/guestService');

module.exports = async function getMyItems(payload) {
    const { guestId, sessionToken } = payload;

    if (!guestId || !sessionToken) {
        throw new Error("Los campos 'guestId' y 'sessionToken' son obligatorios");
    }

    return await guestService.getMyItems(guestId, sessionToken);
};
