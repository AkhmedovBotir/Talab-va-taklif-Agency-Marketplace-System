const express = require('express');
const router = express.Router();
const {
  createRegion,
  getAllRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
  getRegionsByType,
  getRegionChildren,
  updateRegionStatus,
} = require('../controllers/regionController');
const { validate, regionValidationSchemas } = require('../middleware/validation');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Create region
router.post('/', validate(regionValidationSchemas.create), invalidateCache(['cache:/api/regions*']), createRegion);

// Get all regions (with optional filters: ?type=region&parent=null&status=active&page=1&limit=10)
router.get('/', redisCache(1800), getAllRegions); // 30 daqiqa cache

// Get regions by type (with optional filters: ?status=active&parent=null)
router.get('/type/:type', redisCache(1800), getRegionsByType); // 30 daqiqa cache

// Get children of a region (with optional filter: ?status=active)
router.get('/:id/children', redisCache(1800), getRegionChildren); // 30 daqiqa cache

// Update region status
router.patch('/:id/status', invalidateCache(['cache:/api/regions*']), updateRegionStatus);

// Get region by ID
router.get('/:id', redisCache(1800), getRegionById); // 30 daqiqa cache

// Update region
router.put('/:id', validate(regionValidationSchemas.update), invalidateCache(['cache:/api/regions*']), updateRegion);

// Delete region
router.delete('/:id', invalidateCache(['cache:/api/regions*']), deleteRegion);

module.exports = router;

