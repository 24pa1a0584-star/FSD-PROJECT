require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocketIO } = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
initSocketIO(io);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 VISHNUFIT Backend Server Started Successfully`);
      console.log(`🏛️ Vishnu Institute of Technology, Bhimavaram`);
      console.log(`📡 REST API:       http://localhost:${PORT}/api`);
      console.log(`🩺 Health Check:   http://localhost:${PORT}/api/health`);
      console.log(`⚡ Socket.IO:      Active on ws://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error(`Fatal: Failed to bootstrap server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down VISHNUFIT server gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
