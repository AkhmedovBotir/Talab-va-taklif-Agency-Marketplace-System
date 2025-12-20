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

// Create product (requires authentication)
router.post('/create', contragentAuth, validate(productValidationSchemas.create), createProduct);

// Get my products (requires authentication)
router.get('/my', contragentAuth, getMyProducts);

// Get all products (public, but can be filtered)
router.get('/list', getAllProducts);

// Get product by ID (public)
router.get('/:id', getProductById);

// Update product (requires authentication, only owner)
router.put('/:id', contragentAuth, validate(productValidationSchemas.update), updateProduct);

// Update product status (requires authentication, only owner)
router.put('/:id/status', contragentAuth, validate(productValidationSchemas.updateStatus), updateProductStatus);

// Delete product (requires authentication, only owner)
router.delete('/:id', contragentAuth, deleteProduct);

module.exports = router;


