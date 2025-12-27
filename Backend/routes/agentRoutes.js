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
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// Password setup (for new agents from vacancy applications)
router.post('/password-setup/step1', validate(agentValidationSchemas.passwordSetupStep1), passwordSetupStep1);
router.post('/password-setup/step2', validate(agentValidationSchemas.passwordSetupStep2), passwordSetupStep2);
router.post('/password-setup/step3', validate(agentValidationSchemas.passwordSetupStep3), passwordSetupStep3);

// Login agent
router.post('/login', validate(agentValidationSchemas.login), loginAgent);

// Create agent
router.post('/', validate(agentValidationSchemas.create), invalidateCache(['cache:/api/agents*']), createAgent);

// Get agents for selection (agent ID tanlash uchun, public endpoint)
router.get('/selection', redisCache(1800), getAgentsForSelection); // 30 daqiqa cache

// Get all agents (with optional filters: ?status=active&viloyat=regionId&tuman=districtId&mfy=mfyId&agentType=viloyat|tuman|mfy&page=1&limit=10)
router.get('/', redisCache(300), getAllAgents); // 5 daqiqa cache

// Get agent by ID
router.get('/:id', redisCache(600), getAgentById); // 10 daqiqa cache

// Update agent
router.put('/:id', validate(agentValidationSchemas.update), invalidateCache(['cache:/api/agents*']), updateAgent);

// Delete agent
router.delete('/:id', invalidateCache(['cache:/api/agents*']), deleteAgent);

// Notification routes for Agent (viloyat/tuman/mfy)
router.get('/notifications/list', agentAuth, redisCache(30), getAgentNotifications); // 30 sekund cache (user-specific)
router.get('/notifications/unread-count', agentAuth, redisCache(30), getAgentUnreadCount); // 30 sekund cache (user-specific)
router.post('/notifications/:notificationId/read', agentAuth, invalidateCache(['cache:/api/agents/notifications*']), markAgentNotificationRead);
router.post('/notifications/read-all', agentAuth, invalidateCache(['cache:/api/agents/notifications*']), markAllAgentNotificationsRead);

module.exports = router;



