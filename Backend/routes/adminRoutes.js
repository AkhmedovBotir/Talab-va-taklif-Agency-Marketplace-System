const express = require('express');
const router = express.Router();
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
router.get('/', getAllAdmins);

// Admin data endpoints (require authentication) - MUST be before /:id route
// Get all categories (for admin)
router.get('/data/categories', adminAuth, getAllCategoriesForAdmin);

// Get all subcategories (for admin)
router.get('/data/subcategories', adminAuth, getAllSubcategoriesForAdmin);

// Get category by ID (for admin)
router.get('/data/categories/:id', adminAuth, getCategoryByIdForAdmin);

// Get all products (for admin with advanced filters)
router.get('/data/products', adminAuth, getAllProductsForAdmin);

// Get product by ID (for admin)
router.get('/data/products/:id', adminAuth, getProductByIdForAdmin);

// Get all SMS verifications (for admin)
router.get('/data/sms-verifications', adminAuth, getAllSmsVerificationsForAdmin);

// Get SMS verification by ID (for admin)
router.get('/data/sms-verifications/:id', adminAuth, getSmsVerificationByIdForAdmin);

// Get all marketplace users (for admin)
router.get('/data/marketplace-users', adminAuth, getAllMarketplaceUsersForAdmin);

// Get marketplace user by ID (for admin)
router.get('/data/marketplace-users/:id', adminAuth, getMarketplaceUserByIdForAdmin);

// Get all orders (for admin) - Barcha buyurtmalar
router.get('/data/orders', adminAuth, getAllOrdersForAdmin);

// Get marketplace orders (Marketplace buyurtmalari) - MUST be before /:id route
router.get('/data/orders/marketplace', adminAuth, getMarketplaceOrdersForAdmin);

// Get orders delivered to punkt (Punktga yuborilgan) - MUST be before /:id route
router.get('/data/orders/delivered-to-punkt', adminAuth, getOrdersDeliveredToPunktForAdmin);

// Get orders assigned to agents (Agentga yuborilgan) - MUST be before /:id route
router.get('/data/orders/assigned-to-agents', adminAuth, getOrdersAssignedToAgentsForAdmin);

// Get orders confirmed by agents (Agent topshirgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/confirmed-by-agents', adminAuth, getOrdersConfirmedByAgentsForAdmin);

// Get orders confirmed by customers (Foydalanuvchi qabul qilgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/confirmed-by-customers', adminAuth, getOrdersConfirmedByCustomersForAdmin);

// Get cancelled orders (Qaytarilgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/cancelled', adminAuth, getCancelledOrdersForAdmin);

// Get order by ID (for admin) - MUST be last to avoid conflicts with specific routes
router.get('/data/orders/:id', adminAuth, getOrderByIdForAdmin);

// Sales Statistics endpoints
router.get('/stats/sales/summary', adminAuth, getSalesStatsSummary);
router.get('/stats/sales/viloyats', adminAuth, getSalesStatsByViloyats);
router.get('/stats/sales/tumans', adminAuth, getSalesStatsByTumans);
router.get('/stats/sales/mfys', adminAuth, getSalesStatsByMfys);
router.get('/stats/sales/viloyats/:viloyatId', adminAuth, getSalesStatsByViloyatId);
router.get('/stats/sales/tumans/:tumanId', adminAuth, getSalesStatsByTumanId);
router.get('/stats/sales/mfys/:mfyId', adminAuth, getSalesStatsByMfyId);

// KPI Bonus Distribution endpoints
router.post('/kpi/distributions', adminAuth, createKpiDistribution);
router.get('/kpi/distributions', adminAuth, getAllKpiDistributions);
router.get('/kpi/distributions/:id', adminAuth, getKpiDistributionById);
router.put('/kpi/distributions/:id', adminAuth, updateKpiDistribution);
router.delete('/kpi/distributions/:id', adminAuth, deleteKpiDistribution);
router.get('/kpi/distributions/initial/defaults', adminAuth, getInitialKpiDistribution);

// KPI Bonus Transactions endpoints
router.get('/kpi/transactions', adminAuth, getAllKpiTransactions);
router.get('/kpi/transactions/:id', adminAuth, getKpiTransactionById);

// KPI Statistics
router.get('/kpi/statistics', adminAuth, getKpiStatistics);

// KPI Data endpoints - Agents and Punkts KPI
router.get('/kpi/data/viloyat-agents', adminAuth, getViloyatAgentsKpi);
router.get('/kpi/data/tuman-agents', adminAuth, getTumanAgentsKpi);
router.get('/kpi/data/mfy-agents', adminAuth, getMfyAgentsKpi);
router.get('/kpi/data/punkts', adminAuth, getPunktsKpi);
router.get('/kpi/data/agents/:agentId', adminAuth, getAgentKpiDetails);
router.get('/kpi/data/punkts/:punktId', adminAuth, getPunktKpiDetails);

// Featured contragents endpoints
router.get('/featured-contragents', adminAuth, getFeaturedContragentsForAdmin);
router.put(
  '/featured-contragents',
  adminAuth,
  validate(featuredContragentValidationSchemas.updateFeaturedList),
  updateFeaturedContragents
);

// Partnership request endpoints
router.get('/partnership-requests', adminAuth, getAllPartnershipRequests);
router.get('/partnership-requests/:id', adminAuth, getPartnershipRequestById);
router.patch('/partnership-requests/:id/contact-status', adminAuth, validate(partnershipRequestValidationSchemas.updateContactStatus), updateContactStatus);
router.patch('/partnership-requests/:id/status', adminAuth, validate(partnershipRequestValidationSchemas.updateRequestStatus), updateRequestStatus);
router.post('/partnership-requests/:id/convert-to-contragent', adminAuth, convertPartnershipRequestToContragent);

// Vacancies (admin only)
router.post('/vacancies', adminAuth, createVacancy);
router.get('/vacancies', adminAuth, getVacancies);
router.get('/vacancies/:id', adminAuth, getVacancyById);
router.put('/vacancies/:id', adminAuth, updateVacancy);
router.delete('/vacancies/:id', adminAuth, deleteVacancy);

// Vacancy Applications (admin only)
// Get all applications for a vacancy
router.get('/vacancies/:vacancyId/applications', adminAuth, getApplicationsByVacancy);
// Get application by ID
router.get('/applications/:id', adminAuth, getApplicationById);
// Accept or reject application
router.post('/applications/:id/decide', adminAuth, decideApplication);
// Add interview stage
router.post('/applications/:id/interview-stages', adminAuth, addInterviewStage);
// Get interview stage by ID
router.get('/applications/:id/interview-stages/:stageId', adminAuth, getInterviewStage);
// Update interview stage
router.put('/applications/:id/interview-stages/:stageId', adminAuth, updateInterviewStage);
// Submit interview result
router.post('/applications/:id/interview-stages/:stageId/result', adminAuth, submitInterviewResult);
// Delete interview stage
router.delete('/applications/:id/interview-stages/:stageId', adminAuth, deleteInterviewStage);
// Make final decision
router.post('/applications/:id/final-decision', adminAuth, makeFinalDecision);

// Get admin by ID (must be after /data/* routes)
router.get('/:id', getAdminById);

// Update admin
router.put('/:id', validate(adminValidationSchemas.update), updateAdmin);

// Delete admin
router.delete('/:id', deleteAdmin);

module.exports = router;

