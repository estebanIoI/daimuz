const db = require('../../config/database');

module.exports = async function getNextTableNumber(_, req) {
  try {
    // Obtener el número más alto de mesa actual
    const [result] = await db.query('SELECT MAX(number) as maxNumber FROM tables');
    const maxNumber = result[0]?.maxNumber || 0;
    
    // El próximo número disponible es maxNumber + 1
    const nextNumber = maxNumber + 1;
    
    return {
      nextNumber: nextNumber,
      maxExisting: maxNumber
    };
  } catch (error) {
    console.error('Error obteniendo próximo número de mesa:', error);
    throw new Error('Error al obtener próximo número de mesa disponible');
  }
};