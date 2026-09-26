const express = require('express');
const router = express.Router();
const { getLocations, getLocation, createLocation, updateLocation, deleteLocation } = require('../controllers/location.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getLocations);
router.post('/', createLocation);
router.get('/:id', getLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

module.exports = router;
