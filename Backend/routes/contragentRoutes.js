const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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
  getContragentNotifications,
  getContragentUnreadCount,
  markContragentNotificationRead,
  markAllContragentNotificationsRead,
} = require('../controllers/notificationController');
const { validate, contragentValidationSchemas } = require('../middleware/validation');
const { contragentAuth } = require('../middleware/auth');

// Login contragent
router.post('/login', validate(contragentValidationSchemas.login), loginContragent);

// Get current contragent (me)
router.get('/me', contragentAuth, cacheMiddleware(300), getMe); // 5 min cache

// Update current contragent profile
router.put('/me', contragentAuth, validate(contragentValidationSchemas.updateProfile), updateMyProfile);

// Update only logo
router.patch('/me/logo', contragentAuth, validate(contragentValidationSchemas.updateLogo), updateMyLogo);

// Create contragent
router.post('/', validate(contragentValidationSchemas.create), createContragent);

// Get all contragents (with optional filters: ?status=active&address=regionId&page=1&limit=10)
router.get('/', cacheMiddleware(1800), getAllContragents); // 30 min cache

// Get contragent by ID
router.get('/:id', cacheMiddleware(3600), getContragentById); // 1 hour cache

// Update contragent
router.put('/:id', validate(contragentValidationSchemas.update), updateContragent);

// Delete contragent
router.delete('/:id', deleteContragent);

// Notification routes for Contragent
router.get('/notifications/list', contragentAuth, getContragentNotifications);
router.get('/notifications/unread-count', contragentAuth, getContragentUnreadCount);
router.post('/notifications/:notificationId/read', contragentAuth, markContragentNotificationRead);
router.post('/notifications/read-all', contragentAuth, markAllContragentNotificationsRead);

module.exports = router;


