const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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
  getPunktNotifications,
  getPunktUnreadCount,
  markPunktNotificationRead,
  markAllPunktNotificationsRead,
} = require('../controllers/notificationController');
const { validate, punktValidationSchemas } = require('../middleware/validation');
const { punktAuth } = require('../middleware/auth');

// Login punkt
router.post('/login', validate(punktValidationSchemas.login), loginPunkt);

// Create punkt
router.post('/', validate(punktValidationSchemas.create), createPunkt);

// Get punkts for selection (punkt ID tanlash uchun, public endpoint)
router.get('/selection', cacheMiddleware(1800), getPunktsForSelection); // 30 min cache

// Get all punkts (with optional filters: ?status=active&viloyat=regionId&page=1&limit=10)
router.get('/', cacheMiddleware(1800), getAllPunkts); // 30 min cache

// Get punkt by ID
router.get('/:id', cacheMiddleware(3600), getPunktById); // 1 hour cache

// Update punkt
router.put('/:id', validate(punktValidationSchemas.update), updatePunkt);

// Delete punkt
router.delete('/:id', deletePunkt);

// Get contragents in punkt's region (o'z hududidagi contragentlar)
router.get('/data/contragents', punktAuth, cacheMiddleware(1800), getContragentsInRegion); // 30 min cache

// Notification routes for Punkt
router.get('/notifications/list', punktAuth, cacheMiddleware(60), getPunktNotifications); // 1 min cache
router.get('/notifications/unread-count', punktAuth, cacheMiddleware(30), getPunktUnreadCount); // 30 sec cache
router.post('/notifications/:notificationId/read', punktAuth, markPunktNotificationRead);
router.post('/notifications/read-all', punktAuth, markAllPunktNotificationsRead);

module.exports = router;



