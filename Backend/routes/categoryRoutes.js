const express = require('express');
const router = express.Router();
const {
  createCategory,
  createSubcategory,
  getAllCategories,
  getAllSubcategories,
  getCategoryById,
  updateCategory,
  updateSubcategory,
  updateCategoryStatus,
  deleteCategory,
  deleteSubcategory,
} = require('../controllers/categoryController');
const { validate, categoryValidationSchemas } = require('../middleware/validation');
const { contragentAuth, optionalContragentAuth } = require('../middleware/auth');

// Category routes
router.post('/create', contragentAuth, validate(categoryValidationSchemas.create), createCategory);
router.get('/list', optionalContragentAuth, getAllCategories);
router.put('/:id/status', contragentAuth, validate(categoryValidationSchemas.updateStatus), updateCategoryStatus);
router.put('/:id', contragentAuth, validate(categoryValidationSchemas.update), updateCategory);
router.delete('/:id', contragentAuth, deleteCategory);
router.get('/:id', optionalContragentAuth, getCategoryById);

// Subcategory routes
router.post('/subcategory/create', contragentAuth, validate(categoryValidationSchemas.createSubcategory), createSubcategory);
router.get('/subcategory/list', optionalContragentAuth, getAllSubcategories);
router.put('/subcategory/:id/status', contragentAuth, validate(categoryValidationSchemas.updateStatus), updateCategoryStatus);
router.put('/subcategory/:id', contragentAuth, validate(categoryValidationSchemas.updateSubcategory), updateSubcategory);
router.delete('/subcategory/:id', contragentAuth, deleteSubcategory);

module.exports = router;

