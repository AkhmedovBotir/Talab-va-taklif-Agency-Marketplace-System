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

// Admin routes
router.post('/', adminAuth, createNotification);
router.get('/', adminAuth, getAllNotifications);
router.get('/stats', adminAuth, getNotificationStats);
router.get('/:id', adminAuth, getNotificationById);
router.put('/:id', adminAuth, updateNotification);
router.delete('/:id', adminAuth, deleteNotification);

// User routes (for punkts, agents, marketplace users)
router.get('/my/:userType/:userId', getMyNotifications);
router.post('/:notificationId/read', markAsRead);

module.exports = router;


