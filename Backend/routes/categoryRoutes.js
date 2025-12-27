const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getAllSubcategories,
  getCategoryById,
} = require('../controllers/categoryController');
const { optionalContragentAuth } = require('../middleware/auth');
const { redisCache } = require('../middleware/redisCache');

// Category routes (read-only for contragents - categories are now managed by admins)
router.get('/list', optionalContragentAuth, redisCache(1800), getAllCategories); // 30 daqiqa cache
router.get('/:id', optionalContragentAuth, redisCache(1800), getCategoryById); // 30 daqiqa cache

// Subcategory routes (read-only for contragents)
router.get('/subcategory/list', optionalContragentAuth, redisCache(1800), getAllSubcategories); // 30 daqiqa cache

module.exports = router;

