const db = require('../../config/database');

module.exports = async function getAllSettings(_, req) {
  const [rows] = await db.query(`
    SELECT setting_key, setting_value FROM settings
  `);

  const settings = {};
  for (const row of rows) {
    settings[row.name] = row.value;
  }

  return settings;
};
