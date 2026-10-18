const express = require('express');
const router = express.Router();
const {
  manualCheckIn,
  manualCheckOut,
  generateStudentQrToken,
  scanQrToken,
  getAttendanceLogs,
  getTodaySummary,
  getMyAttendanceHistory,
} = require('../controllers/attendanceController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { authorizeGymScope } = require('../middleware/gymScopeMiddleware');
const { qrLimiter } = require('../middleware/rateLimiter');

router.post(
  '/check-in',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  authorizeGymScope,
  manualCheckIn
);

router.post(
  '/check-out',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  authorizeGymScope,
  manualCheckOut
);

router.post('/qr-token', authenticate, requireRoles('STUDENT'), generateStudentQrToken);

router.post(
  '/qr-scan',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  qrLimiter,
  scanQrToken
);

router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  authorizeGymScope,
  getAttendanceLogs
);

router.get('/today-summary', authenticate, getTodaySummary);
router.get('/my-history', authenticate, requireRoles('STUDENT'), getMyAttendanceHistory);

module.exports = router;
