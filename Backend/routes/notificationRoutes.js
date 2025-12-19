const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
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

// Admin routes
router.post('/', adminAuth, createNotification);
router.get('/', adminAuth, cacheMiddleware(300), getAllNotifications); // 5 min cache
router.get('/stats', adminAuth, cacheMiddleware(300), getNotificationStats); // 5 min cache
router.get('/:id', adminAuth, cacheMiddleware(300), getNotificationById); // 5 min cache
router.put('/:id', adminAuth, updateNotification);
router.delete('/:id', adminAuth, deleteNotification);

// User routes (for punkts, agents, marketplace users)
router.get('/my/:userType/:userId', cacheMiddleware(60), getMyNotifications); // 1 min cache
router.post('/:notificationId/read', markAsRead);

module.exports = router;


