const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    application: 'VISHNUFIT Campus Gym Management System',
    institution: 'Vishnu Institute of Technology, Bhimavaram',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStateMap[dbState] || 'Unknown',
      host: mongoose.connection.host || '127.0.0.1',
      name: mongoose.connection.name || 'vishnufit',
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  });
});

module.exports = router;
