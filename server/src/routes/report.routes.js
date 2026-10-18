const express = require('express');
const router = express.Router();
const {
  getAttendanceReports,
  getGymComparisonReport,
  getDepartmentReport,
  getEquipmentReport,
} = require('../controllers/reportController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

router.get(
  '/attendance',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  getAttendanceReports
);
router.get(
  '/gym-comparison',
  authenticate,
  requireRoles('SUPER_ADMIN'),
  getGymComparisonReport
);
router.get(
  '/departments',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  getDepartmentReport
);
router.get(
  '/equipment',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  getEquipmentReport
);

module.exports = router;
