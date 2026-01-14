const { Server } = require('socket.io');
const setupOrderSocket = require('../sockets/orderSocket');

function setupSocket(server) {
  const allowedOrigins = [
    'https://daimuz.me',
    'https://www.daimuz.me',
    'https://sea-lion-app-vqb5u.ondigitalocean.app',
    process.env.SOCKET_CORS_ORIGIN,
    'http://localhost:3000',
    'http://localhost:3001'
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  setupOrderSocket(io);
}

module.exports = { setupSocket };
