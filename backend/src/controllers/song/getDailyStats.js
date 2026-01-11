// src/controllers/song/getDailyStats.js
const songService = require('../../services/songService');

module.exports = async function getDailyStats(payload) {
    return await songService.getDailyStats();
};
