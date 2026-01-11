const db = require('../../config/database');
const { invalidateTables } = require('../../services/cacheService');

module.exports = async function deleteTable(payload, req) {
  const { id } = payload;
  console.log('🗑️ [table.delete] Recibido payload:', payload);
  
  if (!id) throw new Error('ID de mesa requerido');

  // Solo eliminar si la mesa está libre
  const [tables] = await db.query('SELECT id, number, status FROM tables WHERE id = ?', [id]);
  console.log('🔍 [table.delete] Mesa encontrada:', tables);
  
  if (!tables.length) throw new Error('Mesa no encontrada');
  if (tables[0].status !== 'libre') throw new Error('Solo se pueden eliminar mesas libres');

  const [result] = await db.query('DELETE FROM tables WHERE id = ?', [id]);
  console.log('✅ [table.delete] Resultado DELETE:', result);
  
  // Invalidar el caché de mesas para que las siguientes consultas obtengan datos frescos
  invalidateTables();
  console.log('🗑️ [table.delete] Cache de mesas invalidado');
  
  return { success: true, id, affectedRows: result.affectedRows };
}
