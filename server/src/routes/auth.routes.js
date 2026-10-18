const express = require('express');
const router = express.Router();
const {
  login,
  registerStudent,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, registerStudent);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/update-profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;
