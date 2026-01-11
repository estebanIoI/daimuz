require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { setupSocket } = require('./src/config/socket');
const logger = require('./src/utils/logger');
const db = require('./src/config/database');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
setupSocket(server);

(async () => {
  try {
    await db.query('SELECT 1');
    console.log('🟢 Conexión a base de datos exitosa');
  } catch (err) {
    console.error('🔴 Error al conectar BD', err);
  }
})();

server.listen(PORT, () => {
  logger.info(`Servidor Sirius escuchando en puerto ${PORT}`);
});
