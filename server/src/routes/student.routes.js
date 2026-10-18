const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  updateStudent,
} = require('../controllers/studentController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');
const { authorizeGymScope } = require('../middleware/gymScopeMiddleware');

router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'GYM_MANAGER', 'GYM_STAFF', 'TRAINER'),
  authorizeGymScope,
  getStudents
);
router.get('/:id', authenticate, getStudentById);
router.patch('/:id', authenticate, updateStudent);

module.exports = router;
