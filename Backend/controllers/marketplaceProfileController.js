const MarketplaceUser = require('../models/MarketplaceUser');
const MarketplaceUserRegionSelection = require('../models/MarketplaceUserRegionSelection');
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

// Get viloyat and tuman only (separate API - from separate model)
const getViloyatTuman = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user exists
    const user = await MarketplaceUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Get or create region selection
    let regionSelection = await MarketplaceUserRegionSelection.findOne({ user: userId })
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code');

    // If doesn't exist, create empty one
    if (!regionSelection) {
      regionSelection = await MarketplaceUserRegionSelection.create({
        user: userId,
        viloyat: null,
        tuman: null,
      });
      await regionSelection.populate('viloyat', 'name type code');
      await regionSelection.populate('tuman', 'name type code');
    }

    res.status(200).json({
      success: true,
      data: {
        _id: regionSelection._id,
        user: regionSelection.user,
        viloyat: regionSelection.viloyat,
        tuman: regionSelection.tuman,
      },
    });
  } catch (error) {
    console.error('Error fetching viloyat and tuman:', error);
    res.status(500).json({
      success: false,
      message: 'Viloyat va tumanni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update viloyat and tuman only (separate API - from separate model)
const updateViloyatTuman = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { viloyat, tuman } = req.body;

    // Check if user exists
    const user = await MarketplaceUser.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Get or create region selection
    let regionSelection = await MarketplaceUserRegionSelection.findOne({ user: userId });

    if (!regionSelection) {
      regionSelection = await MarketplaceUserRegionSelection.create({
        user: userId,
        viloyat: null,
        tuman: null,
      });
    }

    // Validate viloyat if provided
    if (viloyat !== undefined) {
      if (viloyat === null || viloyat === '') {
        // Allow clearing viloyat
        regionSelection.viloyat = null;
        // Also clear tuman if viloyat is cleared
        regionSelection.tuman = null;
      } else {
        const viloyatRegion = await Region.findById(viloyat);
        if (!viloyatRegion || viloyatRegion.type !== 'region') {
          return res.status(400).json({
            success: false,
            message: 'Viloyat topilmadi yoki noto\'g\'ri tur',
          });
        }
        regionSelection.viloyat = viloyat;

        // If viloyat is changed and tuman is not provided, clear tuman if it doesn't belong to new viloyat
        if (tuman === undefined && regionSelection.tuman) {
          const currentTuman = await Region.findById(regionSelection.tuman);
          if (currentTuman && currentTuman.parent?.toString() !== viloyat) {
            regionSelection.tuman = null;
          }
        }
      }
    }

    // Validate tuman if provided
    if (tuman !== undefined) {
      if (tuman === null || tuman === '') {
        // Allow clearing tuman
        regionSelection.tuman = null;
      } else {
        const tumanRegion = await Region.findById(tuman);
        if (!tumanRegion || tumanRegion.type !== 'district') {
          return res.status(400).json({
            success: false,
            message: 'Tuman topilmadi yoki noto\'g\'ri tur',
          });
        }

        // Validate hierarchy - tuman must belong to viloyat
        const targetViloyat = viloyat !== undefined ? viloyat : regionSelection.viloyat;
        if (!targetViloyat) {
          return res.status(400).json({
            success: false,
            message: 'Avval viloyat tanlashingiz kerak',
          });
        }

        if (tumanRegion.parent?.toString() !== targetViloyat.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman tanlangan viloyatga tegishli emas',
          });
        }

        regionSelection.tuman = tuman;
      }
    }

    await regionSelection.save();

    // Populate regions
    await regionSelection.populate('viloyat', 'name type code');
    await regionSelection.populate('tuman', 'name type code');

    res.status(200).json({
      success: true,
      message: 'Viloyat va tuman yangilandi',
      data: {
        _id: regionSelection._id,
        user: regionSelection.user,
        viloyat: regionSelection.viloyat,
        tuman: regionSelection.tuman,
      },
    });
  } catch (error) {
    console.error('Error updating viloyat and tuman:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri region ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Viloyat va tumanni yangilashda xatolik yuz berdi',
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
  getViloyatTuman,
  updateViloyatTuman,
};





