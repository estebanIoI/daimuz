// src/controllers/song/getByTable.js
const songService = require('../../services/songService');

module.exports = async function getByTable(payload) {
    const { tableId } = payload;
    
    if (!tableId) {
        throw new Error("El campo 'tableId' es obligatorio");
    }
    
    return await songService.getByTable(tableId);
};
