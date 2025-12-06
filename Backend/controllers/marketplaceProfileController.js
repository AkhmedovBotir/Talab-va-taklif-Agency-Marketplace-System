const MarketplaceUser = require('../models/MarketplaceUser');
const Region = require('../models/Region');
const bcrypt = require('bcrypt');

// Get current user profile
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await MarketplaceUser.findById(userId)
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Ma\'lumotlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update user profile (firstName, lastName, gender, birthDate)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, gender, birthDate } = req.body;

    const user = await MarketplaceUser.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Update allowed fields
    if (firstName !== undefined) {
      user.firstName = firstName;
    }

    if (lastName !== undefined) {
      user.lastName = lastName;
    }

    if (gender !== undefined) {
      user.gender = gender;
    }

    if (birthDate !== undefined) {
      user.birthDate = birthDate;
    }

    await user.save();

    // Populate regions
    await user.populate('viloyat', 'name type code');
    await user.populate('tuman', 'name type code');
    await user.populate('mfy', 'name type code');

    res.status(200).json({
      success: true,
      message: 'Profil yangilandi',
      data: user,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profilni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await MarketplaceUser.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Joriy parol noto\'g\'ri',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Parol muvaffaqiyatli o\'zgartirildi',
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Parolni o\'zgartirishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update avatar
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Avatar (base64) kiritilishi shart',
      });
    }

    // Validate base64 format
    const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
    if (!base64Regex.test(avatar)) {
      return res.status(400).json({
        success: false,
        message: 'Avatar base64 formatida bo\'lishi kerak (data:image/png;base64,... yoki data:image/jpeg;base64,...)',
      });
    }

    const user = await MarketplaceUser.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Update avatar
    user.avatar = avatar;
    await user.save();

    // Populate regions
    await user.populate('viloyat', 'name type code');
    await user.populate('tuman', 'name type code');
    await user.populate('mfy', 'name type code');

    res.status(200).json({
      success: true,
      message: 'Avatar yangilandi',
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Avatarni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update location (viloyat, tuman, mfy)
const updateLocation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { viloyat, tuman, mfy } = req.body;

    const user = await MarketplaceUser.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Validate regions if provided
    if (viloyat) {
      const viloyatRegion = await Region.findById(viloyat);
      if (!viloyatRegion || viloyatRegion.type !== 'region') {
        return res.status(400).json({
          success: false,
          message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
        });
      }
      user.viloyat = viloyat;
    }

    if (tuman) {
      const tumanRegion = await Region.findById(tuman);
      if (!tumanRegion || tumanRegion.type !== 'district') {
        return res.status(400).json({
          success: false,
          message: 'Tuman topilmadi yoki noto\'g\'ri tur',
        });
      }

      // If viloyat is also being updated, validate hierarchy
      if (viloyat && tumanRegion.parent?.toString() !== viloyat) {
        return res.status(400).json({
          success: false,
          message: 'Tuman tanlangan viloyatga tegishli emas',
        });
      } else if (!viloyat && user.viloyat) {
        // If viloyat is not being updated, check against current viloyat
        if (tumanRegion.parent?.toString() !== user.viloyat.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman tanlangan viloyatga tegishli emas',
          });
        }
      }

      user.tuman = tuman;
    }

    if (mfy) {
      const mfyRegion = await Region.findById(mfy);
      if (!mfyRegion || mfyRegion.type !== 'mfy') {
        return res.status(400).json({
          success: false,
          message: 'MFY topilmadi yoki noto\'g\'ri tur',
        });
      }

      // Validate hierarchy
      const targetTuman = tuman || user.tuman;
      if (targetTuman && mfyRegion.parent?.toString() !== targetTuman.toString()) {
        return res.status(400).json({
          success: false,
          message: 'MFY tanlangan tumanga tegishli emas',
        });
      }

      user.mfy = mfy;
    }

    await user.save();

    // Populate regions
    await user.populate('viloyat', 'name type code');
    await user.populate('tuman', 'name type code');
    await user.populate('mfy', 'name type code');

    res.status(200).json({
      success: true,
      message: 'Manzil yangilandi',
      data: user,
    });
  } catch (error) {
    console.error('Error updating location:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri region ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Manzilni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getMe,
  updateProfile,
  updatePassword,
  updateAvatar,
  updateLocation,
};





