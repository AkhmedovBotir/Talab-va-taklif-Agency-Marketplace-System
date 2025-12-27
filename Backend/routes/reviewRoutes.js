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
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Public Routes (must be before authenticated routes)
router.get('/templates', redisCache(1800), getActiveTemplates); // 30 daqiqa cache
router.get('/product/:productId', redisCache(300), getProductReviews); // 5 daqiqa cache

// Marketplace User Routes
router.post('/', marketplaceUserAuth, invalidateCache(['cache:/api/reviews/product/*']), createReview);

// Admin Routes - Specific routes must come before :id routes
// Comment Template Routes (Admin only)
router.post('/admin/comment-templates', adminAuth, invalidateCache(['cache:/api/reviews/admin/comment-templates*', 'cache:/api/reviews/templates*']), createCommentTemplate);
router.get('/admin/comment-templates', adminAuth, redisCache(1800), getAllCommentTemplates); // 30 daqiqa cache
router.get('/admin/comment-templates/:id', adminAuth, redisCache(1800), getCommentTemplateById); // 30 daqiqa cache
router.put('/admin/comment-templates/:id', adminAuth, invalidateCache(['cache:/api/reviews/admin/comment-templates*', 'cache:/api/reviews/templates*']), updateCommentTemplate);
router.delete('/admin/comment-templates/:id', adminAuth, invalidateCache(['cache:/api/reviews/admin/comment-templates*', 'cache:/api/reviews/templates*']), deleteCommentTemplate);

// Initial Data Routes
router.post('/admin/initial-templates', adminAuth, invalidateCache(['cache:/api/reviews/templates*']), createInitialTemplates);

// Contact Routes (Admin only) - Must be before /admin/:id
router.get('/admin/contacts/statistics', adminAuth, redisCache(120), getContactStatistics); // 2 daqiqa cache
router.get('/admin/contacts/positive', adminAuth, redisCache(60), getPositiveContacts); // 1 daqiqa cache
router.get('/admin/contacts/negative', adminAuth, redisCache(60), getNegativeContacts); // 1 daqiqa cache
router.get('/admin/contacts', adminAuth, redisCache(60), getAllContacts); // 1 daqiqa cache
router.get('/admin/contacts/:id', adminAuth, redisCache(60), getContactById); // 1 daqiqa cache
router.put('/admin/contacts/:id/status', adminAuth, invalidateCache(['cache:/api/reviews/admin/contacts*']), updateContactStatus);

// Review Routes (Admin only) - Must be after all specific routes
router.get('/admin', adminAuth, redisCache(60), getAllReviews); // 1 daqiqa cache
router.get('/admin/:id', adminAuth, redisCache(60), getReviewById); // 1 daqiqa cache

module.exports = router;

