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
router.get('/selection', getPunktsForSelection);

// Get all punkts (with optional filters: ?status=active&viloyat=regionId&page=1&limit=10)
router.get('/', getAllPunkts);

// Get punkt by ID
router.get('/:id', getPunktById);

// Update punkt
router.put('/:id', validate(punktValidationSchemas.update), updatePunkt);

// Delete punkt
router.delete('/:id', deletePunkt);

// Get contragents in punkt's region (o'z hududidagi contragentlar)
router.get('/data/contragents', punktAuth, getContragentsInRegion);

// Notification routes for Punkt
router.get('/notifications/list', punktAuth, getPunktNotifications);
router.get('/notifications/unread-count', punktAuth, getPunktUnreadCount);
router.post('/notifications/:notificationId/read', punktAuth, markPunktNotificationRead);
router.post('/notifications/read-all', punktAuth, markAllPunktNotificationsRead);

module.exports = router;



