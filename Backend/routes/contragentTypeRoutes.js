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

// Public routes (GET - open access)
router.get('/', getAllContragentTypes);
router.get('/:id', getContragentTypeById);

// Admin routes (CRUD - require authentication)
router.post('/', adminAuth, validate(contragentTypeValidationSchemas.create), createContragentType);
router.put('/:id', adminAuth, validate(contragentTypeValidationSchemas.update), updateContragentType);
router.delete('/:id', adminAuth, deleteContragentType);

module.exports = router;



