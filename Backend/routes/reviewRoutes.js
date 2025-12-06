const express = require('express');
const router = express.Router();
const {
  createCommentTemplate,
  getAllCommentTemplates,
  getCommentTemplateById,
  updateCommentTemplate,
  deleteCommentTemplate,
} = require('../controllers/reviewCommentTemplateController');
const {
  createReview,
  getAllReviews,
  getReviewById,
  getProductReviews,
} = require('../controllers/reviewController');
const {
  getAllContacts,
  getPositiveContacts,
  getNegativeContacts,
  getContactById,
  updateContactStatus,
  getContactStatistics,
} = require('../controllers/reviewContactController');
const {
  createInitialTemplates,
  getActiveTemplates,
} = require('../controllers/reviewInitialDataController');
const { adminAuth } = require('../middleware/auth');
const { marketplaceUserAuth } = require('../middleware/auth');

// Public Routes (must be before authenticated routes)
router.get('/templates', getActiveTemplates); // Public - for marketplace users
router.get('/product/:productId', getProductReviews); // Public

// Marketplace User Routes
router.post('/', marketplaceUserAuth, createReview);

// Admin Routes - Specific routes must come before :id routes
// Comment Template Routes (Admin only)
router.post('/admin/comment-templates', adminAuth, createCommentTemplate);
router.get('/admin/comment-templates', adminAuth, getAllCommentTemplates);
router.get('/admin/comment-templates/:id', adminAuth, getCommentTemplateById);
router.put('/admin/comment-templates/:id', adminAuth, updateCommentTemplate);
router.delete('/admin/comment-templates/:id', adminAuth, deleteCommentTemplate);

// Initial Data Routes
router.post('/admin/initial-templates', adminAuth, createInitialTemplates);

// Contact Routes (Admin only) - Must be before /admin/:id
router.get('/admin/contacts/statistics', adminAuth, getContactStatistics);
router.get('/admin/contacts/positive', adminAuth, getPositiveContacts);
router.get('/admin/contacts/negative', adminAuth, getNegativeContacts);
router.get('/admin/contacts', adminAuth, getAllContacts);
router.get('/admin/contacts/:id', adminAuth, getContactById);
router.put('/admin/contacts/:id/status', adminAuth, updateContactStatus);

// Review Routes (Admin only) - Must be after all specific routes
router.get('/admin', adminAuth, getAllReviews);
router.get('/admin/:id', adminAuth, getReviewById);

module.exports = router;

