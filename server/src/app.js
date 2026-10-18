const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const gymRoutes = require('./routes/gym.routes');
const studentRoutes = require('./routes/student.routes');
const registrationRoutes = require('./routes/registration.routes');
const membershipRoutes = require('./routes/membership.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const trainerRoutes = require('./routes/trainer.routes');
const workoutRoutes = require('./routes/workout.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const announcementRoutes = require('./routes/announcement.routes');
const notificationRoutes = require('./routes/notification.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// Trust proxy for secure cookies behind reverse proxies (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const clientUrl = process.env.CLIENT_URL;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];
if (clientUrl) {
  allowedOrigins.push(clientUrl);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // In same-origin production or mobile/curl/postman requests, origin is undefined
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter
app.use('/api', apiLimiter);

// API Route Mounts
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// In production, serve the compiled React SPA from client/dist
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  // SPA fallback for React Router routes (excluding /api routes)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error Handling (handles unmatched /api routes and uncaught errors)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
