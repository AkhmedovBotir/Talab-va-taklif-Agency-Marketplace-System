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
router.get('/', getAllAdmins);

// Admin data endpoints (require authentication) - MUST be before /:id route
// Dashboard overview
router.get('/dashboard/overview', adminAuth, getAdminDashboardOverview);

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

router.get('/dashboard/statistics', adminAuth, getDashboardStatistics);
router.get('/dashboard/statistics/daily', adminAuth, getDailyStatistics);
router.get('/dashboard/statistics/weekly', adminAuth, getWeeklyStatistics);
router.get('/dashboard/statistics/monthly', adminAuth, getMonthlyStatistics);
router.get('/dashboard/statistics/orders', adminAuth, getOrdersStatistics);
router.get('/dashboard/statistics/finance', adminAuth, getFinanceStatistics);
router.get('/dashboard/statistics/users', adminAuth, getUsersStatistics);
router.get('/dashboard/statistics/products', adminAuth, getProductsStatistics);

// Get all categories (for admin)
router.get('/data/categories', adminAuth, getAllCategoriesForAdmin);

// Get all subcategories (for admin)
router.get('/data/subcategories', adminAuth, getAllSubcategoriesForAdmin);

// Get category by ID (for admin - old endpoint, kept for backward compatibility)
router.get('/data/categories/:id', adminAuth, getCategoryByIdForAdmin);

// ==================== ADMIN CATEGORY MANAGEMENT ====================

// Category CRUD
router.post('/categories', adminAuth, validate(adminCategoryValidationSchemas.create), createCategory);
router.get('/categories', adminAuth, getAllCategories);

// Subcategory CRUD (MUST be before /categories/:id to avoid route conflict)
router.post('/categories/subcategories', adminAuth, validate(adminCategoryValidationSchemas.createSubcategory), createSubcategory);
router.get('/categories/subcategories', adminAuth, getAllSubcategories);
router.put('/categories/subcategories/:id', adminAuth, validate(adminCategoryValidationSchemas.updateSubcategory), updateSubcategory);
router.put('/categories/subcategories/:id/status', adminAuth, validate(adminCategoryValidationSchemas.updateStatus), updateCategoryStatus);
router.delete('/categories/subcategories/:id', adminAuth, deleteSubcategory);

// Category by ID (MUST be after /categories/subcategories to avoid route conflict)
router.get('/categories/:id', adminAuth, getCategoryById);
router.put('/categories/:id', adminAuth, validate(adminCategoryValidationSchemas.update), updateCategory);
router.put('/categories/:id/status', adminAuth, validate(adminCategoryValidationSchemas.updateStatus), updateCategoryStatus);
router.delete('/categories/:id', adminAuth, deleteCategory);

// Get all products (for admin with advanced filters)
router.get('/data/products', adminAuth, getAllProductsForAdmin);

// Update product
router.put('/products/:id', adminAuth, validate(adminProductModerationValidationSchemas.update), updateProduct);

// Get product by ID (for admin)
router.get('/data/products/:id', adminAuth, getProductByIdForAdmin);

// ==================== ADMIN PRODUCT MODERATION ====================

// Get all pending products
router.get('/products/moderation/pending', adminAuth, getPendingProducts);

// Get pending product by ID
router.get('/products/moderation/pending/:id', adminAuth, getPendingProductById);

// Get all products with moderation status filter
router.get('/products/moderation', adminAuth, getAllProductsForModeration);

// Approve product
router.post('/products/moderation/:id/approve', adminAuth, approveProduct);

// Reject product
router.post('/products/moderation/:id/reject', adminAuth, validate(adminProductModerationValidationSchemas.reject), rejectProduct);

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

// Get orders confirmed by punkt but nothing done (Punkt qabul qilgan) - MUST be before /:id route
router.get('/data/orders/confirmed-by-punkt', adminAuth, getOrdersConfirmedByPunktForAdmin);

// Get orders requested to contragents (Kontragentlarga yuborilgan) - MUST be before /:id route
router.get('/data/orders/requested-to-contragents', adminAuth, getOrdersRequestedToContragentsForAdmin);

// Get orders delivered to punkt (Kontragent punktga yetkazgan) - MUST be before /:id route
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

// Get agents in region (o'z hududidagi agentlar)
router.get('/data/agents', adminAuth, getAgentsInRegion);

// Get punkts in region (o'z hududidagi punktlar)
router.get('/data/punkts', adminAuth, getPunktsInRegion);

// Archive endpoints (Arxiv API)
router.get('/archive/punkts', adminAuth, getArchivedPunkts);
router.get('/archive/agents', adminAuth, getArchivedAgents);
router.get('/archive/punkts/:id/work', adminAuth, getArchivedPunktWithWork);
router.get('/archive/agents/:id/work', adminAuth, getArchivedAgentWithWork);

// Sales Statistics endpoints
router.get('/stats/sales/summary', adminAuth, getSalesStatsSummary);
router.get('/stats/sales/viloyats', adminAuth, getSalesStatsByViloyats);
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

router.get('/marketplace-partnership-requests', adminAuth, getAllMarketplacePartnershipRequests);
router.get('/marketplace-partnership-requests/:id', adminAuth, getMarketplacePartnershipRequestById);
router.patch('/marketplace-partnership-requests/:id/reviewing', adminAuth, updateStatusToReviewing);
router.patch('/marketplace-partnership-requests/:id/contacted', adminAuth, validate(marketplacePartnershipRequestValidationSchemas.updateContacted), updateStatusToContacted);
router.patch('/marketplace-partnership-requests/:id/approve', adminAuth, validate(marketplacePartnershipRequestValidationSchemas.approve), approveMarketplacePartnershipRequest);
router.patch('/marketplace-partnership-requests/:id/reject', adminAuth, validate(marketplacePartnershipRequestValidationSchemas.reject), rejectMarketplacePartnershipRequest);
router.post('/marketplace-partnership-requests/:id/convert-to-contragent', adminAuth, convertMarketplacePartnershipRequestToContragent);

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
// Convert application to Punkt
router.post('/applications/:id/convert-to-punkt', adminAuth, validate(adminVacancyApplicationValidationSchemas.convertToPunkt), convertApplicationToPunkt);
// Convert application to Agent
router.post('/applications/:id/convert-to-agent', adminAuth, validate(adminVacancyApplicationValidationSchemas.convertToAgent), convertApplicationToAgent);

// ==================== DEVICE MANAGEMENT ====================

// Get all devices
router.get('/devices', adminAuth, getAllDevices);

// Get device statistics
router.get('/devices/statistics', adminAuth, getDeviceStatistics);

// Get device by ID
router.get('/devices/:id', adminAuth, getDeviceById);

// Get user's devices
router.get('/devices/user/:userModel/:userId', adminAuth, getUserDevices);

// Deactivate device
router.put('/devices/:id/deactivate', adminAuth, deactivateDevice);

// Activate device
router.put('/devices/:id/activate', adminAuth, activateDevice);

// Delete device
router.delete('/devices/:id', adminAuth, deleteDevice);

// Get admin by ID (must be after /data/* routes)
router.get('/:id', getAdminById);

// Update admin
router.put('/:id', validate(adminValidationSchemas.update), updateAdmin);

// Delete admin
router.delete('/:id', deleteAdmin);

module.exports = router;
