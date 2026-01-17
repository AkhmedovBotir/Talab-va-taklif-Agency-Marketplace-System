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
  getMyDeliveryRegions,
  updateMyDeliveryRegions,
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
const {
  getContragentTransactions,
  getContragentBalance,
  getContragentZakladInfo,
} = require('../controllers/contragentPaymentController');
const { validate, contragentValidationSchemas } = require('../middleware/validation');
const { contragentAuth } = require('../middleware/auth');

// Password setup (for new contragents from partnership requests)
router.post('/password-setup/step1', validate(contragentValidationSchemas.passwordSetupStep1), passwordSetupStep1);
router.post('/password-setup/step2', validate(contragentValidationSchemas.passwordSetupStep2), passwordSetupStep2);
router.post('/password-setup/step3', validate(contragentValidationSchemas.passwordSetupStep3), passwordSetupStep3);

// Login contragent (old endpoint - kept for backward compatibility)
router.post('/login', validate(contragentValidationSchemas.login), loginContragent);

// Login contragent (new endpoint - same functionality)
router.post('/auth/login', validate(contragentValidationSchemas.login), loginContragentAuth);

// Get current contragent (me)
router.get('/me', contragentAuth, getMe);

// Update current contragent profile
router.put('/me', contragentAuth, validate(contragentValidationSchemas.updateProfile), updateMyProfile);

// Update only logo
router.patch('/me/logo', contragentAuth, validate(contragentValidationSchemas.updateLogo), updateMyLogo);

// Get delivery regions
router.get('/me/delivery-regions', contragentAuth, getMyDeliveryRegions);

// Update delivery regions
router.patch('/me/delivery-regions', contragentAuth, validate(contragentValidationSchemas.updateDeliveryRegions), updateMyDeliveryRegions);

// Create contragent
router.post('/', validate(contragentValidationSchemas.create), createContragent);

// Get all contragents (with optional filters: ?status=active&address=regionId&page=1&limit=10)
router.get('/', getAllContragents);

// Get contragent by ID
router.get('/:id', getContragentById);

// Update contragent
router.put('/:id', validate(contragentValidationSchemas.update), updateContragent);

// Delete contragent
router.delete('/:id', deleteContragent);

// Notification routes for Contragent
router.get('/notifications/list', contragentAuth, getContragentNotifications);
router.get('/notifications/unread-count', contragentAuth, getContragentUnreadCount);
router.post('/notifications/:notificationId/read', contragentAuth, markContragentNotificationRead);
router.post('/notifications/read-all', contragentAuth, markAllContragentNotificationsRead);

// Payment routes for Contragent (old KPI payment routes)
// Aniq route'lar parametrli route'lardan oldin bo'lishi kerak
router.get('/payments/paid', contragentAuth, getMyPaidPayments);
router.get('/payments/unpaid', contragentAuth, getMyUnpaidPayments);
router.get('/payments/statistics', contragentAuth, getMyPaymentStatistics);
router.get('/payments/payment/:id', contragentAuth, getMyPaymentById); // Changed from /payments/:id to avoid conflict

// ==================== CONTRAGENT PAYMENT ROUTES ====================

// Kontragent zaklad ma'lumotlarini olish (qarz/haq)
router.get('/finance/zaklad-info', contragentAuth, getContragentZakladInfo);

// Kontragent o'zining tranzaksiyalarini olish
router.get('/finance/transactions', contragentAuth, getContragentTransactions);

// Kontragent balansini olish
router.get('/finance/balance', contragentAuth, getContragentBalance);

module.exports = router;


