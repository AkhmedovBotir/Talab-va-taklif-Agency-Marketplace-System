const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cache');
const {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
} = require('../controllers/adminController');
const {
  getAllCategoriesForAdmin,
  getAllSubcategoriesForAdmin,
  getAllProductsForAdmin,
  getProductByIdForAdmin,
  getCategoryByIdForAdmin,
  getAllSmsVerificationsForAdmin,
  getSmsVerificationByIdForAdmin,
  getAllMarketplaceUsersForAdmin,
  getMarketplaceUserByIdForAdmin,
  getAllOrdersForAdmin,
  getOrderByIdForAdmin,
  getMarketplaceOrdersForAdmin,
  getOrdersConfirmedByPunktForAdmin,
  getOrdersRequestedToContragentsForAdmin,
  getOrdersDeliveredToPunktForAdmin,
  getOrdersAssignedToAgentsForAdmin,
  getOrdersConfirmedByAgentsForAdmin,
  getOrdersConfirmedByCustomersForAdmin,
  getCancelledOrdersForAdmin,
  getSalesStatsByViloyats,
  getSalesStatsByTumans,
  getSalesStatsByMfys,
  getSalesStatsByViloyatId,
  getSalesStatsByTumanId,
  getSalesStatsByMfyId,
  getSalesStatsSummary,
  getAdminDashboardOverview,
  getAgentsInRegion,
  getPunktsInRegion,
  getArchivedPunkts,
  getArchivedAgents,
  getArchivedPunktWithWork,
  getArchivedAgentWithWork,
} = require('../controllers/adminDataController');
const {
  createKpiDistribution,
  getAllKpiDistributions,
  getKpiDistributionById,
  updateKpiDistribution,
  deleteKpiDistribution,
  getAllKpiTransactions,
  getKpiTransactionById,
  getKpiStatistics,
  getInitialKpiDistribution,
  getViloyatAgentsKpi,
  getTumanAgentsKpi,
  getMfyAgentsKpi,
  getPunktsKpi,
  getAgentKpiDetails,
  getPunktKpiDetails,
} = require('../controllers/adminKpiController');
const {
  getAllPartnershipRequests,
  getPartnershipRequestById,
  updateContactStatus,
  updateRequestStatus,
  convertPartnershipRequestToContragent,
} = require('../controllers/partnershipRequestController');
const {
  createVacancy,
  getVacancies,
  getVacancyById,
  updateVacancy,
  deleteVacancy,
} = require('../controllers/vacancyController');
const {
  getApplicationsByVacancy,
  getApplicationById,
  decideApplication,
  addInterviewStage,
  updateInterviewStage,
  deleteInterviewStage,
  getInterviewStage,
  submitInterviewResult,
  makeFinalDecision,
} = require('../controllers/adminVacancyApplicationController');
const {
  updateFeaturedContragents,
  getFeaturedContragentsForAdmin,
} = require('../controllers/featuredContragentController');
const {
  validate,
  adminValidationSchemas,
  partnershipRequestValidationSchemas,
  featuredContragentValidationSchemas,
} = require('../middleware/validation');
const { adminAuth } = require('../middleware/auth');

// Login admin
router.post('/login', validate(adminValidationSchemas.login), loginAdmin);

// Create admin
router.post('/', validate(adminValidationSchemas.create), createAdmin);

// Get all admins
router.get('/', cacheMiddleware(1800), getAllAdmins); // 30 min cache

// Admin data endpoints (require authentication) - MUST be before /:id route
// Dashboard overview
router.get('/dashboard/overview', adminAuth, cacheMiddleware(300), getAdminDashboardOverview); // 5 min cache

// Get all categories (for admin)
router.get('/data/categories', adminAuth, cacheMiddleware(3600), getAllCategoriesForAdmin); // 1 hour cache

// Get all subcategories (for admin)
router.get('/data/subcategories', adminAuth, cacheMiddleware(3600), getAllSubcategoriesForAdmin); // 1 hour cache

// Get category by ID (for admin)
router.get('/data/categories/:id', adminAuth, cacheMiddleware(3600), getCategoryByIdForAdmin); // 1 hour cache

// Get all products (for admin with advanced filters)
router.get('/data/products', adminAuth, cacheMiddleware(1800), getAllProductsForAdmin); // 30 min cache

// Get product by ID (for admin)
router.get('/data/products/:id', adminAuth, cacheMiddleware(3600), getProductByIdForAdmin); // 1 hour cache

// Get all SMS verifications (for admin)
router.get('/data/sms-verifications', adminAuth, cacheMiddleware(300), getAllSmsVerificationsForAdmin); // 5 min cache

// Get SMS verification by ID (for admin)
router.get('/data/sms-verifications/:id', adminAuth, cacheMiddleware(300), getSmsVerificationByIdForAdmin); // 5 min cache

// Get all marketplace users (for admin)
router.get('/data/marketplace-users', adminAuth, cacheMiddleware(1800), getAllMarketplaceUsersForAdmin); // 30 min cache

// Get marketplace user by ID (for admin)
router.get('/data/marketplace-users/:id', adminAuth, cacheMiddleware(3600), getMarketplaceUserByIdForAdmin); // 1 hour cache

// Get all orders (for admin) - Barcha buyurtmalar
router.get('/data/orders', adminAuth, cacheMiddleware(300), getAllOrdersForAdmin); // 5 min cache

// Get marketplace orders (Marketplace buyurtmalari) - MUST be before /:id route
router.get('/data/orders/marketplace', adminAuth, cacheMiddleware(300), getMarketplaceOrdersForAdmin); // 5 min cache

// Get orders confirmed by punkt but nothing done (Punkt qabul qilgan) - MUST be before /:id route
router.get('/data/orders/confirmed-by-punkt', adminAuth, cacheMiddleware(300), getOrdersConfirmedByPunktForAdmin); // 5 min cache

// Get orders requested to contragents (Kontragentlarga yuborilgan) - MUST be before /:id route
router.get('/data/orders/requested-to-contragents', adminAuth, cacheMiddleware(300), getOrdersRequestedToContragentsForAdmin); // 5 min cache

// Get orders delivered to punkt (Kontragent punktga yetkazgan) - MUST be before /:id route
router.get('/data/orders/delivered-to-punkt', adminAuth, cacheMiddleware(300), getOrdersDeliveredToPunktForAdmin); // 5 min cache

// Get orders assigned to agents (Agentga yuborilgan) - MUST be before /:id route
router.get('/data/orders/assigned-to-agents', adminAuth, cacheMiddleware(300), getOrdersAssignedToAgentsForAdmin); // 5 min cache

// Get orders confirmed by agents (Agent topshirgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/confirmed-by-agents', adminAuth, cacheMiddleware(300), getOrdersConfirmedByAgentsForAdmin); // 5 min cache

// Get orders confirmed by customers (Foydalanuvchi qabul qilgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/confirmed-by-customers', adminAuth, cacheMiddleware(300), getOrdersConfirmedByCustomersForAdmin); // 5 min cache

// Get cancelled orders (Qaytarilgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/cancelled', adminAuth, cacheMiddleware(300), getCancelledOrdersForAdmin); // 5 min cache

// Get order by ID (for admin) - MUST be last to avoid conflicts with specific routes
router.get('/data/orders/:id', adminAuth, cacheMiddleware(300), getOrderByIdForAdmin); // 5 min cache

// Get agents in region (o'z hududidagi agentlar)
router.get('/data/agents', adminAuth, cacheMiddleware(1800), getAgentsInRegion); // 30 min cache

// Get punkts in region (o'z hududidagi punktlar)
router.get('/data/punkts', adminAuth, cacheMiddleware(1800), getPunktsInRegion); // 30 min cache

// Archive endpoints (Arxiv API)
router.get('/archive/punkts', adminAuth, cacheMiddleware(1800), getArchivedPunkts); // 30 min cache
router.get('/archive/agents', adminAuth, cacheMiddleware(1800), getArchivedAgents); // 30 min cache
router.get('/archive/punkts/:id/work', adminAuth, cacheMiddleware(1800), getArchivedPunktWithWork); // 30 min cache
router.get('/archive/agents/:id/work', adminAuth, cacheMiddleware(1800), getArchivedAgentWithWork); // 30 min cache

// Sales Statistics endpoints
router.get('/stats/sales/summary', adminAuth, cacheMiddleware(300), getSalesStatsSummary); // 5 min cache
router.get('/stats/sales/viloyats', adminAuth, cacheMiddleware(1800), getSalesStatsByViloyats); // 30 min cache
router.get('/stats/sales/viloyats/:viloyatId', adminAuth, cacheMiddleware(1800), getSalesStatsByViloyatId); // 30 min cache
router.get('/stats/sales/tumans/:tumanId', adminAuth, cacheMiddleware(1800), getSalesStatsByTumanId); // 30 min cache
router.get('/stats/sales/mfys/:mfyId', adminAuth, cacheMiddleware(1800), getSalesStatsByMfyId); // 30 min cache

// KPI Bonus Distribution endpoints
router.post('/kpi/distributions', adminAuth, createKpiDistribution);
router.get('/kpi/distributions', adminAuth, cacheMiddleware(3600), getAllKpiDistributions); // 1 hour cache
router.get('/kpi/distributions/:id', adminAuth, cacheMiddleware(3600), getKpiDistributionById); // 1 hour cache
router.put('/kpi/distributions/:id', adminAuth, updateKpiDistribution);
router.delete('/kpi/distributions/:id', adminAuth, deleteKpiDistribution);
router.get('/kpi/distributions/initial/defaults', adminAuth, cacheMiddleware(3600), getInitialKpiDistribution); // 1 hour cache

// KPI Bonus Transactions endpoints
router.get('/kpi/transactions', adminAuth, cacheMiddleware(300), getAllKpiTransactions); // 5 min cache
router.get('/kpi/transactions/:id', adminAuth, cacheMiddleware(300), getKpiTransactionById); // 5 min cache

// KPI Statistics
router.get('/kpi/statistics', adminAuth, cacheMiddleware(300), getKpiStatistics); // 5 min cache

// KPI Data endpoints - Agents and Punkts KPI
router.get('/kpi/data/viloyat-agents', adminAuth, cacheMiddleware(300), getViloyatAgentsKpi); // 5 min cache
router.get('/kpi/data/tuman-agents', adminAuth, cacheMiddleware(300), getTumanAgentsKpi); // 5 min cache
router.get('/kpi/data/mfy-agents', adminAuth, cacheMiddleware(300), getMfyAgentsKpi); // 5 min cache
router.get('/kpi/data/punkts', adminAuth, cacheMiddleware(300), getPunktsKpi); // 5 min cache
router.get('/kpi/data/agents/:agentId', adminAuth, cacheMiddleware(300), getAgentKpiDetails); // 5 min cache
router.get('/kpi/data/punkts/:punktId', adminAuth, cacheMiddleware(300), getPunktKpiDetails); // 5 min cache

// Featured contragents endpoints
router.get('/featured-contragents', adminAuth, cacheMiddleware(1800), getFeaturedContragentsForAdmin); // 30 min cache
router.put(
  '/featured-contragents',
  adminAuth,
  validate(featuredContragentValidationSchemas.updateFeaturedList),
  updateFeaturedContragents
);

// Partnership request endpoints
router.get('/partnership-requests', adminAuth, cacheMiddleware(300), getAllPartnershipRequests); // 5 min cache
router.get('/partnership-requests/:id', adminAuth, cacheMiddleware(300), getPartnershipRequestById); // 5 min cache
router.patch('/partnership-requests/:id/contact-status', adminAuth, validate(partnershipRequestValidationSchemas.updateContactStatus), updateContactStatus);
router.patch('/partnership-requests/:id/status', adminAuth, validate(partnershipRequestValidationSchemas.updateRequestStatus), updateRequestStatus);
router.post('/partnership-requests/:id/convert-to-contragent', adminAuth, convertPartnershipRequestToContragent);

// Vacancies (admin only)
router.post('/vacancies', adminAuth, createVacancy);
router.get('/vacancies', adminAuth, cacheMiddleware(1800), getVacancies); // 30 min cache
router.get('/vacancies/:id', adminAuth, cacheMiddleware(3600), getVacancyById); // 1 hour cache
router.put('/vacancies/:id', adminAuth, updateVacancy);
router.delete('/vacancies/:id', adminAuth, deleteVacancy);

// Vacancy Applications (admin only)
// Get all applications for a vacancy
router.get('/vacancies/:vacancyId/applications', adminAuth, cacheMiddleware(300), getApplicationsByVacancy); // 5 min cache
// Get application by ID
router.get('/applications/:id', adminAuth, cacheMiddleware(300), getApplicationById); // 5 min cache
// Accept or reject application
router.post('/applications/:id/decide', adminAuth, decideApplication);
// Add interview stage
router.post('/applications/:id/interview-stages', adminAuth, addInterviewStage);
// Get interview stage by ID
router.get('/applications/:id/interview-stages/:stageId', adminAuth, cacheMiddleware(300), getInterviewStage); // 5 min cache
// Update interview stage
router.put('/applications/:id/interview-stages/:stageId', adminAuth, updateInterviewStage);
// Submit interview result
router.post('/applications/:id/interview-stages/:stageId/result', adminAuth, submitInterviewResult);
// Delete interview stage
router.delete('/applications/:id/interview-stages/:stageId', adminAuth, deleteInterviewStage);
// Make final decision
router.post('/applications/:id/final-decision', adminAuth, makeFinalDecision);

// Get admin by ID (must be after /data/* routes)
router.get('/:id', cacheMiddleware(3600), getAdminById); // 1 hour cache

// Update admin
router.put('/:id', validate(adminValidationSchemas.update), updateAdmin);

// Delete admin
router.delete('/:id', deleteAdmin);

module.exports = router;

