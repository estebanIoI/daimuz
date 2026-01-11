const db = require('../../config/database');

module.exports = async function updateSettings(payload, req) {
  const keys = Object.keys(payload);

  if (keys.length === 0) {
    throw new Error("No se enviaron configuraciones para actualizar.");
  }

  for (const key of keys) {
    const setting_value = payload[key];
    await db.query(`
      INSERT INTO settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [key, setting_value]);
  }

  return { message: 'Configuración actualizada exitosamente.' };
};

