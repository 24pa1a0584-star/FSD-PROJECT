const express = require('express');
const router = express.Router();
const {
  getWorkoutPlans,
  createWorkoutPlan,
  updateWorkoutPlan,
  getMyWorkoutPlan,
} = require('../controllers/workoutController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

router.get('/my-plan', authenticate, requireRoles('STUDENT'), getMyWorkoutPlan);
router.get('/', authenticate, getWorkoutPlans);
router.post(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'TRAINER'),
  createWorkoutPlan
);
router.put(
  '/:id',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'TRAINER'),
  updateWorkoutPlan
);

module.exports = router;
