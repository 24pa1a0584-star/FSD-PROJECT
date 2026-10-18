const express = require('express');
const router = express.Router();
const {
  getTrainers,
  createTrainer,
  updateTrainer,
  assignTrainer,
  getAssignedStudents,
} = require('../controllers/trainerController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

router.get('/', authenticate, getTrainers);
router.post('/', authenticate, requireRoles('SUPER_ADMIN', 'GYM_MANAGER'), createTrainer);
router.patch('/:id', authenticate, requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'TRAINER'), updateTrainer);
router.post('/assign', authenticate, requireRoles('SUPER_ADMIN', 'GYM_MANAGER'), assignTrainer);
router.get('/:trainerId/students', authenticate, getAssignedStudents);

module.exports = router;
