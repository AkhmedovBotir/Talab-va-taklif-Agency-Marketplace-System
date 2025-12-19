const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const {
  registerStep1,
  registerStep2,
  loginStep1,
  loginStep2,
  forgotPasswordStep1,
  forgotPasswordStep2,
  resendSMSCode,
  checkPhoneExists,
} = require('../controllers/marketplaceAuthController');
const {
  getAllProducts,
  getProductById,
  getAllCategories,
  getCategoryById,
  getProductsByCategory,
  getAllContragents,
  getContragentById,
  search,
  filterProducts,
} = require('../controllers/marketplaceController');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmDelivery,
} = require('../controllers/orderController');
const {
  getMe,
  updateProfile,
  updatePassword,
  updateAvatar,
  updateLocation,
} = require('../controllers/marketplaceProfileController');
const {
  getMarketplaceNotifications,
  getMarketplaceUnreadCount,
  markMarketplaceNotificationRead,
  markAllMarketplaceNotificationsRead,
} = require('../controllers/notificationController');
const {
  getFeaturedContragentsForMarketplace,
} = require('../controllers/featuredContragentController');
const {
  createPartnershipRequest,
  getMyPartnershipRequests,
} = require('../controllers/partnershipRequestController');
const { validate, marketplaceValidationSchemas, cartValidationSchemas, orderValidationSchemas, marketplaceProfileValidationSchemas, partnershipRequestValidationSchemas } = require('../middleware/validation');
const { marketplaceUserAuth, optionalMarketplaceUserAuth } = require('../middleware/auth');

// Check phone exists (must be before other routes to avoid conflicts)
router.get('/check-phone', checkPhoneExists);

// Register routes
router.post('/register/step1', validate(marketplaceValidationSchemas.registerStep1), registerStep1);
router.post('/register/step2', validate(marketplaceValidationSchemas.registerStep2), registerStep2);

// Login routes
router.post('/login/step1', validate(marketplaceValidationSchemas.loginStep1), loginStep1);
router.post('/login/step2', validate(marketplaceValidationSchemas.loginStep2), loginStep2);

// Forgot password routes
router.post('/forgot-password/step1', validate(marketplaceValidationSchemas.forgotPasswordStep1), forgotPasswordStep1);
router.post('/forgot-password/step2', validate(marketplaceValidationSchemas.forgotPasswordStep2), forgotPasswordStep2);

// Resend SMS code
router.post('/resend-code', validate(marketplaceValidationSchemas.resendSMSCode), resendSMSCode);

// Marketplace data routes
// Search and Filter (must be before other routes)
router.get('/search', cacheMiddleware(1800), search); // 30 min cache
router.get('/filter', cacheMiddleware(1800), filterProducts); // 30 min cache

// Products
router.get('/products', cacheMiddleware(1800), getAllProducts); // 30 min cache
router.get('/products/:id', cacheMiddleware(3600), getProductById); // 1 hour cache

// Categories (specific routes before generic ones)
router.get('/categories', cacheMiddleware(3600), getAllCategories); // 1 hour cache
router.get('/categories/:id/products', cacheMiddleware(1800), getProductsByCategory); // 30 min cache
router.get('/categories/:id', cacheMiddleware(3600), getCategoryById); // 1 hour cache

// Contragents
router.get('/contragents', cacheMiddleware(1800), getAllContragents); // 30 min cache
router.get('/contragents/:id', cacheMiddleware(3600), getContragentById); // 1 hour cache

// Cart routes (require authentication)
router.get('/cart', marketplaceUserAuth, cacheMiddleware(60), getCart); // 1 min cache
router.post('/cart', marketplaceUserAuth, validate(cartValidationSchemas.addToCart), addToCart);
router.put('/cart/:productId', marketplaceUserAuth, validate(cartValidationSchemas.updateCartItem), updateCartItem);
router.delete('/cart/:productId', marketplaceUserAuth, removeFromCart);
router.delete('/cart', marketplaceUserAuth, clearCart);

// Order routes (require authentication)
router.post('/orders', marketplaceUserAuth, validate(orderValidationSchemas.create), createOrder);
router.get('/orders', marketplaceUserAuth, cacheMiddleware(60), getOrders); // 1 min cache
router.get('/orders/:id', marketplaceUserAuth, cacheMiddleware(60), getOrderById); // 1 min cache
router.delete('/orders/:id', marketplaceUserAuth, cancelOrder);
router.post('/orders/:id/confirm-delivery', marketplaceUserAuth, confirmDelivery);

// Profile routes (require authentication)
router.get('/me', marketplaceUserAuth, cacheMiddleware(300), getMe); // 5 min cache
router.put('/me', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateProfile), updateProfile);
router.patch('/me/password', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updatePassword), updatePassword);
router.patch('/me/avatar', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateAvatar), updateAvatar);
router.patch('/me/location', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateLocation), updateLocation);

// Notification routes for Marketplace Users
router.get('/notifications/list', marketplaceUserAuth, cacheMiddleware(60), getMarketplaceNotifications); // 1 min cache
router.get('/notifications/unread-count', marketplaceUserAuth, cacheMiddleware(30), getMarketplaceUnreadCount); // 30 sec cache
router.post('/notifications/:notificationId/read', marketplaceUserAuth, markMarketplaceNotificationRead);
router.post('/notifications/read-all', marketplaceUserAuth, markAllMarketplaceNotificationsRead);

// Featured contragents (short info, public for marketplace)
router.get('/featured-contragents', cacheMiddleware(1800), getFeaturedContragentsForMarketplace); // 30 min cache

// Partnership request routes (optional authentication - tokensiz ham, token bilan ham ishlaydi)
router.post('/partnership-requests', optionalMarketplaceUserAuth, validate(partnershipRequestValidationSchemas.create), createPartnershipRequest);
router.get('/partnership-requests', marketplaceUserAuth, cacheMiddleware(300), getMyPartnershipRequests); // 5 min cache

module.exports = router;

