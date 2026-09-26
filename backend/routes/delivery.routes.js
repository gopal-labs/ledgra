const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  reserveStock,
  validateDelivery,
  cancelDelivery,
} = require('../controllers/delivery.controller');

router.use(protect);

router.route('/')
  .get(getDeliveries)
  .post(createDelivery);

router.route('/:id')
  .get(getDeliveryById)
  .put(updateDelivery);

router.put('/:id/reserve', reserveStock);
router.put('/:id/validate', validateDelivery);
router.put('/:id/cancel', cancelDelivery);

module.exports = router;
