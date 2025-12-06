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
const { vacancyApplicantAuth } = require('../middleware/auth');

// All routes require authentication
router.use(vacancyApplicantAuth);

// Get all vacancies (with filters)
router.get('/vacancies', getVacancies);

// Get vacancy by ID
router.get('/vacancies/:id', getVacancyById);

// Track vacancy view
router.post('/vacancies/:id/view', trackVacancyView);

// Apply to vacancy
router.post('/vacancies/:id/apply', applyToVacancy);

// Get my applications
router.get('/applications', getMyApplications);

// Get application by ID (with full details)
router.get('/applications/:id', getApplicationById);

// Get application evaluations
router.get('/applications/:id/evaluations', getApplicationEvaluations);

// Get application interview stages
router.get('/applications/:id/interview-stages', getApplicationInterviewStages);

// Get single interview stage by ID
router.get('/applications/:id/interview-stages/:stageId', getInterviewStageById);

// Respond to final decision
router.post('/applications/:id/final-decision/respond', respondToFinalDecision);

// Toggle bookmark
router.post('/vacancies/:id/bookmark', toggleBookmark);

// Get bookmarked vacancies
router.get('/bookmarks', getBookmarkedVacancies);

module.exports = router;

