const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getDashboardSummary);

module.exports = router;
