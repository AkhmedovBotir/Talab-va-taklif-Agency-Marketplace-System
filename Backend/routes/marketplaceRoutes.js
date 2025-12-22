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
router.get('/search', search);
router.get('/filter', filterProducts);

// Products
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);

// Categories (specific routes before generic ones)
router.get('/categories', getAllCategories);
router.get('/categories/:id/products', getProductsByCategory);
router.get('/categories/:id', getCategoryById);

// Contragents
router.get('/contragents', getAllContragents);
router.get('/contragents/:id', getContragentById);

// Cart routes (require authentication)
router.get('/cart', marketplaceUserAuth, getCart);
router.post('/cart', marketplaceUserAuth, validate(cartValidationSchemas.addToCart), addToCart);
router.put('/cart/:productId', marketplaceUserAuth, validate(cartValidationSchemas.updateCartItem), updateCartItem);
router.delete('/cart/:productId', marketplaceUserAuth, removeFromCart);
router.delete('/cart', marketplaceUserAuth, clearCart);

// Order routes (require authentication)
router.post('/orders', marketplaceUserAuth, validate(orderValidationSchemas.create), createOrder);
router.get('/orders', marketplaceUserAuth, getOrders);
router.get('/orders/:id', marketplaceUserAuth, getOrderById);
router.delete('/orders/:id', marketplaceUserAuth, cancelOrder);
router.post('/orders/:id/confirm-delivery', marketplaceUserAuth, confirmDelivery);

// Profile routes (require authentication)
router.get('/me', marketplaceUserAuth, getMe);
router.put('/me', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateProfile), updateProfile);
router.patch('/me/password', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updatePassword), updatePassword);
router.patch('/me/avatar', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateAvatar), updateAvatar);
router.patch('/me/location', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateLocation), updateLocation);
router.get('/me/viloyat-tuman', marketplaceUserAuth, getViloyatTuman);
router.patch('/me/viloyat-tuman', marketplaceUserAuth, validate(marketplaceProfileValidationSchemas.updateViloyatTuman), updateViloyatTuman);

// Notification routes for Marketplace Users
router.get('/notifications/list', marketplaceUserAuth, getMarketplaceNotifications);
router.get('/notifications/unread-count', marketplaceUserAuth, getMarketplaceUnreadCount);
router.post('/notifications/:notificationId/read', marketplaceUserAuth, markMarketplaceNotificationRead);
router.post('/notifications/read-all', marketplaceUserAuth, markAllMarketplaceNotificationsRead);

// Featured contragents (short info, public for marketplace)
router.get('/featured-contragents', getFeaturedContragentsForMarketplace);

// Partnership request routes (optional authentication - tokensiz ham, token bilan ham ishlaydi)
router.post('/partnership-requests', optionalMarketplaceUserAuth, validate(partnershipRequestValidationSchemas.create), createPartnershipRequest);
router.get('/partnership-requests', marketplaceUserAuth, getMyPartnershipRequests);

// Marketplace partnership request routes (new system - requires authentication)
const {
  createMarketplacePartnershipRequest,
  getMyMarketplacePartnershipRequests,
  getMyMarketplacePartnershipRequestById,
} = require('../controllers/marketplacePartnershipRequestController');

router.post('/marketplace-partnership-requests', marketplaceUserAuth, validate(marketplacePartnershipRequestValidationSchemas.create), createMarketplacePartnershipRequest);
router.get('/marketplace-partnership-requests', marketplaceUserAuth, getMyMarketplacePartnershipRequests);
router.get('/marketplace-partnership-requests/:id', marketplaceUserAuth, getMyMarketplacePartnershipRequestById);

module.exports = router;

