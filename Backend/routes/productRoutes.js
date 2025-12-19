const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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

// Create product (requires authentication)
router.post('/create', contragentAuth, validate(productValidationSchemas.create), createProduct);

// Get my products (requires authentication)
router.get('/my', contragentAuth, cacheMiddleware(300), getMyProducts); // 5 min cache

// Get all products (public, but can be filtered)
router.get('/list', cacheMiddleware(1800), getAllProducts); // 30 min cache

// Get product by ID (public)
router.get('/:id', cacheMiddleware(3600), getProductById); // 1 hour cache

// Update product (requires authentication, only owner)
router.put('/:id', contragentAuth, validate(productValidationSchemas.update), updateProduct);

// Update product status (requires authentication, only owner)
router.put('/:id/status', contragentAuth, validate(productValidationSchemas.updateStatus), updateProductStatus);

// Delete product (requires authentication, only owner)
router.delete('/:id', contragentAuth, deleteProduct);

module.exports = router;


