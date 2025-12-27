const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
  deleteProduct,
} = require('../controllers/productController');
const { validate, productValidationSchemas } = require('../middleware/validation');
const { contragentAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Create product (requires authentication)
router.post('/create', contragentAuth, validate(productValidationSchemas.create), invalidateCache(['cache:/api/product*', 'cache:/api/marketplace/products*']), createProduct);

// Get my products (requires authentication)
router.get('/my', contragentAuth, redisCache(60), getMyProducts); // 1 daqiqa cache (user-specific)

// Get all products (public, but can be filtered)
router.get('/list', redisCache(300), getAllProducts); // 5 daqiqa cache

// Get product by ID (public)
router.get('/:id', redisCache(600), getProductById); // 10 daqiqa cache

// Update product (requires authentication, only owner)
router.put('/:id', contragentAuth, validate(productValidationSchemas.update), invalidateCache(['cache:/api/product*', 'cache:/api/marketplace/products*']), updateProduct);

// Update product status (requires authentication, only owner)
router.put('/:id/status', contragentAuth, validate(productValidationSchemas.updateStatus), invalidateCache(['cache:/api/product*', 'cache:/api/marketplace/products*']), updateProductStatus);

// Delete product (requires authentication, only owner)
router.delete('/:id', contragentAuth, invalidateCache(['cache:/api/product*', 'cache:/api/marketplace/products*']), deleteProduct);

module.exports = router;


