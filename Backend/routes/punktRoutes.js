const express = require('express');
const router = express.Router();
const {
  createPunkt,
  getAllPunkts,
  getPunktById,
  updatePunkt,
  deletePunkt,
  loginPunkt,
  getPunktsForSelection,
  getContragentsInRegion,
} = require('../controllers/punktController');
const {
  passwordSetupStep1,
  passwordSetupStep2,
  passwordSetupStep3,
} = require('../controllers/punktAuthController');
const {
  getPunktNotifications,
  getPunktUnreadCount,
  markPunktNotificationRead,
  markAllPunktNotificationsRead,
} = require('../controllers/notificationController');
const { validate, punktValidationSchemas } = require('../middleware/validation');
const { punktAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Password setup (for new punkts from vacancy applications)
router.post('/password-setup/step1', validate(punktValidationSchemas.passwordSetupStep1), passwordSetupStep1);
router.post('/password-setup/step2', validate(punktValidationSchemas.passwordSetupStep2), passwordSetupStep2);
router.post('/password-setup/step3', validate(punktValidationSchemas.passwordSetupStep3), passwordSetupStep3);

// Login punkt
router.post('/login', validate(punktValidationSchemas.login), loginPunkt);

// Create punkt
router.post('/', validate(punktValidationSchemas.create), invalidateCache(['cache:/api/punkts*']), createPunkt);

// Get punkts for selection (punkt ID tanlash uchun, public endpoint)
router.get('/selection', redisCache(1800), getPunktsForSelection); // 30 daqiqa cache

// Get all punkts (with optional filters: ?status=active&viloyat=regionId&page=1&limit=10)
router.get('/', redisCache(300), getAllPunkts); // 5 daqiqa cache

// Get punkt by ID
router.get('/:id', redisCache(600), getPunktById); // 10 daqiqa cache

// Update punkt
router.put('/:id', validate(punktValidationSchemas.update), invalidateCache(['cache:/api/punkts*']), updatePunkt);

// Delete punkt
router.delete('/:id', invalidateCache(['cache:/api/punkts*']), deletePunkt);

// Get contragents in punkt's region (o'z hududidagi contragentlar)
router.get('/data/contragents', punktAuth, redisCache(300), getContragentsInRegion); // 5 daqiqa cache

// Notification routes for Punkt
router.get('/notifications/list', punktAuth, redisCache(30), getPunktNotifications); // 30 sekund cache (user-specific)
router.get('/notifications/unread-count', punktAuth, redisCache(30), getPunktUnreadCount); // 30 sekund cache (user-specific)
router.post('/notifications/:notificationId/read', punktAuth, invalidateCache(['cache:/api/punkts/notifications*']), markPunktNotificationRead);
router.post('/notifications/read-all', punktAuth, invalidateCache(['cache:/api/punkts/notifications*']), markAllPunktNotificationsRead);

module.exports = router;



