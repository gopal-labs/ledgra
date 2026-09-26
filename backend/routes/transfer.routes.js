const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  validateTransfer,
  cancelTransfer,
} = require('../controllers/transfer.controller');

router.use(protect);

router.route('/')
  .get(getTransfers)
  .post(createTransfer);

router.route('/:id')
  .get(getTransferById)
  .put(updateTransfer);

router.put('/:id/validate', validateTransfer);
router.put('/:id/cancel', cancelTransfer);

module.exports = router;
