const { Server } = require('socket.io');
const setupOrderSocket = require('../sockets/orderSocket');

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });
  setupOrderSocket(io);
}

module.exports = { setupSocket };
