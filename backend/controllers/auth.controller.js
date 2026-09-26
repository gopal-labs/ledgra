const User = require('../models/User');
const { generateToken, generateOTP, getOTPExpiry } = require('../utils/helpers');
const { sendOTPEmail } = require('../utils/mailer');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  const { loginId, email, password } = req.body;

  // Validate required fields
  if (!loginId || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Check uniqueness
  const existingLoginId = await User.findOne({ loginId });
  if (existingLoginId) {
    return res.status(409).json({ success: false, message: 'Login ID is already taken' });
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.status(409).json({ success: false, message: 'Email is already registered' });
  }

  const user = await User.create({ loginId, email, password });

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please log in.',
    data: { id: user._id, loginId: user.loginId, email: user.email, role: user.role },
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ success: false, message: 'Login ID and password are required' });
  }

  const user = await User.findOne({ loginId }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid Login Id or Password' });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Logged in successfully',
    token,
    data: {
      id: user._id,
      loginId: user.loginId,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Send OTP to email for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Security: don't reveal whether email exists
    return res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
  }

  const otp = generateOTP();
  const expiresAt = getOTPExpiry(parseInt(process.env.OTP_EXPIRE_MINUTES, 10) || 10);

  user.otp = { code: otp, expiresAt };
  await user.save({ validateBeforeSave: false });

  try {
    await sendOTPEmail(user.email, otp);
  } catch (err) {
    user.otp = { code: null, expiresAt: null };
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: 'Failed to send OTP email. Try again.' });
  }

  res.json({ success: true, message: 'OTP sent to your registered email address.' });
};

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.otp.code) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  if (user.otp.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  if (user.otp.code !== otp) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP' });
  }

  // Mark OTP as verified (clear code but keep expiry for reset window)
  user.otp.code = 'VERIFIED';
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'OTP verified successfully.' });
};

// @desc    Reset password after OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and new password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.otp.code !== 'VERIFIED' || user.otp.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Session expired. Please start the reset process again.' });
  }

  user.password = password;
  user.otp = { code: null, expiresAt: null };
  await user.save();

  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { signup, login, forgotPassword, verifyOTP, resetPassword, getMe };
