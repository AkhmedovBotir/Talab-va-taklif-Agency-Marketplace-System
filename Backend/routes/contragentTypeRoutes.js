const express = require('express');
const router = express.Router();
const {
  createContragentType,
  getAllContragentTypes,
  getContragentTypeById,
  updateContragentType,
  deleteContragentType,
} = require('../controllers/contragentTypeController');
const {
  validate,
  contragentTypeValidationSchemas,
} = require('../middleware/validation');
const { adminAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Public routes (GET - open access)
router.get('/', redisCache(1800), getAllContragentTypes); // 30 daqiqa cache
router.get('/:id', redisCache(1800), getContragentTypeById); // 30 daqiqa cache

// Admin routes (CRUD - require authentication)
router.post('/', adminAuth, validate(contragentTypeValidationSchemas.create), invalidateCache(['cache:/api/contragent-types*']), createContragentType);
router.put('/:id', adminAuth, validate(contragentTypeValidationSchemas.update), invalidateCache(['cache:/api/contragent-types*']), updateContragentType);
router.delete('/:id', adminAuth, invalidateCache(['cache:/api/contragent-types*']), deleteContragentType);

module.exports = router;



