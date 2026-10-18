const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getUserNotifications);
router.patch('/:id/read', authenticate, markAsRead);

module.exports = router;
