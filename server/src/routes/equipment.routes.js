const express = require('express');
const router = express.Router();
const {
  getEquipment,
  createEquipment,
  updateEquipment,
  reportMaintenance,
  getMaintenanceLogs,
} = require('../controllers/equipmentController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { authorizeGymScope } = require('../middleware/gymScopeMiddleware');

router.get('/', authenticate, authorizeGymScope, getEquipment);
router.post(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  authorizeGymScope,
  createEquipment
);
router.patch(
  '/:id',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER'),
  updateEquipment
);
router.post(
  '/:id/maintenance',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  reportMaintenance
);
router.get(
  '/maintenance/logs',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF'),
  authorizeGymScope,
  getMaintenanceLogs
);

module.exports = router;
