const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getAllSubcategories,
  getCategoryById,
} = require('../controllers/categoryController');
const { optionalContragentAuth } = require('../middleware/auth');

// Category routes (read-only for contragents - categories are now managed by admins)
router.get('/list', optionalContragentAuth, getAllCategories);
router.get('/:id', optionalContragentAuth, getCategoryById);

// Subcategory routes (read-only for contragents)
router.get('/subcategory/list', optionalContragentAuth, getAllSubcategories);

module.exports = router;

