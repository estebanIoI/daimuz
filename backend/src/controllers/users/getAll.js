const db = require('../../config/database');

module.exports = async function getAll(_, req) {
  const [users] = await db.query(`
    SELECT id, name, email, role, active, last_login AS lastLogin
    FROM users
  `);

  return users;
};
