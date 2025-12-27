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
  createCategory,
  createSubcategory,
  getAllCategories,
  getAllSubcategories,
  getCategoryById,
  updateCategory,
  updateSubcategory,
  updateCategoryStatus,
  deleteCategory,
  deleteSubcategory,
} = require('../controllers/adminCategoryController');
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
  getPendingProducts,
  getPendingProductById,
  approveProduct,
  rejectProduct,
  getAllProductsForModeration,
  updateProduct,
} = require('../controllers/adminProductModerationController');
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
  convertApplicationToPunkt,
  convertApplicationToAgent,
} = require('../controllers/adminVacancyApplicationController');
const {
  updateFeaturedContragents,
  getFeaturedContragentsForAdmin,
} = require('../controllers/featuredContragentController');
const {
  validate,
  adminValidationSchemas,
  adminCategoryValidationSchemas,
  adminProductModerationValidationSchemas,
  adminVacancyApplicationValidationSchemas,
  partnershipRequestValidationSchemas,
  marketplacePartnershipRequestValidationSchemas,
  featuredContragentValidationSchemas,
} = require('../middleware/validation');
const { adminAuth } = require('../middleware/auth');
const { redisCache, invalidateCache } = require('../middleware/redisCache');
const {
  getAllDevices,
  getDeviceById,
  getUserDevices,
  deactivateDevice,
  activateDevice,
  deleteDevice,
  getDeviceStatistics,
} = require('../controllers/adminDeviceController');

// Login admin
router.post('/login', validate(adminValidationSchemas.login), loginAdmin);

// Create admin
router.post('/', validate(adminValidationSchemas.create), createAdmin);

// Get all admins
router.get('/', redisCache(300), getAllAdmins); // 5 daqiqa cache

// Admin data endpoints (require authentication) - MUST be before /:id route
// Dashboard overview
router.get('/dashboard/overview', adminAuth, redisCache(60), getAdminDashboardOverview); // 1 daqiqa cache

// Dashboard statistics (for charts and graphs)
const {
  getDashboardStatistics,
  getDailyStatistics,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getOrdersStatistics,
  getFinanceStatistics,
  getUsersStatistics,
  getProductsStatistics,
} = require('../controllers/adminDashboardController');

router.get('/dashboard/statistics', adminAuth, redisCache(120), getDashboardStatistics); // 2 daqiqa cache
router.get('/dashboard/statistics/daily', adminAuth, redisCache(120), getDailyStatistics); // 2 daqiqa cache
router.get('/dashboard/statistics/weekly', adminAuth, redisCache(120), getWeeklyStatistics); // 2 daqiqa cache
router.get('/dashboard/statistics/monthly', adminAuth, redisCache(120), getMonthlyStatistics); // 2 daqiqa cache
router.get('/dashboard/statistics/orders', adminAuth, redisCache(120), getOrdersStatistics); // 2 daqiqa cache
router.get('/dashboard/statistics/finance', adminAuth, redisCache(120), getFinanceStatistics); // 2 daqiqa cache
router.get('/dashboard/statistics/users', adminAuth, redisCache(120), getUsersStatistics); // 2 daqiqa cache
router.get('/dashboard/statistics/products', adminAuth, redisCache(120), getProductsStatistics); // 2 daqiqa cache

// Get all categories (for admin)
router.get('/data/categories', adminAuth, redisCache(1800), getAllCategoriesForAdmin); // 30 daqiqa cache

// Get all subcategories (for admin)
router.get('/data/subcategories', adminAuth, redisCache(1800), getAllSubcategoriesForAdmin); // 30 daqiqa cache

// Get category by ID (for admin - old endpoint, kept for backward compatibility)
router.get('/data/categories/:id', adminAuth, redisCache(1800), getCategoryByIdForAdmin); // 30 daqiqa cache

// ==================== ADMIN CATEGORY MANAGEMENT ====================

// Category CRUD
router.post('/categories', adminAuth, validate(adminCategoryValidationSchemas.create), invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), createCategory);
router.get('/categories', adminAuth, redisCache(1800), getAllCategories); // 30 daqiqa cache

// Subcategory CRUD (MUST be before /categories/:id to avoid route conflict)
router.post('/categories/subcategories', adminAuth, validate(adminCategoryValidationSchemas.createSubcategory), invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), createSubcategory);
router.get('/categories/subcategories', adminAuth, redisCache(1800), getAllSubcategories); // 30 daqiqa cache
router.put('/categories/subcategories/:id', adminAuth, validate(adminCategoryValidationSchemas.updateSubcategory), invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), updateSubcategory);
router.put('/categories/subcategories/:id/status', adminAuth, validate(adminCategoryValidationSchemas.updateStatus), invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), updateCategoryStatus);
router.delete('/categories/subcategories/:id', adminAuth, invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), deleteSubcategory);

// Category by ID (MUST be after /categories/subcategories to avoid route conflict)
router.get('/categories/:id', adminAuth, redisCache(1800), getCategoryById); // 30 daqiqa cache
router.put('/categories/:id', adminAuth, validate(adminCategoryValidationSchemas.update), invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), updateCategory);
router.put('/categories/:id/status', adminAuth, validate(adminCategoryValidationSchemas.updateStatus), invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), updateCategoryStatus);
router.delete('/categories/:id', adminAuth, invalidateCache(['cache:/api/admins/categories*', 'cache:/api/admins/data/categories*', 'cache:/api/category*', 'cache:/api/marketplace/categories*']), deleteCategory);

// Get all products (for admin with advanced filters)
router.get('/data/products', adminAuth, redisCache(60), getAllProductsForAdmin); // 1 daqiqa cache

// Update product
router.put('/products/:id', adminAuth, validate(adminProductModerationValidationSchemas.update), invalidateCache(['cache:/api/admins/data/products*', 'cache:/api/admins/products/moderation*', 'cache:/api/product*', 'cache:/api/marketplace/products*']), updateProduct);

// Get product by ID (for admin)
router.get('/data/products/:id', adminAuth, redisCache(60), getProductByIdForAdmin); // 1 daqiqa cache

// ==================== ADMIN PRODUCT MODERATION ====================

// Get all pending products
router.get('/products/moderation/pending', adminAuth, redisCache(30), getPendingProducts); // 30 sekund cache

// Get pending product by ID
router.get('/products/moderation/pending/:id', adminAuth, redisCache(30), getPendingProductById); // 30 sekund cache

// Get all products with moderation status filter
router.get('/products/moderation', adminAuth, redisCache(60), getAllProductsForModeration); // 1 daqiqa cache

// Approve product
router.post('/products/moderation/:id/approve', adminAuth, invalidateCache(['cache:/api/admins/products/moderation*', 'cache:/api/product*', 'cache:/api/marketplace/products*']), approveProduct);

// Reject product
router.post('/products/moderation/:id/reject', adminAuth, validate(adminProductModerationValidationSchemas.reject), invalidateCache(['cache:/api/admins/products/moderation*']), rejectProduct);

// Get all SMS verifications (for admin)
router.get('/data/sms-verifications', adminAuth, redisCache(60), getAllSmsVerificationsForAdmin); // 1 daqiqa cache

// Get SMS verification by ID (for admin)
router.get('/data/sms-verifications/:id', adminAuth, redisCache(60), getSmsVerificationByIdForAdmin); // 1 daqiqa cache

// Get all marketplace users (for admin)
router.get('/data/marketplace-users', adminAuth, redisCache(60), getAllMarketplaceUsersForAdmin); // 1 daqiqa cache

// Get marketplace user by ID (for admin)
router.get('/data/marketplace-users/:id', adminAuth, redisCache(60), getMarketplaceUserByIdForAdmin); // 1 daqiqa cache

// Get all orders (for admin) - Barcha buyurtmalar
router.get('/data/orders', adminAuth, redisCache(30), getAllOrdersForAdmin); // 30 sekund cache

// Get marketplace orders (Marketplace buyurtmalari) - MUST be before /:id route
router.get('/data/orders/marketplace', adminAuth, redisCache(30), getMarketplaceOrdersForAdmin); // 30 sekund cache

// Get orders confirmed by punkt but nothing done (Punkt qabul qilgan) - MUST be before /:id route
router.get('/data/orders/confirmed-by-punkt', adminAuth, redisCache(30), getOrdersConfirmedByPunktForAdmin); // 30 sekund cache

// Get orders requested to contragents (Kontragentlarga yuborilgan) - MUST be before /:id route
router.get('/data/orders/requested-to-contragents', adminAuth, redisCache(30), getOrdersRequestedToContragentsForAdmin); // 30 sekund cache

// Get orders delivered to punkt (Kontragent punktga yetkazgan) - MUST be before /:id route
router.get('/data/orders/delivered-to-punkt', adminAuth, redisCache(30), getOrdersDeliveredToPunktForAdmin); // 30 sekund cache

// Get orders assigned to agents (Agentga yuborilgan) - MUST be before /:id route
router.get('/data/orders/assigned-to-agents', adminAuth, redisCache(30), getOrdersAssignedToAgentsForAdmin); // 30 sekund cache

// Get orders confirmed by agents (Agent topshirgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/confirmed-by-agents', adminAuth, redisCache(30), getOrdersConfirmedByAgentsForAdmin); // 30 sekund cache

// Get orders confirmed by customers (Foydalanuvchi qabul qilgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/confirmed-by-customers', adminAuth, redisCache(30), getOrdersConfirmedByCustomersForAdmin); // 30 sekund cache

// Get cancelled orders (Qaytarilgan buyurtmalar) - MUST be before /:id route
router.get('/data/orders/cancelled', adminAuth, redisCache(60), getCancelledOrdersForAdmin); // 1 daqiqa cache

// Get order by ID (for admin) - MUST be last to avoid conflicts with specific routes
router.get('/data/orders/:id', adminAuth, redisCache(30), getOrderByIdForAdmin); // 30 sekund cache

// Get agents in region (o'z hududidagi agentlar)
router.get('/data/agents', adminAuth, redisCache(300), getAgentsInRegion); // 5 daqiqa cache

// Get punkts in region (o'z hududidagi punktlar)
router.get('/data/punkts', adminAuth, redisCache(300), getPunktsInRegion); // 5 daqiqa cache

// Archive endpoints (Arxiv API)
router.get('/archive/punkts', adminAuth, redisCache(1800), getArchivedPunkts); // 30 daqiqa cache
router.get('/archive/agents', adminAuth, redisCache(1800), getArchivedAgents); // 30 daqiqa cache
router.get('/archive/punkts/:id/work', adminAuth, redisCache(1800), getArchivedPunktWithWork); // 30 daqiqa cache
router.get('/archive/agents/:id/work', adminAuth, redisCache(1800), getArchivedAgentWithWork); // 30 daqiqa cache

// Sales Statistics endpoints
router.get('/stats/sales/summary', adminAuth, redisCache(120), getSalesStatsSummary); // 2 daqiqa cache
router.get('/stats/sales/viloyats', adminAuth, redisCache(120), getSalesStatsByViloyats); // 2 daqiqa cache
router.get('/stats/sales/viloyats/:viloyatId', adminAuth, redisCache(120), getSalesStatsByViloyatId); // 2 daqiqa cache
router.get('/stats/sales/tumans/:tumanId', adminAuth, redisCache(120), getSalesStatsByTumanId); // 2 daqiqa cache
router.get('/stats/sales/mfys/:mfyId', adminAuth, redisCache(120), getSalesStatsByMfyId); // 2 daqiqa cache

// KPI Bonus Distribution endpoints
router.post('/kpi/distributions', adminAuth, createKpiDistribution);
router.get('/kpi/distributions', adminAuth, redisCache(1800), getAllKpiDistributions); // 30 daqiqa cache
router.get('/kpi/distributions/:id', adminAuth, redisCache(1800), getKpiDistributionById); // 30 daqiqa cache
router.put('/kpi/distributions/:id', adminAuth, invalidateCache(['cache:/api/admins/kpi/distributions*']), updateKpiDistribution);
router.delete('/kpi/distributions/:id', adminAuth, invalidateCache(['cache:/api/admins/kpi/distributions*']), deleteKpiDistribution);
router.get('/kpi/distributions/initial/defaults', adminAuth, redisCache(1800), getInitialKpiDistribution); // 30 daqiqa cache

// KPI Bonus Transactions endpoints
router.get('/kpi/transactions', adminAuth, redisCache(120), getAllKpiTransactions); // 2 daqiqa cache
router.get('/kpi/transactions/:id', adminAuth, redisCache(120), getKpiTransactionById); // 2 daqiqa cache

// KPI Statistics
router.get('/kpi/statistics', adminAuth, redisCache(120), getKpiStatistics); // 2 daqiqa cache

// KPI Data endpoints - Agents and Punkts KPI
router.get('/kpi/data/viloyat-agents', adminAuth, redisCache(300), getViloyatAgentsKpi); // 5 daqiqa cache
router.get('/kpi/data/tuman-agents', adminAuth, redisCache(300), getTumanAgentsKpi); // 5 daqiqa cache
router.get('/kpi/data/mfy-agents', adminAuth, redisCache(300), getMfyAgentsKpi); // 5 daqiqa cache
router.get('/kpi/data/punkts', adminAuth, redisCache(300), getPunktsKpi); // 5 daqiqa cache
router.get('/kpi/data/agents/:agentId', adminAuth, redisCache(300), getAgentKpiDetails); // 5 daqiqa cache
router.get('/kpi/data/punkts/:punktId', adminAuth, redisCache(300), getPunktKpiDetails); // 5 daqiqa cache

// Featured contragents endpoints
router.get('/featured-contragents', adminAuth, redisCache(600), getFeaturedContragentsForAdmin); // 10 daqiqa cache
router.put(
  '/featured-contragents',
  adminAuth,
  validate(featuredContragentValidationSchemas.updateFeaturedList),
  invalidateCache(['cache:/api/admins/featured-contragents*', 'cache:/api/marketplace/featured-contragents*']),
  updateFeaturedContragents
);

// Partnership request endpoints
router.get('/partnership-requests', adminAuth, redisCache(60), getAllPartnershipRequests); // 1 daqiqa cache
router.get('/partnership-requests/:id', adminAuth, redisCache(60), getPartnershipRequestById); // 1 daqiqa cache
router.patch('/partnership-requests/:id/contact-status', adminAuth, validate(partnershipRequestValidationSchemas.updateContactStatus), invalidateCache(['cache:/api/admins/partnership-requests*']), updateContactStatus);
router.patch('/partnership-requests/:id/status', adminAuth, validate(partnershipRequestValidationSchemas.updateRequestStatus), invalidateCache(['cache:/api/admins/partnership-requests*']), updateRequestStatus);
router.post('/partnership-requests/:id/convert-to-contragent', adminAuth, invalidateCache(['cache:/api/admins/partnership-requests*', 'cache:/api/contragents*']), convertPartnershipRequestToContragent);

// Marketplace partnership request endpoints (new system)
const {
  getAllMarketplacePartnershipRequests,
  getMarketplacePartnershipRequestById,
  updateStatusToReviewing,
  updateStatusToContacted,
  approveMarketplacePartnershipRequest,
  rejectMarketplacePartnershipRequest,
  convertMarketplacePartnershipRequestToContragent,
} = require('../controllers/marketplacePartnershipRequestController');

router.get('/marketplace-partnership-requests', adminAuth, redisCache(60), getAllMarketplacePartnershipRequests); // 1 daqiqa cache
router.get('/marketplace-partnership-requests/:id', adminAuth, redisCache(60), getMarketplacePartnershipRequestById); // 1 daqiqa cache
router.patch('/marketplace-partnership-requests/:id/reviewing', adminAuth, invalidateCache(['cache:/api/admins/marketplace-partnership-requests*']), updateStatusToReviewing);
router.patch('/marketplace-partnership-requests/:id/contacted', adminAuth, validate(marketplacePartnershipRequestValidationSchemas.updateContacted), invalidateCache(['cache:/api/admins/marketplace-partnership-requests*']), updateStatusToContacted);
router.patch('/marketplace-partnership-requests/:id/approve', adminAuth, validate(marketplacePartnershipRequestValidationSchemas.approve), invalidateCache(['cache:/api/admins/marketplace-partnership-requests*', 'cache:/api/contragents*']), approveMarketplacePartnershipRequest);
router.patch('/marketplace-partnership-requests/:id/reject', adminAuth, validate(marketplacePartnershipRequestValidationSchemas.reject), invalidateCache(['cache:/api/admins/marketplace-partnership-requests*']), rejectMarketplacePartnershipRequest);
router.post('/marketplace-partnership-requests/:id/convert-to-contragent', adminAuth, invalidateCache(['cache:/api/admins/marketplace-partnership-requests*', 'cache:/api/contragents*']), convertMarketplacePartnershipRequestToContragent);

// Vacancies (admin only)
router.post('/vacancies', adminAuth, createVacancy);
router.get('/vacancies', adminAuth, redisCache(300), getVacancies); // 5 daqiqa cache
router.get('/vacancies/:id', adminAuth, redisCache(600), getVacancyById); // 10 daqiqa cache
router.put('/vacancies/:id', adminAuth, invalidateCache(['cache:/api/admins/vacancies*', 'cache:/api/vacancy/vacancies*']), updateVacancy);
router.delete('/vacancies/:id', adminAuth, invalidateCache(['cache:/api/admins/vacancies*', 'cache:/api/vacancy/vacancies*']), deleteVacancy);

// Vacancy Applications (admin only)
// Get all applications for a vacancy
router.get('/vacancies/:vacancyId/applications', adminAuth, redisCache(60), getApplicationsByVacancy); // 1 daqiqa cache
// Get application by ID
router.get('/applications/:id', adminAuth, redisCache(60), getApplicationById); // 1 daqiqa cache
// Accept or reject application
router.post('/applications/:id/decide', adminAuth, invalidateCache(['cache:/api/admins/applications*', 'cache:/api/admins/vacancies*']), decideApplication);
// Add interview stage
router.post('/applications/:id/interview-stages', adminAuth, invalidateCache(['cache:/api/admins/applications*']), addInterviewStage);
// Get interview stage by ID
router.get('/applications/:id/interview-stages/:stageId', adminAuth, redisCache(60), getInterviewStage); // 1 daqiqa cache
// Update interview stage
router.put('/applications/:id/interview-stages/:stageId', adminAuth, invalidateCache(['cache:/api/admins/applications*']), updateInterviewStage);
// Submit interview result
router.post('/applications/:id/interview-stages/:stageId/result', adminAuth, invalidateCache(['cache:/api/admins/applications*']), submitInterviewResult);
// Delete interview stage
router.delete('/applications/:id/interview-stages/:stageId', adminAuth, invalidateCache(['cache:/api/admins/applications*']), deleteInterviewStage);
// Make final decision
router.post('/applications/:id/final-decision', adminAuth, invalidateCache(['cache:/api/admins/applications*', 'cache:/api/admins/vacancies*']), makeFinalDecision);
// Convert application to Punkt
router.post('/applications/:id/convert-to-punkt', adminAuth, validate(adminVacancyApplicationValidationSchemas.convertToPunkt), invalidateCache(['cache:/api/admins/applications*', 'cache:/api/punkts*']), convertApplicationToPunkt);
// Convert application to Agent
router.post('/applications/:id/convert-to-agent', adminAuth, validate(adminVacancyApplicationValidationSchemas.convertToAgent), invalidateCache(['cache:/api/admins/applications*', 'cache:/api/agents*']), convertApplicationToAgent);

// ==================== DEVICE MANAGEMENT ====================

// Get all devices
router.get('/devices', adminAuth, redisCache(60), getAllDevices); // 1 daqiqa cache

// Get device statistics
router.get('/devices/statistics', adminAuth, redisCache(120), getDeviceStatistics); // 2 daqiqa cache

// Get device by ID
router.get('/devices/:id', adminAuth, redisCache(60), getDeviceById); // 1 daqiqa cache

// Get user's devices
router.get('/devices/user/:userModel/:userId', adminAuth, redisCache(60), getUserDevices); // 1 daqiqa cache

// Deactivate device
router.put('/devices/:id/deactivate', adminAuth, invalidateCache(['cache:/api/admins/devices*']), deactivateDevice);

// Activate device
router.put('/devices/:id/activate', adminAuth, invalidateCache(['cache:/api/admins/devices*']), activateDevice);

// Delete device
router.delete('/devices/:id', adminAuth, invalidateCache(['cache:/api/admins/devices*']), deleteDevice);

// Get admin by ID (must be after /data/* routes)
router.get('/:id', redisCache(300), getAdminById); // 5 daqiqa cache

// Update admin
router.put('/:id', validate(adminValidationSchemas.update), updateAdmin);

// Delete admin
router.delete('/:id', deleteAdmin);

module.exports = router;
