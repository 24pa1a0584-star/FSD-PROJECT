const express = require('express');
const router = express.Router();
const {
  getGyms,
  getGymById,
  updateGym,
  getCampusDashboardStats,
  getFacilityDashboardStats,
} = require('../controllers/gymController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { authorizeGymScope } = require('../middleware/gymScopeMiddleware');

router.get('/', authenticate, getGyms);
router.get('/campus/dashboard', authenticate, requireRoles('SUPER_ADMIN'), getCampusDashboardStats);
router.get(
  '/:gymId/dashboard',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF', 'TRAINER'),
  authorizeGymScope,
  getFacilityDashboardStats
);
router.get('/:id', authenticate, getGymById);
router.patch('/:id', authenticate, requireRoles('SUPER_ADMIN'), updateGym);

module.exports = router;
