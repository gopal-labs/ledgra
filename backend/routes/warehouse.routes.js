const express = require('express');
const router = express.Router();
const { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } = require('../controllers/warehouse.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getWarehouses);
router.post('/', createWarehouse);
router.get('/:id', getWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

module.exports = router;
