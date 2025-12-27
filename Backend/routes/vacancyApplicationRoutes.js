const express = require('express');
const router = express.Router();
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
const { redisCache, invalidateCache } = require('../middleware/redisCache');

// All routes require authentication
router.use(vacancyApplicantAuth);

// Get all vacancies (with filters)
router.get('/vacancies', redisCache(300), getVacancies); // 5 daqiqa cache

// Get vacancy by ID
router.get('/vacancies/:id', redisCache(600), getVacancyById); // 10 daqiqa cache

// Track vacancy view
router.post('/vacancies/:id/view', invalidateCache(['cache:/api/vacancy/vacancies/:id*']), trackVacancyView);

// Apply to vacancy
router.post('/vacancies/:id/apply', invalidateCache(['cache:/api/vacancy/applications*', 'cache:/api/vacancy/vacancies/:id*']), applyToVacancy);

// Get my applications
router.get('/applications', redisCache(60), getMyApplications); // 1 daqiqa cache (user-specific)

// Get application by ID (with full details)
router.get('/applications/:id', redisCache(60), getApplicationById); // 1 daqiqa cache (user-specific)

// Get application evaluations
router.get('/applications/:id/evaluations', redisCache(60), getApplicationEvaluations); // 1 daqiqa cache (user-specific)

// Get application interview stages
router.get('/applications/:id/interview-stages', redisCache(60), getApplicationInterviewStages); // 1 daqiqa cache (user-specific)

// Get single interview stage by ID
router.get('/applications/:id/interview-stages/:stageId', redisCache(60), getInterviewStageById); // 1 daqiqa cache (user-specific)

// Respond to final decision
router.post('/applications/:id/final-decision/respond', invalidateCache(['cache:/api/vacancy/applications*']), respondToFinalDecision);

// Toggle bookmark
router.post('/vacancies/:id/bookmark', invalidateCache(['cache:/api/vacancy/bookmarks*']), toggleBookmark);

// Get bookmarked vacancies
router.get('/bookmarks', redisCache(60), getBookmarkedVacancies); // 1 daqiqa cache (user-specific)

// Notifications
router.get('/notifications/list', redisCache(30), getVacancyNotifications); // 30 sekund cache (user-specific)
router.get('/notifications/unread-count', redisCache(30), getVacancyUnreadCount); // 30 sekund cache (user-specific)
router.post('/notifications/:notificationId/read', invalidateCache(['cache:/api/vacancy/notifications*']), markVacancyNotificationRead);
router.post('/notifications/read-all', invalidateCache(['cache:/api/vacancy/notifications*']), markAllVacancyNotificationsRead);

module.exports = router;

