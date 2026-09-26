const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, getProductStock
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.get('/:id/stock', getProductStock);

module.exports = router;
