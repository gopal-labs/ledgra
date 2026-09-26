const express = require('express');
const router = express.Router();

// @route   GET /api/health
// @desc    Server health check
// @access  Public
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    service: 'Ledgra API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

module.exports = router;
