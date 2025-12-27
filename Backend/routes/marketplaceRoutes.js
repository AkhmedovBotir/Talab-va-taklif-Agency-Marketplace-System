const express = require('express');
const router = express.Router();
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
  getViloyatTuman,
  updateViloyatTuman,
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
const { validate, marketplaceValidationSchemas, cartValidationSchemas, orderValidationSchemas, marketplaceProfileValidationSchemas, partnershipRequestValidationSchemas, marketplacePartnershipRequestValidationSchemas } = require('../middleware/validation');
const { marketplaceUserAuth, optionalMarketplaceUserAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Check phone exists (must be before other routes to avoid conflicts)
router.get('/check-phone', redisCache(60), checkPhoneExists); // 1 daqiqa cache

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
router.get('/search', redisCache(300), search); // 5 daqiqa cache
router.get('/filter', redisCache(300), filterProducts); // 5 daqiqa cache

// Products
router.get('/products', redisCache(300), getAllProducts); // 5 daqiqa cache
router.get('/products/:id', redisCache(600), getProductById); // 10 daqiqa cache

// Categories (specific routes before generic ones)
router.get('/categories', redisCache(600), getAllCategories); // 10 daqiqa cache
router.get('/categories/:id/products', redisCache(300), getProductsByCategory); // 5 daqiqa cache
router.get('/categories/:id', redisCache(600), getCategoryById); // 10 daqiqa cache

// Contragents
router.get('/contragents', redisCache(300), getAllContragents); // 5 daqiqa cache
router.get('/contragents/:id', redisCache(300), getContragentById); // 5 daqiqa cache

// Cart routes (require authentication)
router.get('/cart', marketplaceUserAuth, redisCache(30), getCart); // 30 sekund cache (user-specific)
router.post('/cart', marketplaceUserAuth, validate(cartValidationSchemas.addToCart), invalidateCache(['cache:/api/marketplace/cart*']), addToCart);
router.put('/cart/:productId', marketplaceUserAuth, validate(cartValidationSchemas.updateCartItem), invalidateCache(['cache:/api/marketplace/cart*']), updateCartItem);
router.delete('/cart/:productId', marketplaceUserAuth, invalidateCache(['cache:/api/marketplace/cart*']), removeFromCart);
router.delete('/cart', marketplaceUserAuth, invalidateCache(['cache:/api/marketplace/cart*']), clearCart);

// Order routes (require authentication)
router.post('/orders', marketplaceUserAuth, validate(orderValidationSchemas.create), invalidateCache(['cache:/api/marketplace/orders*']), createOrder);
router.get('/orders', marketplaceUserAuth, redisCache(30), getOrders); // 30 sekund cache (user-specific)
router.get('/orders/:id', marketplaceUserAuth, redisCache(30), getOrderById); // 30 sekund cache (user-specific)
router.delete('/orders/:id', marketplaceUserAuth, invalidateCache(['cache:/api/marketplace/orders*']), cancelOrder);
router.post('/orders/:id/confirm-delivery', marketplaceUserAuth, invalidateCache(['cache:/api/marketplace/orders*']), confirmDelivery);

// Profile routes (require authentication)
router.get('/me', marketplaceUserAuth, redisCache(60), getMe); // 1 daqiqa cache (user-specific)
router.put('/me', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateProfile), invalidateCache(['cache:/api/marketplace/me*']), updateProfile);
router.patch('/me/password', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updatePassword), invalidateCache(['cache:/api/marketplace/me*']), updatePassword);
router.patch('/me/avatar', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateAvatar), invalidateCache(['cache:/api/marketplace/me*']), updateAvatar);
router.patch('/me/location', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateLocation), invalidateCache(['cache:/api/marketplace/me*']), updateLocation);
router.get('/me/viloyat-tuman', marketplaceUserAuth, redisCache(1800), getViloyatTuman); // 30 daqiqa cache (static)
router.patch('/me/viloyat-tuman', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateViloyatTuman), invalidateCache(['cache:/api/marketplace/me*']), updateViloyatTuman);

// Notification routes for Marketplace Users
router.get('/notifications/list', marketplaceUserAuth, redisCache(30), getMarketplaceNotifications); // 30 sekund cache (user-specific)
router.get('/notifications/unread-count', marketplaceUserAuth, redisCache(30), getMarketplaceUnreadCount); // 30 sekund cache (user-specific)
router.post('/notifications/:notificationId/read', marketplaceUserAuth, invalidateCache(['cache:/api/marketplace/notifications*']), markMarketplaceNotificationRead);
router.post('/notifications/read-all', marketplaceUserAuth, invalidateCache(['cache:/api/marketplace/notifications*']), markAllMarketplaceNotificationsRead);

// Featured contragents (short info, public for marketplace)
router.get('/featured-contragents', redisCache(600), getFeaturedContragentsForMarketplace); // 10 daqiqa cache

// Partnership request routes (optional authentication - tokensiz ham, token bilan ham ishlaydi)
router.post('/partnership-requests', optionalMarketplaceUserAuth, validate(partnershipRequestValidationSchemas.create), invalidateCache(['cache:/api/marketplace/partnership-requests*']), createPartnershipRequest);
router.get('/partnership-requests', marketplaceUserAuth, redisCache(60), getMyPartnershipRequests); // 1 daqiqa cache (user-specific)

// Marketplace partnership request routes (new system - requires authentication)
const {
  createMarketplacePartnershipRequest,
  getMyMarketplacePartnershipRequests,
  getMyMarketplacePartnershipRequestById,
} = require('../controllers/marketplacePartnershipRequestController');

router.post('/marketplace-partnership-requests', marketplaceUserAuth, validate(marketplacePartnershipRequestValidationSchemas.create), invalidateCache(['cache:/api/marketplace/marketplace-partnership-requests*']), createMarketplacePartnershipRequest);
router.get('/marketplace-partnership-requests', marketplaceUserAuth, redisCache(60), getMyMarketplacePartnershipRequests); // 1 daqiqa cache (user-specific)
router.get('/marketplace-partnership-requests/:id', marketplaceUserAuth, redisCache(60), getMyMarketplacePartnershipRequestById); // 1 daqiqa cache (user-specific)

module.exports = router;

