// src/controllers/song/request.js
const songService = require('../../services/songService');

module.exports = async function requestSong(payload) {
    const { tableId, guestId, songData } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    if (!songData || !songData.songName) {
        throw new Error("El campo 'songData.songName' es obligatorio");
    }
    
    return await songService.requestSong(tableId, guestId || null, songData);
};
