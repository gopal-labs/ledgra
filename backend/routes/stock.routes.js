const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getConsolidatedStock, getLowStockAlerts } = require('../controllers/stock.controller');

router.use(protect);

router.get('/', getConsolidatedStock);
router.get('/low-stock', getLowStockAlerts);

module.exports = router;
