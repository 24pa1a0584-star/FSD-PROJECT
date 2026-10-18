const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { authenticate, requireRoles } = require('../middleware/authMiddleware');

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, requireRoles('SUPER_ADMIN', 'GYM_MANAGER'), createAnnouncement);
router.delete('/:id', authenticate, requireRoles('SUPER_ADMIN', 'GYM_MANAGER'), deleteAnnouncement);

module.exports = router;
