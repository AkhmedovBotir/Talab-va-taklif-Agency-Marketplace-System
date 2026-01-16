const express = require('express');
const router = express.Router();
const {
  createViloyatManager,
  getAllViloyatManagers,
  getViloyatManagerById,
  updateViloyatManager,
  deleteViloyatManager,
  loginViloyatManager,
  getPunktsInViloyat,
  getAgentsInViloyat,
  getContragentsInViloyat,
  getDokonsInViloyat,
  // Tuman kontragentlari sotuvi
  getAllTumanOrdersForManager,
  getTumanOrdersFromMarketplaceForManager,
  getTumanOrdersConfirmedByPunktForManager,
  getTumanOrdersRequestedToContragentsForManager,
  getTumanOrdersDeliveredToPunktForManager,
  getTumanOrdersAssignedToAgentsForManager,
  getTumanOrdersConfirmedByAgentsForManager,
  getTumanOrdersConfirmedByCustomersForManager,
  getCancelledTumanOrdersForManager,
  // Maxalla do'konlari sotuvi
  getAllMaxallaOrdersForManager,
  getMaxallaOrdersFromMarketplaceForManager,
  getMaxallaOrdersRequestedToContragentsForManager,
  getMaxallaOrdersConfirmedByCustomersForManager,
  getCancelledMaxallaOrdersForManager,
  getTumansInViloyat,
} = require('../controllers/viloyatManagerController');
const { adminAuth, viloyatManagerAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { viloyatManagerValidationSchemas } = require('../middleware/validation');

// Public routes
router.post('/login', validate(viloyatManagerValidationSchemas.login), loginViloyatManager);

// Admin routes (CRUD operations)
router.post('/', adminAuth, validate(viloyatManagerValidationSchemas.create), createViloyatManager);
router.get('/', adminAuth, getAllViloyatManagers);
router.get('/:id', adminAuth, getViloyatManagerById);
router.put('/:id', adminAuth, validate(viloyatManagerValidationSchemas.update), updateViloyatManager);
router.delete('/:id', adminAuth, deleteViloyatManager);

// ==================== MANAGER DATA ROUTES ====================
// Manager o'z viloyatidagi ma'lumotlarni olish

// Get punkts in manager's viloyat
router.get('/data/punkts', viloyatManagerAuth, getPunktsInViloyat);

// Get agents in manager's viloyat
router.get('/data/agents', viloyatManagerAuth, getAgentsInViloyat);

// Get contragents in manager's viloyat
router.get('/data/contragents', viloyatManagerAuth, getContragentsInViloyat);

// Get dokons (mfy contragents) in manager's viloyat
router.get('/data/dokons', viloyatManagerAuth, getDokonsInViloyat);

// Get tumans in manager's viloyat
router.get('/data/tumans', viloyatManagerAuth, getTumansInViloyat);

// ==================== MANAGER ORDER ROUTES ====================
// Manager o'z viloyatidagi buyurtmalarni kuzatish

// ==================== TUMAN KONTRAGENTLARI SOTUVI ====================

// Get all tuman orders in manager's viloyat
router.get('/orders/tuman', viloyatManagerAuth, getAllTumanOrdersForManager);

// Get tuman orders from marketplace
router.get('/orders/tuman/marketplace', viloyatManagerAuth, getTumanOrdersFromMarketplaceForManager);

// Get tuman orders confirmed by punkt
router.get('/orders/tuman/confirmed-by-punkt', viloyatManagerAuth, getTumanOrdersConfirmedByPunktForManager);

// Get tuman orders requested to contragents
router.get('/orders/tuman/requested-to-contragents', viloyatManagerAuth, getTumanOrdersRequestedToContragentsForManager);

// Get tuman orders delivered to punkt
router.get('/orders/tuman/delivered-to-punkt', viloyatManagerAuth, getTumanOrdersDeliveredToPunktForManager);

// Get tuman orders assigned to agents
router.get('/orders/tuman/assigned-to-agents', viloyatManagerAuth, getTumanOrdersAssignedToAgentsForManager);

// Get tuman orders confirmed by agents
router.get('/orders/tuman/confirmed-by-agents', viloyatManagerAuth, getTumanOrdersConfirmedByAgentsForManager);

// Get tuman orders confirmed by customers
router.get('/orders/tuman/confirmed-by-customers', viloyatManagerAuth, getTumanOrdersConfirmedByCustomersForManager);

// Get cancelled tuman orders
router.get('/orders/tuman/cancelled', viloyatManagerAuth, getCancelledTumanOrdersForManager);

// ==================== MAXALLA DO'KONLARI SOTUVI ====================

// Get all maxalla orders in manager's viloyat
router.get('/orders/maxalla', viloyatManagerAuth, getAllMaxallaOrdersForManager);

// Get maxalla orders from marketplace
router.get('/orders/maxalla/marketplace', viloyatManagerAuth, getMaxallaOrdersFromMarketplaceForManager);

// Get maxalla orders requested to contragents
router.get('/orders/maxalla/requested-to-contragents', viloyatManagerAuth, getMaxallaOrdersRequestedToContragentsForManager);

// Get maxalla orders confirmed by customers
router.get('/orders/maxalla/confirmed-by-customers', viloyatManagerAuth, getMaxallaOrdersConfirmedByCustomersForManager);

// Get cancelled maxalla orders
router.get('/orders/maxalla/cancelled', viloyatManagerAuth, getCancelledMaxallaOrdersForManager);

module.exports = router;
