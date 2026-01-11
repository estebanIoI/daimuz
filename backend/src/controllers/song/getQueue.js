// src/controllers/song/getQueue.js
const songService = require('../../services/songService');

module.exports = async function getQueue(payload) {
    const { status } = payload;
    
    return await songService.getQueue(status || null);
};
