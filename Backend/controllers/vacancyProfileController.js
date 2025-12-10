const VacancyApplicant = require('../models/VacancyApplicant');
const Region = require('../models/Region');

// Get current applicant profile
const getMe = async (req, res) => {
  try {
    const applicantId = req.user.userId;

    const applicant = await VacancyApplicant.findById(applicantId)
      .select('-password')
      .populate('viloyat', 'name type code')
      .populate('tuman', 'name type code')
      .populate('mfy', 'name type code');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Nomzod topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    console.error('Error fetching applicant profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profilni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update applicant profile (firstName, lastName, gender, birthDate)
const updateProfile = async (req, res) => {
  try {
    const applicantId = req.user.userId;
    const { firstName, lastName, gender, birthDate } = req.body;

    const applicant = await VacancyApplicant.findById(applicantId);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Nomzod topilmadi',
      });
    }

    // Update allowed fields
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak',
        });
      }
      applicant.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak',
        });
      }
      applicant.lastName = lastName.trim();
    }

    if (gender !== undefined) {
      if (!['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: 'Jins noto\'g\'ri (male, female, other)',
        });
      }
      applicant.gender = gender;
    }

    if (birthDate !== undefined) {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Tug\'ilgan sana noto\'g\'ri format',
        });
      }
      applicant.birthDate = date;
    }

    await applicant.save();

    // Populate regions
    await applicant.populate('viloyat', 'name type code');
    await applicant.populate('tuman', 'name type code');
    await applicant.populate('mfy', 'name type code');

    const applicantObj = applicant.toObject();
    delete applicantObj.password;

    res.status(200).json({
      success: true,
      message: 'Profil yangilandi',
      data: applicantObj,
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
    const applicantId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Joriy parol va yangi parol kiritilishi shart',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
      });
    }

    const applicant = await VacancyApplicant.findById(applicantId).select('+password');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Nomzod topilmadi',
      });
    }

    // Verify current password
    const isPasswordValid = await applicant.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Joriy parol noto\'g\'ri',
      });
    }

    // Update password
    applicant.password = newPassword;
    await applicant.save();

    res.status(200).json({
      success: true,
      message: 'Parol yangilandi',
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Parolni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update avatar
const updateAvatar = async (req, res) => {
  try {
    const applicantId = req.user.userId;
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

    // Validate base64 data size (max 5MB)
    const base64Data = avatar.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > 5) {
      return res.status(400).json({
        success: false,
        message: 'Avatar hajmi 5MB dan oshmasligi kerak',
      });
    }

    const applicant = await VacancyApplicant.findById(applicantId);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Nomzod topilmadi',
      });
    }

    // Update avatar
    applicant.avatar = avatar;
    await applicant.save();

    // Populate regions
    await applicant.populate('viloyat', 'name type code');
    await applicant.populate('tuman', 'name type code');
    await applicant.populate('mfy', 'name type code');

    const applicantObj = applicant.toObject();
    delete applicantObj.password;

    res.status(200).json({
      success: true,
      message: 'Avatar yangilandi',
      data: applicantObj,
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
    const applicantId = req.user.userId;
    const { viloyat, tuman, mfy } = req.body;

    const applicant = await VacancyApplicant.findById(applicantId);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Nomzod topilmadi',
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
      applicant.viloyat = viloyat;
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
      } else if (!viloyat && applicant.viloyat) {
        // If viloyat is not being updated, check against current viloyat
        if (tumanRegion.parent?.toString() !== applicant.viloyat.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Tuman tanlangan viloyatga tegishli emas',
          });
        }
      }

      applicant.tuman = tuman;
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
      const targetTuman = tuman || applicant.tuman;
      if (targetTuman && mfyRegion.parent?.toString() !== targetTuman.toString()) {
        return res.status(400).json({
          success: false,
          message: 'MFY tanlangan tumanga tegishli emas',
        });
      }

      applicant.mfy = mfy;
    }

    await applicant.save();

    // Populate regions
    await applicant.populate('viloyat', 'name type code');
    await applicant.populate('tuman', 'name type code');
    await applicant.populate('mfy', 'name type code');

    const applicantObj = applicant.toObject();
    delete applicantObj.password;

    res.status(200).json({
      success: true,
      message: 'Manzil yangilandi',
      data: applicantObj,
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





