// src/controllers/song/getActiveQueue.js
const songService = require('../../services/songService');

module.exports = async function getActiveQueue(payload) {
    return await songService.getActiveQueue();
};
