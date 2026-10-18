const express = require('express');
const router = express.Router();
const {
  submitRegistration,
  getRegistrations,
  getMyRegistrations,
  approveRegistration,
  rejectRegistration,
} = require('../controllers/registrationController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { authorizeGymScope } = require('../middleware/gymScopeMiddleware');

router.post('/', authenticate, requireRoles('STUDENT'), submitRegistration);
router.get('/my', authenticate, requireRoles('STUDENT'), getMyRegistrations);
router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  authorizeGymScope,
  getRegistrations
);
router.patch(
  '/:id/approve',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  approveRegistration
);
router.patch(
  '/:id/reject',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  rejectRegistration
);

module.exports = router;
