const express = require('express');
const router = express.Router();
const {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  loginAgent,
  getAgentsForSelection,
  getMyProfile,
} = require('../controllers/agentController');
const {
  passwordSetupStep1,
  passwordSetupStep2,
  passwordSetupStep3,
} = require('../controllers/agentAuthController');
const {
  getAgentNotifications,
  getAgentUnreadCount,
  markAgentNotificationRead,
  markAllAgentNotificationsRead,
} = require('../controllers/notificationController');
const { validate, agentValidationSchemas } = require('../middleware/validation');
const { agentAuth } = require('../middleware/auth');
const {
  payOrderToPunkt,
  getOrdersForPayment,
  getAgentTransactions,
  getAgentBalance,
} = require('../controllers/agentPaymentController');

// Password setup
router.post('/password-setup/step1', validate(agentValidationSchemas.passwordSetupStep1), passwordSetupStep1);
router.post('/password-setup/step2', validate(agentValidationSchemas.passwordSetupStep2), passwordSetupStep2);
router.post('/password-setup/step3', validate(agentValidationSchemas.passwordSetupStep3), passwordSetupStep3);

// Login agent
router.post('/login', validate(agentValidationSchemas.login), loginAgent);

// Create agent
router.post('/', validate(agentValidationSchemas.create), createAgent);

// Get agents for selection (agent ID tanlash uchun, public endpoint)
router.get('/selection', getAgentsForSelection);

// Get all agents (with optional filters: ?status=active&viloyat=regionId&tuman=districtId&mfy=mfyId&page=1&limit=10)
router.get('/', getAllAgents);

// Get agent by ID
router.get('/:id', getAgentById);

// Update agent
router.put('/:id', validate(agentValidationSchemas.update), updateAgent);

// Delete agent
router.delete('/:id', deleteAgent);

// Get current agent profile
router.get('/profile/me', agentAuth, getMyProfile);

// Notification routes for Agent (viloyat/tuman/mfy)
router.get('/notifications/list', agentAuth, getAgentNotifications);
router.get('/notifications/unread-count', agentAuth, getAgentUnreadCount);
router.post('/notifications/:notificationId/read', agentAuth, markAgentNotificationRead);
router.post('/notifications/read-all', agentAuth, markAllAgentNotificationsRead);

// ==================== AGENT PAYMENT ROUTES ====================

// Agent to'lov qilishi kerak bo'lgan buyurtmalarni olish
router.get('/payments/orders-for-payment', agentAuth, getOrdersForPayment);

// Agent punktga buyurtma uchun to'lov qilish
router.post('/payments/pay-to-punkt/:orderId', agentAuth, payOrderToPunkt);

// Agent o'zining tranzaksiyalarini olish
router.get('/payments/transactions', agentAuth, getAgentTransactions);

// Agent balansini olish
router.get('/payments/balance', agentAuth, getAgentBalance);

module.exports = router;



