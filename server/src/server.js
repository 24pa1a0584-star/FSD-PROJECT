require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocketIO } = require('./sockets/socketHandler');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0';
const clientUrl = process.env.CLIENT_URL;

const server = http.createServer(app);

// Allowed origins for Socket.IO
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];
if (clientUrl) {
  allowedOrigins.push(clientUrl);
}

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow same-origin, whitelist, or any origin in production single-service mode
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
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
    server.listen(PORT, HOST, () => {
      console.log(`=======================================================`);
      console.log(`🚀 VISHNUFIT Server Started Successfully`);
      console.log(`🏛️ Vishnu Institute of Technology, Bhimavaram`);
      console.log(`📡 URL:            http://${HOST}:${PORT}`);
      console.log(`🩺 Health Check:   http://${HOST}:${PORT}/api/health`);
      console.log(`⚡ Socket.IO:      Active on ws://${HOST}:${PORT}`);
      console.log(`🌍 Environment:    ${process.env.NODE_ENV || 'development'}`);
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
