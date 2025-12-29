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

// Create region
router.post('/', validate(regionValidationSchemas.create), createRegion);

// Get all regions (with optional filters: ?type=region&parent=null&status=active&page=1&limit=10)
router.get('/', getAllRegions);

// Get regions by type (with optional filters: ?status=active&parent=null)
router.get('/type/:type', getRegionsByType);

// Get children of a region (with optional filter: ?status=active)
router.get('/:id/children', getRegionChildren);

// Update region status
router.patch('/:id/status', updateRegionStatus);

// Get region by ID
router.get('/:id', getRegionById);

// Update region
router.put('/:id', validate(regionValidationSchemas.update), updateRegion);

// Delete region
router.delete('/:id', deleteRegion);

module.exports = router;

