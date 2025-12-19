const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const {
  getVacancies,
  getVacancyById,
  applyToVacancy,
  getMyApplications,
  getApplicationById,
  getApplicationEvaluations,
  getApplicationInterviewStages,
  getInterviewStageById,
  respondToFinalDecision,
  toggleBookmark,
  getBookmarkedVacancies,
  trackVacancyView,
} = require('../controllers/vacancyApplicationController');
const {
  getVacancyNotifications,
  getVacancyUnreadCount,
  markVacancyNotificationRead,
  markAllVacancyNotificationsRead,
} = require('../controllers/notificationController');
const { vacancyApplicantAuth } = require('../middleware/auth');

// All routes require authentication
router.use(vacancyApplicantAuth);

// Get all vacancies (with filters)
router.get('/vacancies', cacheMiddleware(1800), getVacancies); // 30 min cache

// Get vacancy by ID
router.get('/vacancies/:id', cacheMiddleware(3600), getVacancyById); // 1 hour cache

// Track vacancy view
router.post('/vacancies/:id/view', trackVacancyView);

// Apply to vacancy
router.post('/vacancies/:id/apply', applyToVacancy);

// Get my applications
router.get('/applications', cacheMiddleware(300), getMyApplications); // 5 min cache

// Get application by ID (with full details)
router.get('/applications/:id', cacheMiddleware(300), getApplicationById); // 5 min cache

// Get application evaluations
router.get('/applications/:id/evaluations', cacheMiddleware(300), getApplicationEvaluations); // 5 min cache

// Get application interview stages
router.get('/applications/:id/interview-stages', cacheMiddleware(300), getApplicationInterviewStages); // 5 min cache

// Get single interview stage by ID
router.get('/applications/:id/interview-stages/:stageId', cacheMiddleware(300), getInterviewStageById); // 5 min cache

// Respond to final decision
router.post('/applications/:id/final-decision/respond', respondToFinalDecision);

// Toggle bookmark
router.post('/vacancies/:id/bookmark', toggleBookmark);

// Get bookmarked vacancies
router.get('/bookmarks', cacheMiddleware(300), getBookmarkedVacancies); // 5 min cache

// Notifications
router.get('/notifications/list', cacheMiddleware(60), getVacancyNotifications); // 1 min cache
router.get('/notifications/unread-count', cacheMiddleware(30), getVacancyUnreadCount); // 30 sec cache
router.post('/notifications/:notificationId/read', markVacancyNotificationRead);
router.post('/notifications/read-all', markAllVacancyNotificationsRead);

module.exports = router;

