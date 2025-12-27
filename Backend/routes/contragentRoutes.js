const express = require('express');
const router = express.Router();
const {
  createContragent,
  getAllContragents,
  getContragentById,
  updateContragent,
  deleteContragent,
  loginContragent,
  getMe,
  updateMyProfile,
  updateMyLogo,
} = require('../controllers/contragentController');
const {
  passwordSetupStep1,
  passwordSetupStep2,
  passwordSetupStep3,
  loginContragent: loginContragentAuth,
} = require('../controllers/contragentAuthController');
const {
  getContragentNotifications,
  getContragentUnreadCount,
  markContragentNotificationRead,
  markAllContragentNotificationsRead,
} = require('../controllers/notificationController');
const {
  getMyPaidPayments,
  getMyUnpaidPayments,
  getMyPaymentStatistics,
  getMyPaymentById,
} = require('../controllers/contragentPaymentController');
const { validate, contragentValidationSchemas } = require('../middleware/validation');
const { contragentAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Password setup (for new contragents from partnership requests)
router.post('/password-setup/step1', validate(contragentValidationSchemas.passwordSetupStep1), passwordSetupStep1);
router.post('/password-setup/step2', validate(contragentValidationSchemas.passwordSetupStep2), passwordSetupStep2);
router.post('/password-setup/step3', validate(contragentValidationSchemas.passwordSetupStep3), passwordSetupStep3);

// Login contragent (old endpoint - kept for backward compatibility)
router.post('/login', validate(contragentValidationSchemas.login), loginContragent);

// Login contragent (new endpoint - same functionality)
router.post('/auth/login', validate(contragentValidationSchemas.login), loginContragentAuth);

// Get current contragent (me)
router.get('/me', contragentAuth, redisCache(60), getMe); // 1 daqiqa cache (user-specific)

// Update current contragent profile
router.put('/me', contragentAuth, validate(contragentValidationSchemas.updateProfile), invalidateCache(['cache:/api/contragents/me*', 'cache:/api/contragents/:id*']), updateMyProfile);

// Update only logo
router.patch('/me/logo', contragentAuth, validate(contragentValidationSchemas.updateLogo), invalidateCache(['cache:/api/contragents/me*', 'cache:/api/contragents/:id*', 'cache:/api/marketplace/contragents*']), updateMyLogo);

// Create contragent
router.post('/', validate(contragentValidationSchemas.create), invalidateCache(['cache:/api/contragents*', 'cache:/api/marketplace/contragents*']), createContragent);

// Get all contragents (with optional filters: ?status=active&address=regionId&page=1&limit=10)
router.get('/', redisCache(300), getAllContragents); // 5 daqiqa cache

// Get contragent by ID
router.get('/:id', redisCache(600), getContragentById); // 10 daqiqa cache

// Update contragent
router.put('/:id', validate(contragentValidationSchemas.update), invalidateCache(['cache:/api/contragents*', 'cache:/api/marketplace/contragents*']), updateContragent);

// Delete contragent
router.delete('/:id', invalidateCache(['cache:/api/contragents*', 'cache:/api/marketplace/contragents*']), deleteContragent);

// Notification routes for Contragent
router.get('/notifications/list', contragentAuth, redisCache(30), getContragentNotifications); // 30 sekund cache (user-specific)
router.get('/notifications/unread-count', contragentAuth, redisCache(30), getContragentUnreadCount); // 30 sekund cache (user-specific)
router.post('/notifications/:notificationId/read', contragentAuth, invalidateCache(['cache:/api/contragents/notifications*']), markContragentNotificationRead);
router.post('/notifications/read-all', contragentAuth, invalidateCache(['cache:/api/contragents/notifications*']), markAllContragentNotificationsRead);

// Payment routes for Contragent
router.get('/payments/paid', contragentAuth, redisCache(60), getMyPaidPayments); // 1 daqiqa cache (user-specific)
router.get('/payments/unpaid', contragentAuth, redisCache(30), getMyUnpaidPayments); // 30 sekund cache (user-specific)
router.get('/payments/statistics', contragentAuth, redisCache(120), getMyPaymentStatistics); // 2 daqiqa cache (user-specific)
router.get('/payments/:id', contragentAuth, redisCache(60), getMyPaymentById); // 1 daqiqa cache (user-specific)

module.exports = router;


