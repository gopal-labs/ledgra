const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAdjustments,
  getSystemStock,
  getAdjustmentById,
  createAdjustment,
  validateAdjustment,
} = require('../controllers/adjustment.controller');

router.use(protect);

router.get('/stock-level', getSystemStock);

router.route('/')
  .get(getAdjustments)
  .post(createAdjustment);

router.route('/:id')
  .get(getAdjustmentById);

router.put('/:id/validate', validateAdjustment);

module.exports = router;
