const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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
router.get('/templates', cacheMiddleware(3600), getActiveTemplates); // 1 hour cache - Public - for marketplace users
router.get('/product/:productId', cacheMiddleware(1800), getProductReviews); // 30 min cache - Public

// Marketplace User Routes
router.post('/', marketplaceUserAuth, createReview);

// Admin Routes - Specific routes must come before :id routes
// Comment Template Routes (Admin only)
router.post('/admin/comment-templates', adminAuth, createCommentTemplate);
router.get('/admin/comment-templates', adminAuth, cacheMiddleware(3600), getAllCommentTemplates); // 1 hour cache
router.get('/admin/comment-templates/:id', adminAuth, cacheMiddleware(3600), getCommentTemplateById); // 1 hour cache
router.put('/admin/comment-templates/:id', adminAuth, updateCommentTemplate);
router.delete('/admin/comment-templates/:id', adminAuth, deleteCommentTemplate);

// Initial Data Routes
router.post('/admin/initial-templates', adminAuth, createInitialTemplates);

// Contact Routes (Admin only) - Must be before /admin/:id
router.get('/admin/contacts/statistics', adminAuth, cacheMiddleware(300), getContactStatistics); // 5 min cache
router.get('/admin/contacts/positive', adminAuth, cacheMiddleware(300), getPositiveContacts); // 5 min cache
router.get('/admin/contacts/negative', adminAuth, cacheMiddleware(300), getNegativeContacts); // 5 min cache
router.get('/admin/contacts', adminAuth, cacheMiddleware(300), getAllContacts); // 5 min cache
router.get('/admin/contacts/:id', adminAuth, cacheMiddleware(300), getContactById); // 5 min cache
router.put('/admin/contacts/:id/status', adminAuth, updateContactStatus);

// Review Routes (Admin only) - Must be after all specific routes
router.get('/admin', adminAuth, cacheMiddleware(300), getAllReviews); // 5 min cache
router.get('/admin/:id', adminAuth, cacheMiddleware(300), getReviewById); // 5 min cache

module.exports = router;

