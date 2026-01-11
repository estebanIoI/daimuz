const db = require('../../config/database');

module.exports = async function createTable(payload, req) {
  const { number, capacity } = payload;

  if (!number || !capacity) {
    throw new Error("Los campos 'number' y 'capacity' son requeridos.");
  }

  const [exists] = await db.query('SELECT id FROM tables WHERE number = ?', [number]);
  if (exists.length > 0) {
    throw new Error("Ya existe una mesa con ese número.");
  }

  const [result] = await db.query(
    'INSERT INTO tables (number, capacity, status) VALUES (?, ?, ?)',
    [number, capacity, 'libre']
  );

  return {
    id: result.insertId,
    number,
    capacity,
    status: 'libre',
    current_waiter_id: null
  };
};
