const express = require('express');
const router = express.Router();
const {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getMyNotifications,
  markAsRead,
  getNotificationStats,
} = require('../controllers/notificationController');
const { adminAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Admin routes
router.post('/', adminAuth, invalidateCache(['cache:/api/notifications*']), createNotification);
router.get('/', adminAuth, redisCache(30), getAllNotifications); // 30 sekund cache
router.get('/stats', adminAuth, redisCache(60), getNotificationStats); // 1 daqiqa cache
router.get('/:id', adminAuth, redisCache(60), getNotificationById); // 1 daqiqa cache
router.put('/:id', adminAuth, invalidateCache(['cache:/api/notifications*']), updateNotification);
router.delete('/:id', adminAuth, invalidateCache(['cache:/api/notifications*']), deleteNotification);

// User routes (for punkts, agents, marketplace users)
router.get('/my/:userType/:userId', redisCache(30), getMyNotifications); // 30 sekund cache
router.post('/:notificationId/read', invalidateCache(['cache:/api/notifications/my/*']), markAsRead);

module.exports = router;


