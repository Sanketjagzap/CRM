const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { env } = require('./env');
const { setSocketIO } = require('../services/socket.service');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    try {
      socket.user = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (error) {
      socket.user = null;
    }

    return next();
  });

  io.on('connection', (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }
  });

  setSocketIO(io);
  return io;
}

module.exports = { initSocket };