const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
