const express = require('express');
const router = express.Router();
const {
  getReceipts, getReceipt, createReceipt, updateReceipt, validateReceipt, cancelReceipt
} = require('../controllers/receipt.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getReceipts);
router.post('/', createReceipt);
router.get('/:id', getReceipt);
router.patch('/:id', updateReceipt);
router.post('/:id/validate', validateReceipt);
router.post('/:id/cancel', cancelReceipt);

module.exports = router;
