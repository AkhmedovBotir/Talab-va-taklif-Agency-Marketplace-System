const Agent = require('../models/Agent');
const jwt = require('jsonwebtoken');
const { cacheInvalidators } = require('../middleware/cache');

// Create new agent
const createAgent = async (req, res) => {
  try {
    const { name, viloyat, tuman, mfy, phone, password, status } = req.body;

    // Check if phone number already exists (only non-deleted)
    const existingPhone = await Agent.findOne({
      phone,
      isDeleted: { $ne: true },
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon mavjud',
      });
    }

    // Validate regions exist and have correct types
    const Region = require('../models/Region');
    const viloyatRegion = await Region.findById(viloyat);

    if (!viloyatRegion || viloyatRegion.type !== 'region') {
      return res.status(400).json({
        success: false,
        message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
      });
    }

    // If tuman is provided, validate it
    if (tuman) {
      const tumanRegion = await Region.findById(tuman);
      if (!tumanRegion || tumanRegion.type !== 'district') {
        return res.status(400).json({
          success: false,
          message: 'Tuman topilmadi yoki noto\'g\'ri tur',
        });
      }
      // Validate tuman is child of viloyat
      if (tumanRegion.parent?.toString() !== viloyat.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Tuman tanlangan viloyatga tegishli emas',
        });
      }
    }

    // If mfy is provided, validate it
    if (mfy) {
      if (!tuman) {
        return res.status(400).json({
          success: false,
          message: 'MFY tanlash uchun tuman ham tanlanishi kerak',
        });
      }
      const mfyRegion = await Region.findById(mfy);
      if (!mfyRegion || mfyRegion.type !== 'mfy') {
        return res.status(400).json({
          success: false,
          message: 'MFY topilmadi yoki noto\'g\'ri tur',
        });
      }
      // Validate mfy is child of tuman
      if (mfyRegion.parent?.toString() !== tuman.toString()) {
        return res.status(400).json({
          success: false,
          message: 'MFY tanlangan tumanga tegishli emas',
        });
      }
    }

    // Check if there's already an active agent in this position
    // Position is determined by: viloyat + tuman + mfy (if provided)
    const positionFilter = {
      viloyat,
      isDeleted: { $ne: true },
      status: 'active',
    };

    // Add tuman to filter if provided
    if (tuman) {
      positionFilter.tuman = tuman;
    } else {
      positionFilter.tuman = null;
    }

    // Add mfy to filter if provided
    if (mfy) {
      positionFilter.mfy = mfy;
    } else {
      positionFilter.mfy = null;
    }

    const existingAgentInPosition = await Agent.findOne(positionFilter);
    if (existingAgentInPosition) {
      let positionName = 'Bu viloyat';
      if (tuman) {
        positionName += ' va tuman';
      }
      if (mfy) {
        positionName += ' va MFY';
      }
      return res.status(400).json({
        success: false,
        message: `${positionName} uchun allaqachon faol agent mavjud`,
      });
    }

    try {
      const agent = await Agent.create({
        name,
        viloyat,
        tuman: tuman || null,
        mfy: mfy || null,
        phone,
        password,
        status: status || 'active',
      });

      // Populate regions
      await agent.populate('viloyat', 'name type code');
      if (agent.tuman) {
        await agent.populate('tuman', 'name type code');
      }
      if (agent.mfy) {
        await agent.populate('mfy', 'name type code');
      }

      // Determine agent type
      const agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';

      // Invalidate cache
      await cacheInvalidators.invalidateAgentCache();

      res.status(201).json({
        success: true,
        message: 'Agent muvaffaqiyatli yaratildi',
        data: {
          ...agent.toObject(),
          agentType,
        },
      });
    } catch (createError) {
      // Handle duplicate key error (phone already exists)
      if (createError.code === 11000 && createError.keyPattern && createError.keyPattern.phone) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon mavjud (arxivda yoki faol agentda)',
        });
      }
      throw createError;
    }
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      message: 'Agent yaratishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get all agents
const getAllAgents = async (req, res) => {
  try {
    const { status, viloyat, tuman, mfy, agentType, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (viloyat) {
      filter.viloyat = viloyat;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (mfy) {
      filter.mfy = mfy;
    }

    // Filter by agent type
    if (agentType) {
      if (agentType === 'viloyat') {
        filter.tuman = null;
        filter.mfy = null;
      } else if (agentType === 'tuman') {
        filter.tuman = { $ne: null };
        filter.mfy = null;
      } else if (agentType === 'mfy') {
        filter.mfy = { $ne: null };
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Only show non-deleted agents (include those without isDeleted field for backward compatibility)
    filter.isDeleted = { $ne: true };

    // Get total count
    const total = await Agent.countDocuments(filter);

    // Get agents with pagination
    const agents = await Agent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Add agentType to each agent
    const agentsWithType = agents.map(agent => {
      const agentObj = agent.toObject();
      agentObj.agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';
      return agentObj;
    });

    res.status(200).json({
      success: true,
      count: agentsWithType.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: agentsWithType,
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      message: 'Agentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get agent by ID
const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findOne({
      _id: id,
      isDeleted: { $ne: true },
    })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    // Add agentType
    const agentObj = agent.toObject();
    agentObj.agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';

    res.status(200).json({
      success: true,
      data: agentObj,
    });
  } catch (error) {
    console.error('Error fetching agent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri agent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Agentni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update agent
const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If phone is being updated, check for duplicates (only non-deleted)
    if (updateData.phone) {
      const existingPhone = await Agent.findOne({
        phone: updateData.phone,
        _id: { $ne: id },
        isDeleted: { $ne: true },
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon raqami allaqachon mavjud',
        });
      }
    }

    // Validate regions if being updated
    if (updateData.viloyat || updateData.tuman || updateData.mfy) {
      const Region = require('../models/Region');
      const currentAgent = await Agent.findById(id);
      const viloyatId = updateData.viloyat || currentAgent.viloyat;
      let tumanId = updateData.tuman !== undefined ? updateData.tuman : currentAgent.tuman;
      let mfyId = updateData.mfy !== undefined ? updateData.mfy : currentAgent.mfy;

      if (updateData.viloyat) {
        const viloyatRegion = await Region.findById(viloyatId);
        if (!viloyatRegion || viloyatRegion.type !== 'region') {
          return res.status(400).json({
            success: false,
            message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
          });
        }
        // If viloyat changed, reset tuman and mfy
        if (updateData.viloyat !== currentAgent.viloyat.toString()) {
          tumanId = null;
          mfyId = null;
          updateData.tuman = null;
          updateData.mfy = null;
        }
      }

      if (updateData.tuman) {
        const tumanRegion = await Region.findById(updateData.tuman);
        if (!tumanRegion || tumanRegion.type !== 'district') {
          return res.status(400).json({
            success: false,
            message: 'Tuman topilmadi yoki noto\'g\'ri tur',
          });
        }
        // Validate tuman is child of viloyat
        if (tumanRegion.parent?.toString() !== viloyatId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman tanlangan viloyatga tegishli emas',
          });
        }
        // If tuman changed, reset mfy
        if (updateData.tuman !== currentAgent.tuman?.toString()) {
          mfyId = null;
          updateData.mfy = null;
        }
      }

      if (updateData.mfy) {
        if (!tumanId) {
          return res.status(400).json({
            success: false,
            message: 'MFY tanlash uchun tuman ham tanlanishi kerak',
          });
        }
        const mfyRegion = await Region.findById(updateData.mfy);
        if (!mfyRegion || mfyRegion.type !== 'mfy') {
          return res.status(400).json({
            success: false,
            message: 'MFY topilmadi yoki noto\'g\'ri tur',
          });
        }
        // Validate mfy is child of tuman
        if (mfyRegion.parent?.toString() !== tumanId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'MFY tanlangan tumanga tegishli emas',
          });
        }
      }

      // Check if position is being changed
      // If so, check if there's already an active agent in the new position
      const positionFilter = {
        viloyat: viloyatId,
        isDeleted: { $ne: true },
        status: 'active',
        _id: { $ne: id }, // Exclude current agent
      };

      if (tumanId) {
        positionFilter.tuman = tumanId;
      } else {
        positionFilter.tuman = null;
      }

      if (mfyId) {
        positionFilter.mfy = mfyId;
      } else {
        positionFilter.mfy = null;
      }

      const existingAgentInPosition = await Agent.findOne(positionFilter);
      if (existingAgentInPosition) {
        let positionName = 'Bu viloyat';
        if (tumanId) {
          positionName += ' va tuman';
        }
        if (mfyId) {
          positionName += ' va MFY';
        }
        return res.status(400).json({
          success: false,
          message: `${positionName} uchun allaqachon faol agent mavjud`,
        });
      }
    }

    const agent = await Agent.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    // Add agentType
    const agentObj = agent.toObject();
    agentObj.agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';

    // Invalidate cache
    await cacheInvalidators.invalidateAgentCache();

    res.status(200).json({
      success: true,
      message: 'Agent muvaffaqiyatli yangilandi',
      data: agentObj,
    });
  } catch (error) {
    console.error('Error updating agent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri agent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Agentni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Delete agent (soft delete)
const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $ne: true },
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'inactive',
      },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent topilmadi',
      });
    }

    // Invalidate cache
    await cacheInvalidators.invalidateAgentCache();

    res.status(200).json({
      success: true,
      message: 'Agent muvaffaqiyatli o\'chirildi (arxivga o\'tkazildi)',
    });
  } catch (error) {
    console.error('Error deleting agent:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri agent ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Agentni o\'chirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Login agent
const loginAgent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find agent with password field included (only non-deleted)
    const agent = await Agent.findOne({
      phone,
      isDeleted: { $ne: true },
    }).select('+password');

    if (!agent) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check if agent is active
    if (agent.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Hisobingiz faol emas',
      });
    }

    // Compare password
    const isPasswordValid = await agent.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Determine agent type
    const agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';

    // Generate JWT token (24 hours)
    const token = jwt.sign(
      {
        id: agent._id,
        phone: agent.phone,
        agentType,
        type: 'agent',
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: '24h',
      }
    );

    // Populate regions
    await agent.populate('viloyat', 'name type code');
    if (agent.tuman) {
      await agent.populate('tuman', 'name type code');
    }
    if (agent.mfy) {
      await agent.populate('mfy', 'name type code');
    }

    // Add agentType to response
    const agentObj = agent.toObject();
    agentObj.agentType = agentType;

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        role: agentType, // role field qo'shildi
        agent: agentObj,
      },
    });
  } catch (error) {
    console.error('Error logging in agent:', error);
    res.status(500).json({
      success: false,
      message: 'Kirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Get agents for selection (agent ID tanlash uchun)
const getAgentsForSelection = async (req, res) => {
  try {
    const { status, viloyat, tuman, mfy, agentType, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    // Only show non-deleted agents (include those without isDeleted field for backward compatibility)
    filter.isDeleted = { $ne: true };

    // Only show active agents by default
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    if (viloyat) {
      filter.viloyat = viloyat;
    }

    if (tuman) {
      filter.tuman = tuman;
    }

    if (mfy) {
      filter.mfy = mfy;
    }

    // Filter by agent type
    if (agentType) {
      if (agentType === 'viloyat') {
        filter.tuman = null;
        filter.mfy = null;
      } else if (agentType === 'tuman') {
        filter.tuman = { $ne: null };
        filter.mfy = null;
      } else if (agentType === 'mfy') {
        filter.mfy = { $ne: null };
      }
    }

    // Search by name or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Agent.countDocuments(filter);

    // Get agents with pagination - minimal fields for selection
    const agents = await Agent.find(filter)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('_id name phone viloyat tuman mfy status')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    // Add agentType to each agent
    const agentsWithType = agents.map((agent) => {
      const agentObj = agent.toObject();
      agentObj.agentType = agent.mfy ? 'mfy' : agent.tuman ? 'tuman' : 'viloyat';
      return agentObj;
    });

    res.status(200).json({
      success: true,
      count: agentsWithType.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: agentsWithType,
    });
  } catch (error) {
    console.error('Error fetching agents for selection:', error);
    res.status(500).json({
      success: false,
      message: 'Agentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  loginAgent,
  getAgentsForSelection,
};



