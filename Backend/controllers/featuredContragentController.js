const Contragent = require('../models/Contragent');

// Admin: update featured contragents list
const updateFeaturedContragents = async (req, res) => {
  try {
    const { contragentIds } = req.body;

    // Reset all flags first
    await Contragent.updateMany(
      { isFeaturedForMarketplace: true },
      { $set: { isFeaturedForMarketplace: false } }
    );

    if (contragentIds && contragentIds.length > 0) {
      await Contragent.updateMany(
        { _id: { $in: contragentIds } },
        { $set: { isFeaturedForMarketplace: true } }
      );
    }

    const featured = await Contragent.find({
      isFeaturedForMarketplace: true,
      status: 'active',
    }).select('name logo');

    res.status(200).json({
      success: true,
      message: 'Tanlangan kontragentlar muvaffaqiyatli yangilandi',
      count: featured.length,
      data: featured,
    });
  } catch (error) {
    console.error('Error updating featured contragents:', error);
    res.status(500).json({
      success: false,
      message: 'Tanlangan kontragentlarni yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Admin: get featured contragents (short info)
const getFeaturedContragentsForAdmin = async (req, res) => {
  try {
    const featured = await Contragent.find({
      isFeaturedForMarketplace: true,
      status: 'active',
    }).select('name logo');

    res.status(200).json({
      success: true,
      count: featured.length,
      data: featured,
    });
  } catch (error) {
    console.error('Error fetching featured contragents for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Tanlangan kontragentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Marketplace: get featured contragents (short info)
const getFeaturedContragentsForMarketplace = async (req, res) => {
  try {
    const featured = await Contragent.find({
      isFeaturedForMarketplace: true,
      status: 'active',
    }).select('name logo');

    res.status(200).json({
      success: true,
      count: featured.length,
      data: featured,
    });
  } catch (error) {
    console.error('Error fetching featured contragents for marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Tanlangan kontragentlarni olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  updateFeaturedContragents,
  getFeaturedContragentsForAdmin,
  getFeaturedContragentsForMarketplace,
};



