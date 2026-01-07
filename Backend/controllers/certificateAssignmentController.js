const Certificate = require('../models/Certificate');
const Candidate = require('../models/Candidate');
const Agent = require('../models/Agent');
const Punkt = require('../models/Punkt');
const Region = require('../models/Region');

// Assign candidate from certificate to a position
const assignCertificateToPosition = async (req, res) => {
  try {
    const { certificateCode } = req.body;
    const { positionType, viloyatId, tumanId, mfyId, name, phone } = req.body;
    const admin = req.user.admin;

    if (!certificateCode) {
      return res.status(400).json({
        success: false,
        message: 'Sertifikat kodi kiritilishi shart',
      });
    }

    if (!positionType || !['punkt', 'viloyat_agent', 'tuman_agent', 'mfy_agent'].includes(positionType)) {
      return res.status(400).json({
        success: false,
        message: 'Lavozim turi noto\'g\'ri. Quyidagilardan birini tanlang: punkt, viloyat_agent, tuman_agent, mfy_agent',
      });
    }

    // Find certificate by certificate number or QR code
    let certificate = await Certificate.findOne({
      $or: [
        { certificateNumber: certificateCode },
        { qrCode: certificateCode },
      ],
    }).populate('candidate');

    let candidate;

    // If certificate not found, create candidate from provided data or certificate code
    if (!certificate) {
      // Use provided name and phone, or use certificate code as reference
      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Sertifikat topilmadi. Ism va telefon raqami kiritilishi shart',
        });
      }

      // Create candidate with provided data
      const nameParts = name.trim().split(' ');
      candidate = await Candidate.create({
        firstName: nameParts[0] || name,
        lastName: nameParts.slice(1).join(' ') || '',
        phone: phone,
        registrationType: 'web',
      });
    } else {
      // Certificate exists, check if revoked
      if (certificate.status === 'revoked') {
        return res.status(400).json({
          success: false,
          message: 'Sertifikat bekor qilingan',
        });
      }

      candidate = certificate.candidate;
    }

    // Use candidate data if name/phone not provided
    const finalName = name || candidate.fullName;
    const finalPhone = phone || candidate.phone;

    // Validate required fields based on position type
    if (positionType === 'punkt') {
      if (!viloyatId) {
        return res.status(400).json({
          success: false,
          message: 'Punkt uchun viloyat kiritilishi shart',
        });
      }
    } else if (positionType === 'viloyat_agent') {
      if (!viloyatId) {
        return res.status(400).json({
          success: false,
          message: 'Viloyat agenti uchun viloyat kiritilishi shart',
        });
      }
    } else if (positionType === 'tuman_agent') {
      if (!viloyatId || !tumanId) {
        return res.status(400).json({
          success: false,
          message: 'Tuman agenti uchun viloyat va tuman kiritilishi shart',
        });
      }
    } else if (positionType === 'mfy_agent') {
      if (!viloyatId || !tumanId || !mfyId) {
        return res.status(400).json({
          success: false,
          message: 'MFY agenti uchun viloyat, tuman va MFY kiritilishi shart',
        });
      }
    }

    // Validate name and phone exist (either from request or candidate)
    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Ism kiritilishi shart (yoki sertifikatda nomzod ismi bo\'lishi kerak)',
      });
    }

    if (!finalPhone) {
      return res.status(400).json({
        success: false,
        message: 'Telefon raqami kiritilishi shart (yoki sertifikatda nomzod telefon raqami bo\'lishi kerak)',
      });
    }

    // Check if phone already exists in the system (punkt or agent) - only non-deleted users
    // Note: Deleted users (isDeleted: true) are ignored and can be reassigned
    const existingPunkt = await Punkt.findOne({
      phone: finalPhone,
      isDeleted: { $ne: true },
    }).populate('viloyat', '_id');

    const existingAgent = await Agent.findOne({
      phone: finalPhone,
      isDeleted: { $ne: true },
    }).populate('viloyat', '_id');

    // If assigning to punkt, check if phone exists as active agent
    if (positionType === 'punkt' && existingAgent) {
      // Check if agent is in different region - allow reassignment
      const agentViloyatId = existingAgent.viloyat?._id?.toString() || existingAgent.viloyat?.toString();
      const requestedViloyatId = viloyatId.toString();
      
      if (agentViloyatId === requestedViloyatId) {
        // Agent is in the same region, don't allow
        return res.status(400).json({
          success: false,
          message: `Bu telefon raqami allaqachon bu viloyatda agent sifatida ro'yxatdan o'tgan. Telefon raqami: ${finalPhone}`,
          existingUser: {
            type: 'agent',
            id: existingAgent._id,
            name: existingAgent.name,
            viloyat: agentViloyatId,
          },
        });
      }
      // If agent is in different region, allow creating new punkt (will be handled below)
    }

    // If assigning to agent, check if phone exists as active punkt
    if (positionType !== 'punkt' && existingPunkt) {
      // Check if punkt is in different region - allow reassignment
      const punktViloyatId = existingPunkt.viloyat?._id?.toString() || existingPunkt.viloyat?.toString();
      const requestedViloyatId = viloyatId.toString();
      
      if (punktViloyatId === requestedViloyatId) {
        // Punkt is in the same region, don't allow
        return res.status(400).json({
          success: false,
          message: `Bu telefon raqami allaqachon bu viloyatda punkt sifatida ro'yxatdan o'tgan. Telefon raqami: ${finalPhone}`,
          existingUser: {
            type: 'punkt',
            id: existingPunkt._id,
            name: existingPunkt.name,
            viloyat: punktViloyatId,
          },
        });
      }
      // If punkt is in different region, allow creating new agent (will be handled below)
    }

    // Validate regions exist
    const viloyat = await Region.findById(viloyatId);
    if (!viloyat || viloyat.type !== 'region') {
      return res.status(400).json({
        success: false,
        message: 'Viloyat topilmadi yoki noto\'g\'ri',
      });
    }

    if (tumanId) {
      const tuman = await Region.findById(tumanId);
      if (!tuman || tuman.type !== 'district' || tuman.parent?.toString() !== viloyatId) {
        return res.status(400).json({
          success: false,
          message: 'Tuman topilmadi yoki berilgan viloyatga tegishli emas',
        });
      }
    }

    if (mfyId) {
      const mfy = await Region.findById(mfyId);
      if (!mfy || mfy.type !== 'mfy' || mfy.parent?.toString() !== tumanId) {
        return res.status(400).json({
          success: false,
          message: 'MFY topilmadi yoki berilgan tumanga tegishli emas',
        });
      }
    }

    // Check if phone already exists for the position type in the same region
    // Only check within the same region - different regions can have same phone
    let existingUser = null;
    if (positionType === 'punkt') {
      existingUser = await Punkt.findOne({
        phone: finalPhone,
        viloyat: viloyatId,
        isDeleted: { $ne: true },
      });
    } else {
      // For agents, check if phone exists in the same region and position type
      const agentFilter = {
        phone: finalPhone,
        viloyat: viloyatId,
        isDeleted: { $ne: true },
      };
      
      // Also match the specific agent type (tuman/mfy requirements)
      if (positionType === 'tuman_agent') {
        agentFilter.tuman = tumanId;
      } else if (positionType === 'mfy_agent') {
        agentFilter.tuman = tumanId;
        agentFilter.mfy = mfyId;
      } else if (positionType === 'viloyat_agent') {
        // Viloyat agent should not have tuman or mfy
        agentFilter.tuman = null;
        agentFilter.mfy = null;
      }
      
      existingUser = await Agent.findOne(agentFilter);
    }

    let user;
    let isNewUser = false;

    if (positionType === 'punkt') {
      if (existingUser) {
        // Update existing punkt
        existingUser.name = finalName;
        existingUser.phone = finalPhone;
        existingUser.viloyat = viloyatId;
        existingUser.tuman = tumanId || null;
        existingUser.status = 'active';
        existingUser.isDeleted = false;
        existingUser.deletedAt = null;
        existingUser.passwordSetupAllowed = true; // Allow password setup
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new punkt
        user = await Punkt.create({
          name: finalName,
          phone: finalPhone,
          viloyat: viloyatId,
          tuman: tumanId || null,
          passwordSetupAllowed: true, // No password required initially
          status: 'active',
        });
        isNewUser = true;
      }
    } else {
      // Agent types
      const agentData = {
        name: finalName,
        phone: finalPhone,
        viloyat: viloyatId,
        passwordSetupAllowed: true, // No password required initially
        status: 'active',
      };

      if (positionType === 'tuman_agent') {
        agentData.tuman = tumanId;
      } else if (positionType === 'mfy_agent') {
        agentData.tuman = tumanId;
        agentData.mfy = mfyId;
      }

      if (existingUser) {
        // Update existing agent
        existingUser.name = agentData.name;
        existingUser.phone = agentData.phone;
        existingUser.viloyat = agentData.viloyat;
        existingUser.tuman = agentData.tuman || null;
        existingUser.mfy = agentData.mfy || null;
        existingUser.status = agentData.status;
        existingUser.passwordSetupAllowed = true; // Allow password setup
        existingUser.isDeleted = false;
        existingUser.deletedAt = null;
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new agent
        user = await Agent.create(agentData);
        isNewUser = true;
      }
    }

    // Update candidate data if provided (only if certificate exists)
    if (certificate) {
      if (name && (name !== candidate.firstName + ' ' + candidate.lastName)) {
        const nameParts = name.trim().split(' ');
        candidate.firstName = nameParts[0] || candidate.firstName;
        candidate.lastName = nameParts.slice(1).join(' ') || candidate.lastName;
      }

      if (phone && phone !== candidate.phone) {
        candidate.phone = phone;
      }

      await candidate.save();
    }

    // Populate regions for response
    await user.populate('viloyat', 'name type code');
    if (user.tuman) {
      await user.populate('tuman', 'name type code');
    }
    if (user.mfy) {
      await user.populate('mfy', 'name type code');
    }

    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Nomzod muvaffaqiyatli ishga tayinlandi' : 'Nomzod ma\'lumotlari yangilandi va ishga tayinlandi',
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          positionType: positionType,
          viloyat: user.viloyat,
          tuman: user.tuman || null,
          mfy: user.mfy || null,
          status: user.status,
          passwordSetupAllowed: user.passwordSetupAllowed,
          isNew: isNewUser,
        },
        certificate: certificate ? {
          id: certificate._id,
          certificateNumber: certificate.certificateNumber,
          status: certificate.status,
        } : {
          certificateNumber: certificateCode,
          status: 'not_found',
          note: 'Sertifikat tizimda topilmadi, lekin sertifikat raqami bilan ishga tayinlandi',
        },
        candidate: {
          id: candidate._id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          fullName: candidate.fullName,
          phone: candidate.phone,
        },
      },
    });
  } catch (error) {
    console.error('Error in assignCertificateToPosition:', error);

    // Handle duplicate phone error
    if (error.code === 11000 || error.message.includes('duplicate')) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon raqami allaqachon ishlatilgan',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

module.exports = {
  assignCertificateToPosition,
};

