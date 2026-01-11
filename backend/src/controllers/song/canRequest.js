// src/controllers/song/canRequest.js
const songService = require('../../services/songService');

module.exports = async function canRequest(payload) {
    const { tableId } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    return await songService.canRequestSong(tableId);
};
