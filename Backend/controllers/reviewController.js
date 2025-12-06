const Review = require('../models/Review');
const ReviewContact = require('../models/ReviewContact');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Create review (Marketplace user)
const createReview = async (req, res) => {
  try {
    const { orderId, productId, rating, commentTemplateId, customComment, isPositive } = req.body;
    const userId = req.user.userId;

    // Validate order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu buyurtma sizga tegishli emas',
      });
    }

    // Check if order is confirmed by customer
    if (order.status !== 'confirmed_by_customer') {
      return res.status(400).json({
        success: false,
        message: 'Faqat mijoz tomonidan tasdiqlangan buyurtmalarni baholash mumkin',
      });
    }

    // Validate product exists in order
    const productInOrder = order.items.find(
      (item) => item.product.toString() === productId.toString()
    );
    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: 'Bu mahsulot buyurtmada mavjud emas',
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      order: orderId,
      product: productId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bu mahsulot uchun baholash allaqachon mavjud',
      });
    }

    // Validate: Either commentTemplateId OR customComment must be provided, not both
    if (commentTemplateId && customComment) {
      return res.status(400).json({
        success: false,
        message: 'Shablon yoki maxsus kommentariya tanlanishi kerak, ikkalasi bir vaqtda bo\'lmaydi',
      });
    }

    if (!commentTemplateId && !customComment) {
      return res.status(400).json({
        success: false,
        message: 'Shablon yoki maxsus kommentariya kiritilishi shart',
      });
    }

    // If rating is 3 or less, it's automatically negative
    const isLowRating = rating <= 3;
    
    // If customComment is provided, isPositive must be set (unless rating <= 3, then it's auto false)
    if (customComment && isPositive === undefined && !isLowRating) {
      return res.status(400).json({
        success: false,
        message: 'Maxsus kommentariya bilan isPositive (true/false) belgilanishi shart',
      });
    }

    // If commentTemplateId is provided, isPositive should not be set (unless rating <= 3)
    if (commentTemplateId && isPositive !== undefined && !isLowRating) {
      return res.status(400).json({
        success: false,
        message: 'Shablon tanlaganda isPositive belgilash mumkin emas',
      });
    }

    // Auto-set isPositive to false if rating <= 3
    let finalIsPositive = isPositive;
    if (isLowRating) {
      finalIsPositive = false;
    }

    // Validate commentTemplateId if provided
    if (commentTemplateId) {
      const ReviewCommentTemplate = require('../models/ReviewCommentTemplate');
      const template = await ReviewCommentTemplate.findById(commentTemplateId);
      if (!template || !template.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Kommentariya shabloni topilmadi yoki faol emas',
        });
      }
    }

    // Create review first
    const reviewData = {
      order: orderId,
      product: productId,
      user: userId,
      rating,
      commentTemplate: commentTemplateId || null,
      customComment: customComment || null,
      isPositive: finalIsPositive !== undefined ? finalIsPositive : null,
    };

    const review = await Review.create(reviewData);

    // Create contact if:
    // 1. Rating <= 3 (automatically negative)
    // 2. customComment is provided and isPositive is set
    let contact = null;
    let contactMessage = null;
    
    if (isLowRating) {
      // If rating <= 3, create contact automatically
      if (customComment) {
        contactMessage = customComment;
      } else if (commentTemplateId) {
        // Get template text
        const ReviewCommentTemplate = require('../models/ReviewCommentTemplate');
        const template = await ReviewCommentTemplate.findById(commentTemplateId);
        contactMessage = template ? template.text : 'Past baholash';
      } else {
        contactMessage = 'Past baholash';
      }
      
      contact = await ReviewContact.create({
        review: review._id,
        message: contactMessage,
        isPositive: false,
        status: 'pending',
      });
      
      // Update review with contact ID
      review.contact = contact._id;
      review.isPositive = false;
      await review.save();
    } else if (customComment && finalIsPositive !== undefined && finalIsPositive !== null) {
      // If customComment is provided and isPositive is set (for rating > 3)
      contact = await ReviewContact.create({
        review: review._id,
        message: customComment,
        isPositive: finalIsPositive,
        status: 'pending',
      });
      
      // Update review with contact ID
      review.contact = contact._id;
      await review.save();
    }

    // Populate data
    await review.populate('product', 'name images');
    await review.populate('commentTemplate', 'text order');
    if (contact) {
      await review.populate('contact');
    }

    res.status(201).json({
      success: true,
      message: 'Baholash yaratildi',
      data: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Baholash yaratishda xatolik',
      error: error.message,
    });
  }
};

// Get all reviews (Admin only)
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, productId, orderId, isPositive } = req.query;

    const query = {};
    if (rating) query.rating = parseInt(rating);
    if (productId) query.product = productId;
    if (orderId) query.order = orderId;
    if (isPositive !== undefined) {
      if (isPositive === 'true') {
        query.isPositive = true;
      } else if (isPositive === 'false') {
        query.isPositive = false;
      } else {
        query.isPositive = null;
      }
    }

    const reviews = await Review.find(query)
      .populate('order', 'orderNumber')
      .populate('product', 'name images')
      .populate('user', 'firstName lastName phone')
      .populate('commentTemplate', 'text order')
      .populate('contact')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Baholashlarni olishda xatolik',
      error: error.message,
    });
  }
};

// Get review by ID
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('order', 'orderNumber')
      .populate('product', 'name images')
      .populate('user', 'firstName lastName phone')
      .populate('commentTemplate', 'text order')
      .populate('contact');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Baholash topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Baholashni olishda xatolik',
      error: error.message,
    });
  }
};

// Get reviews for specific product (Public)
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'firstName lastName')
      .populate('commentTemplate', 'text order')
      .select('-contact -isPositive') // Don't show contact and isPositive to public
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ product: productId });

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    const reviewCount = avgRatingResult.length > 0 ? avgRatingResult[0].count : 0;

    res.status(200).json({
      success: true,
      data: reviews,
      statistics: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviewCount,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Mahsulot baholashlarini olishda xatolik',
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  getProductReviews,
};

