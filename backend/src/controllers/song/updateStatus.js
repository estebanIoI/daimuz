// src/controllers/song/updateStatus.js
const songService = require('../../services/songService');

module.exports = async function updateStatus(payload) {
    const { songId, status } = payload;
    
    if (!songId) {
        throw new Error("El campo 'songId' es obligatorio");
    }
    
    if (!status) {
        throw new Error("El campo 'status' es obligatorio");
    }
    
    return await songService.updateStatus(songId, status);
};
