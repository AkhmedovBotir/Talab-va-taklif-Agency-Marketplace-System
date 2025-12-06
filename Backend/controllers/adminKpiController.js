const KpiBonusDistribution = require('../models/KpiBonusDistribution');
const KpiBonusTransaction = require('../models/KpiBonusTransaction');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');

// Default KPI distribution (used for initial create forms)
const DEFAULT_INITIAL_DISTRIBUTION = Object.freeze({
  punkt: 20,
  viloyatAgent: 20,
  tumanAgent: 20,
  mfyAgent: 40,
  punktTransfer: 0,
});

// Create KPI bonus distribution configuration
const createKpiDistribution = async (req, res) => {
  try {
    const { name, description, distribution } = req.body;
    const admin = req.user.admin;

    // Validate required fields
    if (!name || !distribution) {
      return res.status(400).json({
        success: false,
        message: 'Nomi va taqsimlash kiritilishi shart',
      });
    }

    // Validate distribution percentages sum to 100
    const total =
      (distribution.punkt || 0) +
      (distribution.viloyatAgent || 0) +
      (distribution.tumanAgent || 0) +
      (distribution.mfyAgent || 0);

    if (total !== 100) {
      return res.status(400).json({
        success: false,
        message: `Asosiy taqsimlashlar yig'indisi 100% bo'lishi kerak. Hozirgi yig'indi: ${total}%`,
      });
    }

    // If this distribution is active, deactivate all other distributions
    if (req.body.isActive !== false) {
      await KpiBonusDistribution.updateMany(
        { _id: { $ne: null } },
        { $set: { isActive: false } }
      );
    }

    const kpiDistribution = new KpiBonusDistribution({
      name,
      description,
      distribution,
      isActive: req.body.isActive !== false, // Default to true if not specified
      createdBy: admin._id,
    });

    await kpiDistribution.save();

    res.status(201).json({
      success: true,
      message: 'KPI bonus taqsimlash muvaffaqiyatli yaratildi',
      data: kpiDistribution,
    });
  } catch (error) {
    console.error('Error creating KPI distribution:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu nom bilan taqsimlash allaqachon mavjud',
      });
    }

    if (error.message.includes('100%')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'KPI bonus taqsimlash yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all KPI distributions
const getAllKpiDistributions = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await KpiBonusDistribution.countDocuments(filter);

    const distributions = await KpiBonusDistribution.find(filter)
      .populate('createdBy', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: distributions.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: distributions,
    });
  } catch (error) {
    console.error('Error fetching KPI distributions:', error);
    res.status(500).json({
      success: false,
      message: 'KPI bonus taqsimlashlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get KPI distribution by ID
const getKpiDistributionById = async (req, res) => {
  try {
    const { id } = req.params;

    const distribution = await KpiBonusDistribution.findById(id).populate(
      'createdBy',
      'name phone'
    );

    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'KPI bonus taqsimlash topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error('Error fetching KPI distribution:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri KPI taqsimlash ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'KPI bonus taqsimlashni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update KPI distribution
const updateKpiDistribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, distribution, isActive } = req.body;

    const kpiDistribution = await KpiBonusDistribution.findById(id);

    if (!kpiDistribution) {
      return res.status(404).json({
        success: false,
        message: 'KPI bonus taqsimlash topilmadi',
      });
    }

    // Validate distribution if provided
    if (distribution) {
      const total =
        (distribution.punkt || 0) +
        (distribution.viloyatAgent || 0) +
        (distribution.tumanAgent || 0) +
        (distribution.mfyAgent || 0);

      if (total !== 100) {
        return res.status(400).json({
          success: false,
          message: `Asosiy taqsimlashlar yig'indisi 100% bo'lishi kerak. Hozirgi yig'indi: ${total}%`,
        });
      }
    }

    // If setting this distribution to active, deactivate all other distributions
    if (isActive === true) {
      await KpiBonusDistribution.updateMany(
        { _id: { $ne: id } },
        { $set: { isActive: false } }
      );
    }

    // Update fields
    if (name !== undefined) kpiDistribution.name = name;
    if (description !== undefined) kpiDistribution.description = description;
    if (distribution !== undefined) kpiDistribution.distribution = distribution;
    if (isActive !== undefined) kpiDistribution.isActive = isActive;

    await kpiDistribution.save();

    res.status(200).json({
      success: true,
      message: 'KPI bonus taqsimlash muvaffaqiyatli yangilandi',
      data: kpiDistribution,
    });
  } catch (error) {
    console.error('Error updating KPI distribution:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri KPI taqsimlash ID',
      });
    }

    if (error.message.includes('100%')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'KPI bonus taqsimlashni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete KPI distribution
const deleteKpiDistribution = async (req, res) => {
  try {
    const { id } = req.params;

    const kpiDistribution = await KpiBonusDistribution.findById(id);

    if (!kpiDistribution) {
      return res.status(404).json({
        success: false,
        message: 'KPI bonus taqsimlash topilmadi',
      });
    }

    // Check if used in transactions
    const transactionCount = await KpiBonusTransaction.countDocuments({
      distributionConfig: id,
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu taqsimlash ${transactionCount} ta transaksiyada ishlatilgan. O'chirib bo'lmaydi`,
      });
    }

    await KpiBonusDistribution.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'KPI bonus taqsimlash muvaffaqiyatli o\'chirildi',
    });
  } catch (error) {
    console.error('Error deleting KPI distribution:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri KPI taqsimlash ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'KPI bonus taqsimlashni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all KPI transactions (with filters)
const getAllKpiTransactions = async (req, res) => {
  try {
    const {
      orderId,
      productId,
      punktId,
      agentId,
      orderStatus,
      isPaid,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (orderId) filter.order = orderId;
    if (productId) filter['orderItem.product'] = productId;
    if (punktId) {
      filter.$or = [
        { 'recipients.punkt': punktId },
        { 'recipients.fromPunkt': punktId },
        { 'recipients.toPunkt': punktId },
      ];
    }
    if (agentId) {
      filter.$or = [
        { 'recipients.viloyatAgent': agentId },
        { 'recipients.tumanAgent': agentId },
        { 'recipients.mfyAgent': agentId },
      ];
    }
    if (orderStatus) filter.orderStatus = orderStatus;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await KpiBonusTransaction.countDocuments(filter);

    const transactions = await KpiBonusTransaction.find(filter)
      .populate('order', 'orderNumber status totalPrice')
      .populate('orderItem.product', 'name price productCode')
      .populate('distributionConfig', 'name distribution')
      .populate('recipients.punkt', 'name phone')
      .populate('recipients.viloyatAgent', 'name phone viloyat tuman mfy')
      .populate('recipients.tumanAgent', 'name phone viloyat tuman mfy')
      .populate('recipients.mfyAgent', 'name phone viloyat tuman mfy')
      .populate('recipients.fromPunkt', 'name phone')
      .populate('recipients.toPunkt', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching KPI transactions:', error);
    res.status(500).json({
      success: false,
      message: 'KPI bonus transaksiyalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get KPI transaction by ID
const getKpiTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await KpiBonusTransaction.findById(id)
      .populate('order', 'orderNumber status totalPrice user')
      .populate('orderItem.product', 'name price productCode')
      .populate('distributionConfig', 'name distribution')
      .populate('recipients.punkt', 'name phone')
      .populate('recipients.viloyatAgent', 'name phone viloyat tuman mfy')
      .populate('recipients.tumanAgent', 'name phone viloyat tuman mfy')
      .populate('recipients.mfyAgent', 'name phone viloyat tuman mfy')
      .populate('recipients.fromPunkt', 'name phone')
      .populate('recipients.toPunkt', 'name phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'KPI bonus transaksiya topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error fetching KPI transaction:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri KPI transaksiya ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'KPI bonus transaksiyani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get KPI statistics
const getKpiStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Aggregate statistics
    const stats = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalKpiAmount: { $sum: '$totalKpiAmount' },
          totalPunkt: { $sum: '$amounts.punkt' },
          totalViloyatAgent: { $sum: '$amounts.viloyatAgent' },
          totalTumanAgent: { $sum: '$amounts.tumanAgent' },
          totalMfyAgent: { $sum: '$amounts.mfyAgent' },
          totalPunktTransfer: { $sum: '$amounts.punktTransfer' },
          paidTransactions: {
            $sum: { $cond: ['$isPaid', 1, 0] },
          },
          unpaidTransactions: {
            $sum: { $cond: ['$isPaid', 0, 1] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      totalKpiAmount: 0,
      totalPunkt: 0,
      totalViloyatAgent: 0,
      totalTumanAgent: 0,
      totalMfyAgent: 0,
      totalPunktTransfer: 0,
      paidTransactions: 0,
      unpaidTransactions: 0,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching KPI statistics:', error);
    res.status(500).json({
      success: false,
      message: 'KPI statistikalarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get default/initial KPI distribution values (used before creating first config)
const getInitialKpiDistribution = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        name: 'Default KPI Distribution',
        description:
          'Tavsiyaviy boshlang\'ich taqsimlash. Admin kerak bo\'lsa qiymatlarni o\'zgartirishi mumkin.',
        distribution: DEFAULT_INITIAL_DISTRIBUTION,
        notes: [
          'Jami foizlar 100% bo\'lishi shart',
          'Punkt transfer 0 bo\'lsa, transfer taqsimlashga ehtiyoj yo\'q',
          'Bu qiymatlar faqat create formasi uchun boshlang\'ich tavsiya',
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching initial KPI distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Boshlang\'ich KPI qiymatlarini olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== ADMIN KPI DATA ENDPOINTS ====================

// Helper functions
const CUSTOMER_CONFIRMED_STATUS = 'confirmed_by_customer';

const parseDateRange = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
};

// Get all viloyat agents KPI data
const getViloyatAgentsKpi = async (req, res) => {
  try {
    const { viloyatId, agentId, isPaid, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { orderStatus: CUSTOMER_CONFIRMED_STATUS };
    filter['recipients.viloyatAgent'] = { $exists: true, $ne: null };

    if (agentId) filter['recipients.viloyatAgent'] = agentId;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const dateFilter = parseDateRange(startDate, endDate);
    if (dateFilter.createdAt) filter.createdAt = dateFilter.createdAt;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get aggregated stats by agent
    const agentStats = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$recipients.viloyatAgent',
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amounts.viloyatAgent' },
          paidAmount: {
            $sum: { $cond: ['$isPaid', '$amounts.viloyatAgent', 0] },
          },
          unpaidAmount: {
            $sum: { $cond: ['$isPaid', 0, '$amounts.viloyatAgent'] },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ]);

    // Populate agent details
    const agentIds = agentStats.map((s) => s._id);
    const agents = await Agent.find({ _id: { $in: agentIds } })
      .select('name phone viloyat')
      .populate('viloyat', 'name');

    const agentMap = {};
    agents.forEach((a) => {
      agentMap[a._id.toString()] = a;
    });

    // Filter by viloyat if specified
    let result = agentStats.map((stat) => ({
      agent: agentMap[stat._id.toString()] || { _id: stat._id },
      ...stat,
      _id: undefined,
    }));

    if (viloyatId) {
      result = result.filter(
        (r) => r.agent.viloyat && r.agent.viloyat._id.toString() === viloyatId
      );
    }

    const total = await KpiBonusTransaction.aggregate([
      { $match: filter },
      { $group: { _id: '$recipients.viloyatAgent' } },
      { $count: 'total' },
    ]);

    res.status(200).json({
      success: true,
      count: result.length,
      total: total[0]?.total || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((total[0]?.total || 0) / limitNum),
      data: result,
    });
  } catch (error) {
    console.error('Error fetching viloyat agents KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Viloyat agentlari KPI ma\'lumotlarini olishda xatolik',
      error: error.message,
    });
  }
};

// Get all tuman agents KPI data
const getTumanAgentsKpi = async (req, res) => {
  try {
    const { viloyatId, tumanId, agentId, isPaid, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { orderStatus: CUSTOMER_CONFIRMED_STATUS };
    filter['recipients.tumanAgent'] = { $exists: true, $ne: null };

    if (agentId) filter['recipients.tumanAgent'] = agentId;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const dateFilter = parseDateRange(startDate, endDate);
    if (dateFilter.createdAt) filter.createdAt = dateFilter.createdAt;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const agentStats = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$recipients.tumanAgent',
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amounts.tumanAgent' },
          paidAmount: {
            $sum: { $cond: ['$isPaid', '$amounts.tumanAgent', 0] },
          },
          unpaidAmount: {
            $sum: { $cond: ['$isPaid', 0, '$amounts.tumanAgent'] },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ]);

    const agentIds = agentStats.map((s) => s._id);
    const agents = await Agent.find({ _id: { $in: agentIds } })
      .select('name phone viloyat tuman')
      .populate('viloyat', 'name')
      .populate('tuman', 'name');

    const agentMap = {};
    agents.forEach((a) => {
      agentMap[a._id.toString()] = a;
    });

    let result = agentStats.map((stat) => ({
      agent: agentMap[stat._id.toString()] || { _id: stat._id },
      ...stat,
      _id: undefined,
    }));

    // Filter by viloyat or tuman if specified
    if (viloyatId) {
      result = result.filter(
        (r) => r.agent.viloyat && r.agent.viloyat._id.toString() === viloyatId
      );
    }
    if (tumanId) {
      result = result.filter(
        (r) => r.agent.tuman && r.agent.tuman._id.toString() === tumanId
      );
    }

    const total = await KpiBonusTransaction.aggregate([
      { $match: filter },
      { $group: { _id: '$recipients.tumanAgent' } },
      { $count: 'total' },
    ]);

    res.status(200).json({
      success: true,
      count: result.length,
      total: total[0]?.total || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((total[0]?.total || 0) / limitNum),
      data: result,
    });
  } catch (error) {
    console.error('Error fetching tuman agents KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Tuman agentlari KPI ma\'lumotlarini olishda xatolik',
      error: error.message,
    });
  }
};

// Get all MFY agents KPI data
const getMfyAgentsKpi = async (req, res) => {
  try {
    const { viloyatId, tumanId, mfyId, agentId, isPaid, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { orderStatus: CUSTOMER_CONFIRMED_STATUS };
    filter['recipients.mfyAgent'] = { $exists: true, $ne: null };

    if (agentId) filter['recipients.mfyAgent'] = agentId;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const dateFilter = parseDateRange(startDate, endDate);
    if (dateFilter.createdAt) filter.createdAt = dateFilter.createdAt;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const agentStats = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$recipients.mfyAgent',
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amounts.mfyAgent' },
          paidAmount: {
            $sum: { $cond: ['$isPaid', '$amounts.mfyAgent', 0] },
          },
          unpaidAmount: {
            $sum: { $cond: ['$isPaid', 0, '$amounts.mfyAgent'] },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ]);

    const agentIds = agentStats.map((s) => s._id);
    const agents = await Agent.find({ _id: { $in: agentIds } })
      .select('name phone viloyat tuman mfy')
      .populate('viloyat', 'name')
      .populate('tuman', 'name')
      .populate('mfy', 'name');

    const agentMap = {};
    agents.forEach((a) => {
      agentMap[a._id.toString()] = a;
    });

    let result = agentStats.map((stat) => ({
      agent: agentMap[stat._id.toString()] || { _id: stat._id },
      ...stat,
      _id: undefined,
    }));

    // Filter by viloyat, tuman, or mfy if specified
    if (viloyatId) {
      result = result.filter(
        (r) => r.agent.viloyat && r.agent.viloyat._id.toString() === viloyatId
      );
    }
    if (tumanId) {
      result = result.filter(
        (r) => r.agent.tuman && r.agent.tuman._id.toString() === tumanId
      );
    }
    if (mfyId) {
      result = result.filter(
        (r) => r.agent.mfy && r.agent.mfy._id.toString() === mfyId
      );
    }

    const total = await KpiBonusTransaction.aggregate([
      { $match: filter },
      { $group: { _id: '$recipients.mfyAgent' } },
      { $count: 'total' },
    ]);

    res.status(200).json({
      success: true,
      count: result.length,
      total: total[0]?.total || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((total[0]?.total || 0) / limitNum),
      data: result,
    });
  } catch (error) {
    console.error('Error fetching MFY agents KPI:', error);
    res.status(500).json({
      success: false,
      message: 'MFY agentlari KPI ma\'lumotlarini olishda xatolik',
      error: error.message,
    });
  }
};

// Get all punkts KPI data
const getPunktsKpi = async (req, res) => {
  try {
    const { viloyatId, tumanId, punktId, isPaid, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { orderStatus: CUSTOMER_CONFIRMED_STATUS };

    if (punktId) {
      filter.$or = [
        { 'recipients.punkt': punktId },
        { 'recipients.fromPunkt': punktId },
        { 'recipients.toPunkt': punktId },
      ];
    } else {
      filter.$or = [
        { 'recipients.punkt': { $exists: true, $ne: null } },
        { 'recipients.fromPunkt': { $exists: true, $ne: null } },
        { 'recipients.toPunkt': { $exists: true, $ne: null } },
      ];
    }

    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const dateFilter = parseDateRange(startDate, endDate);
    if (dateFilter.createdAt) filter.createdAt = dateFilter.createdAt;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Aggregate punkt stats - need to handle multiple punkt fields
    const punktStats = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $facet: {
          regularPunkt: [
            { $match: { 'recipients.punkt': { $exists: true, $ne: null } } },
            {
              $group: {
                _id: '$recipients.punkt',
                totalTransactions: { $sum: 1 },
                totalAmount: { $sum: '$amounts.punkt' },
                paidAmount: { $sum: { $cond: ['$isPaid', '$amounts.punkt', 0] } },
                unpaidAmount: { $sum: { $cond: ['$isPaid', 0, '$amounts.punkt'] } },
              },
            },
          ],
          fromPunkt: [
            { $match: { 'recipients.fromPunkt': { $exists: true, $ne: null } } },
            {
              $group: {
                _id: '$recipients.fromPunkt',
                totalTransactions: { $sum: 1 },
                totalAmount: { $sum: '$recipients.fromPunktAmount' },
                paidAmount: { $sum: { $cond: ['$isPaid', '$recipients.fromPunktAmount', 0] } },
                unpaidAmount: { $sum: { $cond: ['$isPaid', 0, '$recipients.fromPunktAmount'] } },
              },
            },
          ],
          toPunkt: [
            { $match: { 'recipients.toPunkt': { $exists: true, $ne: null } } },
            {
              $group: {
                _id: '$recipients.toPunkt',
                totalTransactions: { $sum: 1 },
                totalAmount: { $sum: '$recipients.toPunktAmount' },
                paidAmount: { $sum: { $cond: ['$isPaid', '$recipients.toPunktAmount', 0] } },
                unpaidAmount: { $sum: { $cond: ['$isPaid', 0, '$recipients.toPunktAmount'] } },
              },
            },
          ],
        },
      },
    ]);

    // Merge all punkt stats
    const mergedStats = {};
    const allStats = [
      ...punktStats[0].regularPunkt,
      ...punktStats[0].fromPunkt,
      ...punktStats[0].toPunkt,
    ];

    allStats.forEach((stat) => {
      const id = stat._id.toString();
      if (!mergedStats[id]) {
        mergedStats[id] = {
          _id: stat._id,
          totalTransactions: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
        };
      }
      mergedStats[id].totalTransactions += stat.totalTransactions;
      mergedStats[id].totalAmount += stat.totalAmount || 0;
      mergedStats[id].paidAmount += stat.paidAmount || 0;
      mergedStats[id].unpaidAmount += stat.unpaidAmount || 0;
    });

    const punktIds = Object.keys(mergedStats);
    const punkts = await Punkt.find({ _id: { $in: punktIds } })
      .select('name phone viloyat tuman')
      .populate('viloyat', 'name')
      .populate('tuman', 'name');

    const punktMap = {};
    punkts.forEach((p) => {
      punktMap[p._id.toString()] = p;
    });

    let result = Object.values(mergedStats).map((stat) => ({
      punkt: punktMap[stat._id.toString()] || { _id: stat._id },
      totalTransactions: stat.totalTransactions,
      totalAmount: stat.totalAmount,
      paidAmount: stat.paidAmount,
      unpaidAmount: stat.unpaidAmount,
    }));

    // Filter by viloyat or tuman if specified
    if (viloyatId) {
      result = result.filter(
        (r) => r.punkt.viloyat && r.punkt.viloyat._id.toString() === viloyatId
      );
    }
    if (tumanId) {
      result = result.filter(
        (r) => r.punkt.tuman && r.punkt.tuman._id.toString() === tumanId
      );
    }

    // Sort by totalAmount and paginate
    result.sort((a, b) => b.totalAmount - a.totalAmount);
    const paginatedResult = result.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paginatedResult.length,
      total: result.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.length / limitNum),
      data: paginatedResult,
    });
  } catch (error) {
    console.error('Error fetching punkts KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Punktlar KPI ma\'lumotlarini olishda xatolik',
      error: error.message,
    });
  }
};

// Get single agent KPI details (with transactions)
const getAgentKpiDetails = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { role, isPaid, startDate, endDate, page = 1, limit = 50 } = req.query;

    const agent = await Agent.findById(agentId)
      .select('name phone viloyat tuman mfy')
      .populate('viloyat', 'name')
      .populate('tuman', 'name')
      .populate('mfy', 'name');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    // Determine agent role
    let agentRole = role;
    if (!agentRole) {
      if (agent.mfy) agentRole = 'mfy';
      else if (agent.tuman) agentRole = 'tuman';
      else agentRole = 'viloyat';
    }

    const recipientField = agentRole === 'mfy' ? 'recipients.mfyAgent' :
      agentRole === 'tuman' ? 'recipients.tumanAgent' : 'recipients.viloyatAgent';
    const amountField = agentRole === 'mfy' ? '$amounts.mfyAgent' :
      agentRole === 'tuman' ? '$amounts.tumanAgent' : '$amounts.viloyatAgent';

    const filter = {
      orderStatus: CUSTOMER_CONFIRMED_STATUS,
      [recipientField]: agentId,
    };

    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const dateFilter = parseDateRange(startDate, endDate);
    if (dateFilter.createdAt) filter.createdAt = dateFilter.createdAt;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get summary
    const summary = await KpiBonusTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: amountField },
          paidAmount: { $sum: { $cond: ['$isPaid', amountField, 0] } },
          unpaidAmount: { $sum: { $cond: ['$isPaid', 0, amountField] } },
        },
      },
    ]);

    const total = await KpiBonusTransaction.countDocuments(filter);

    const transactions = await KpiBonusTransaction.find(filter)
      .populate('order', 'orderNumber status totalPrice')
      .populate('orderItem.product', 'name price productCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const transactionsWithAmount = transactions.map((t) => {
      const obj = t.toObject();
      obj.agentAmount = agentRole === 'mfy' ? t.amounts.mfyAgent :
        agentRole === 'tuman' ? t.amounts.tumanAgent : t.amounts.viloyatAgent;
      return obj;
    });

    res.status(200).json({
      success: true,
      data: {
        agent,
        role: agentRole,
        summary: summary[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
        },
        transactions: {
          count: transactionsWithAmount.length,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          data: transactionsWithAmount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching agent KPI details:', error);
    res.status(500).json({
      success: false,
      message: 'Agent KPI ma\'lumotlarini olishda xatolik',
      error: error.message,
    });
  }
};

// Get single punkt KPI details (with transactions)
const getPunktKpiDetails = async (req, res) => {
  try {
    const { punktId } = req.params;
    const { isPaid, startDate, endDate, page = 1, limit = 50 } = req.query;

    const punkt = await Punkt.findById(punktId)
      .select('name phone viloyat tuman')
      .populate('viloyat', 'name')
      .populate('tuman', 'name');

    if (!punkt) {
      return res.status(404).json({
        success: false,
        message: 'Punkt topilmadi',
      });
    }

    const filter = {
      orderStatus: CUSTOMER_CONFIRMED_STATUS,
      $or: [
        { 'recipients.punkt': punktId },
        { 'recipients.fromPunkt': punktId },
        { 'recipients.toPunkt': punktId },
      ],
    };

    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

    const dateFilter = parseDateRange(startDate, endDate);
    if (dateFilter.createdAt) filter.createdAt = dateFilter.createdAt;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await KpiBonusTransaction.countDocuments(filter);

    const transactions = await KpiBonusTransaction.find(filter)
      .populate('order', 'orderNumber status totalPrice')
      .populate('orderItem.product', 'name price productCode')
      .populate('recipients.fromPunkt', 'name')
      .populate('recipients.toPunkt', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate punkt amounts
    let summaryTotals = { totalAmount: 0, paidAmount: 0, unpaidAmount: 0 };
    const transactionsWithAmount = transactions.map((t) => {
      const obj = t.toObject();
      let punktAmount = 0;
      let bonusType = '';

      if (t.recipients.punkt?.toString() === punktId) {
        punktAmount += t.amounts.punkt || 0;
        bonusType = 'regular';
      }
      if (t.recipients.fromPunkt?.toString() === punktId) {
        punktAmount += t.recipients.fromPunktAmount || 0;
        bonusType = bonusType ? 'mixed' : 'from_punkt';
      }
      if (t.recipients.toPunkt?.toString() === punktId) {
        punktAmount += t.recipients.toPunktAmount || 0;
        bonusType = bonusType ? 'mixed' : 'to_punkt';
      }

      obj.punktAmount = punktAmount;
      obj.bonusType = bonusType;
      return obj;
    });

    // Get full summary
    const allTransactions = await KpiBonusTransaction.find(filter);
    allTransactions.forEach((t) => {
      let punktAmount = 0;
      if (t.recipients.punkt?.toString() === punktId) punktAmount += t.amounts.punkt || 0;
      if (t.recipients.fromPunkt?.toString() === punktId) punktAmount += t.recipients.fromPunktAmount || 0;
      if (t.recipients.toPunkt?.toString() === punktId) punktAmount += t.recipients.toPunktAmount || 0;

      summaryTotals.totalAmount += punktAmount;
      if (t.isPaid) summaryTotals.paidAmount += punktAmount;
      else summaryTotals.unpaidAmount += punktAmount;
    });

    res.status(200).json({
      success: true,
      data: {
        punkt,
        summary: {
          totalTransactions: allTransactions.length,
          ...summaryTotals,
        },
        transactions: {
          count: transactionsWithAmount.length,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          data: transactionsWithAmount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching punkt KPI details:', error);
    res.status(500).json({
      success: false,
      message: 'Punkt KPI ma\'lumotlarini olishda xatolik',
      error: error.message,
    });
  }
};

module.exports = {
  createKpiDistribution,
  getAllKpiDistributions,
  getKpiDistributionById,
  updateKpiDistribution,
  deleteKpiDistribution,
  getAllKpiTransactions,
  getKpiTransactionById,
  getKpiStatistics,
  getInitialKpiDistribution,
  // New KPI data endpoints
  getViloyatAgentsKpi,
  getTumanAgentsKpi,
  getMfyAgentsKpi,
  getPunktsKpi,
  getAgentKpiDetails,
  getPunktKpiDetails,
};

