const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vishnufit';
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Runtime Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Warning: Database connection disconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial Connection Failed to ${maskedUri}: ${error.message}`);
    console.error('If using MongoDB Atlas: Verify your MONGODB_URI password, database user, and Network Access IP whitelist (0.0.0.0/0).');
    console.error('If running locally: Verify MongoDB service is active on port 27017.');
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed gracefully.');
  } catch (err) {
    console.error(`[MongoDB] Error closing connection: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
