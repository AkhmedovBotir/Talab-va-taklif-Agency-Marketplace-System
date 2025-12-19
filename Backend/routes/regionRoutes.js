const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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

// Create region
router.post('/', validate(regionValidationSchemas.create), createRegion);

// Get all regions (with optional filters: ?type=region&parent=null&status=active&page=1&limit=10)
router.get('/', cacheMiddleware(3600), getAllRegions); // 1 hour cache

// Get regions by type (with optional filters: ?status=active&parent=null)
router.get('/type/:type', cacheMiddleware(3600), getRegionsByType); // 1 hour cache

// Get children of a region (with optional filter: ?status=active)
router.get('/:id/children', cacheMiddleware(3600), getRegionChildren); // 1 hour cache

// Update region status
router.patch('/:id/status', updateRegionStatus);

// Get region by ID
router.get('/:id', cacheMiddleware(3600), getRegionById); // 1 hour cache

// Update region
router.put('/:id', validate(regionValidationSchemas.update), updateRegion);

// Delete region
router.delete('/:id', deleteRegion);

module.exports = router;

