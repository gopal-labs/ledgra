const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMoveHistory } = require('../controllers/move.controller');

router.use(protect);

router.get('/', getMoveHistory);

module.exports = router;
