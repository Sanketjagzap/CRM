let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) {
    return;
  }

  ioInstance.to(`user:${userId}`).emit(event, payload);
}

module.exports = { setSocketIO, emitToUser };