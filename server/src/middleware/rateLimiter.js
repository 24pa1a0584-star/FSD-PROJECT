const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Limiter for Login and Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// QR Scan rate limiter
const qrLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 scans per minute per staff terminal
  message: {
    success: false,
    message: 'Scanner rate limit exceeded. Please pause scanning for a moment.',
  },
});

module.exports = { apiLimiter, authLimiter, qrLimiter };
