const DeliveryProvider = require('../models/DeliveryProvider');
const jwt = require('jsonwebtoken');

// Login delivery provider
const loginDeliveryProvider = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find delivery provider with password field included (only non-deleted and active)
    const deliveryProvider = await DeliveryProvider.findOne({
      phone,
      isDeleted: { $ne: true },
      status: 'active',
    }).select('+password');

    if (!deliveryProvider) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Check if password is set
    if (!deliveryProvider.password) {
      return res.status(400).json({
        success: false,
        message: 'Parol o\'rnatilmagan. Iltimos, avval parol o\'rnating',
      });
    }

    // Compare password
    const isPasswordValid = await deliveryProvider.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Telefon raqami yoki parol noto\'g\'ri',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: deliveryProvider._id.toString(),
        phone: deliveryProvider.phone,
        role: 'deliveryProvider',
        contragentId: deliveryProvider.contragent.toString(),
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    // Populate contragent
    await deliveryProvider.populate('contragent', 'name phone viloyat tuman mfy contragentLevel');

    res.status(200).json({
      success: true,
      message: 'Muvaffaqiyatli kirildi',
      data: {
        token,
        deliveryProvider: {
          _id: deliveryProvider._id,
          name: deliveryProvider.name,
          phone: deliveryProvider.phone,
          contragent: deliveryProvider.contragent,
          status: deliveryProvider.status,
          notes: deliveryProvider.notes,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in delivery provider:', error);
    res.status(500).json({
      success: false,
      message: 'Login qilishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  loginDeliveryProvider,
};
