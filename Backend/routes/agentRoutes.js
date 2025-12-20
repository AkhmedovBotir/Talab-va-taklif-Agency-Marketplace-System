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
  getAgentNotifications,
  getAgentUnreadCount,
  markAgentNotificationRead,
  markAllAgentNotificationsRead,
} = require('../controllers/notificationController');
const { validate, agentValidationSchemas } = require('../middleware/validation');
const { agentAuth } = require('../middleware/auth');

// Login agent
router.post('/login', validate(agentValidationSchemas.login), loginAgent);

// Create agent
router.post('/', validate(agentValidationSchemas.create), createAgent);

// Get agents for selection (agent ID tanlash uchun, public endpoint)
router.get('/selection', getAgentsForSelection);

// Get all agents (with optional filters: ?status=active&viloyat=regionId&tuman=districtId&mfy=mfyId&agentType=viloyat|tuman|mfy&page=1&limit=10)
router.get('/', getAllAgents);

// Get agent by ID
router.get('/:id', getAgentById);

// Update agent
router.put('/:id', validate(agentValidationSchemas.update), updateAgent);

// Delete agent
router.delete('/:id', deleteAgent);

// Notification routes for Agent (viloyat/tuman/mfy)
router.get('/notifications/list', agentAuth, getAgentNotifications);
router.get('/notifications/unread-count', agentAuth, getAgentUnreadCount);
router.post('/notifications/:notificationId/read', agentAuth, markAgentNotificationRead);
router.post('/notifications/read-all', agentAuth, markAllAgentNotificationsRead);

module.exports = router;



