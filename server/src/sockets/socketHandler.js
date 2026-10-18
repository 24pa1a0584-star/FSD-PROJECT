const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');

const initSocketIO = (io) => {
  // Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        (socket.handshake.headers?.cookie &&
          socket.handshake.headers.cookie
            .split('; ')
            .find((row) => row.startsWith('jwt='))
            ?.split('=')[1]);

      if (!token) {
        // Allow anonymous connection for public announcements, but without room authorization
        socket.user = null;
        return next();
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('role assignedGym name email');

      if (user) {
        socket.user = user;
      }
      next();
    } catch (err) {
      console.warn(`[Socket.IO] Auth verification warning: ${err.message}`);
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    if (user) {
      // Room 1: Personal User Room for targeted alerts
      socket.join(`user_${user._id}`);

      // Room 2: Super Admin Global Room
      if (user.role === 'SUPER_ADMIN') {
        socket.join('super_admin');
      }

      // Room 3: Facility-Specific Room (Boys Gym or Girls Gym)
      if (user.assignedGym) {
        socket.join(`gym_${user.assignedGym.toString()}`);
      }
    }

    // Public room for campus-wide alerts
    socket.join('campus_public');

    socket.on('disconnect', () => {
      // Clean up
    });
  });
};

module.exports = { initSocketIO };
