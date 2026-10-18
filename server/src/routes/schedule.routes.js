const express = require('express');
const router = express.Router();
const { getSchedules, updateSchedule } = require('../controllers/scheduleController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

router.get('/', authenticate, getSchedules);
router.patch('/:id', authenticate, requireRoles('SUPER_ADMIN', 'GYM_MANAGER'), updateSchedule);

module.exports = router;
