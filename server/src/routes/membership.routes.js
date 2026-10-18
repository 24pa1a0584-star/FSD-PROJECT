const express = require('express');
const router = express.Router();
const {
  getMembershipTypes,
  getMemberships,
  getMyCard,
  renewMembership,
  updateMembershipStatus,
} = require('../controllers/membershipController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { authorizeGymScope } = require('../middleware/gymScopeMiddleware');

router.get('/types', getMembershipTypes);
router.get('/my-card', authenticate, requireRoles('STUDENT'), getMyCard);
router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  authorizeGymScope,
  getMemberships
);
router.patch(
  '/:id/renew',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  renewMembership
);
router.patch(
  '/:id/status',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  updateMembershipStatus
);

module.exports = router;
