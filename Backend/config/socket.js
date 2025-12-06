const { Server } = require('socket.io');
const { setSocketIO } = require('../controllers/notificationController');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Set socket.io instance in notification controller
  setSocketIO(io);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room based on user type
    socket.on('join:room', (data) => {
      const { userType, userId } = data;
      
      // Join user-specific room
      if (userId) {
        socket.join(`user:${userId}`);
      }

      // Join type-specific room
      if (userType) {
        socket.join(userType);
        console.log(`User ${socket.id} joined room: ${userType}`);
      }
    });

    // Leave room
    socket.on('leave:room', (data) => {
      const { userType, userId } = data;
      
      if (userId) {
        socket.leave(`user:${userId}`);
      }
      
      if (userType) {
        socket.leave(userType);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };


