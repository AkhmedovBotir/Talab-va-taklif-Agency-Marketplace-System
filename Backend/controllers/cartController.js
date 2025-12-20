const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status deliveryRegions',
      populate: [
        {
          path: 'category',
          select: 'name slug status',
        },
        {
          path: 'subcategory',
          select: 'name slug status',
        },
        {
          path: 'contragent',
          select: 'name phone viloyat tuman mfy status',
          populate: [
            { path: 'viloyat', select: 'name type code' },
            { path: 'tuman', select: 'name type code' },
            { path: 'mfy', select: 'name type code' },
          ],
        },
        {
          path: 'deliveryRegions.viloyat',
          select: 'name type code',
        },
        {
          path: 'deliveryRegions.tuman',
          select: 'name type code',
        },
      ],
    });

    // If cart doesn't exist, create empty cart
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Filter out inactive products and calculate totals
    const activeItems = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    cart.items.forEach((item) => {
      if (item.product && item.product.status === 'active') {
        // Remove kpiBonusPercent if exists
        const productObj = item.product.toObject();
        delete productObj.kpiBonusPercent;

        activeItems.push({
          product: productObj,
          quantity: item.quantity,
        });

        totalPrice += item.product.price * item.quantity;
        totalOriginalPrice += item.product.originalPrice * item.quantity;
      }
    });

    // Update cart with only active items
    if (activeItems.length !== cart.items.length) {
      cart.items = activeItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: {
        _id: cart._id,
        items: activeItems,
        totalItems: activeItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice,
        totalOriginalPrice,
        totalDiscount: totalOriginalPrice - totalPrice,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Korzinkani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Maxsulot ID kiritilishi shart',
      });
    }

    const qty = quantity ? parseInt(quantity, 10) : 1;
    if (qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Miqdor kamida 1 bo\'lishi kerak',
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu maxsulot hozir mavjud emas',
      });
    }

    // Check if product has enough quantity
    if (product.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: `Mavjud miqdor: ${product.quantity}. Siz ${qty} ta so\'rayapsiz`,
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + qty;

      // Check if new quantity exceeds available quantity
      if (newQuantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Mavjud miqdor: ${product.quantity}. Jami miqdor ${newQuantity} ta bo\'ladi`,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: qty,
      });
    }

    await cart.save();

    // Populate cart items
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status',
      populate: [
        {
          path: 'category',
          select: 'name slug status',
        },
        {
          path: 'subcategory',
          select: 'name slug status',
        },
        {
          path: 'contragent',
          select: 'name phone viloyat tuman mfy status',
        },
      ],
    });

    // Calculate totals
    let totalPrice = 0;
    let totalOriginalPrice = 0;
    const items = cart.items
      .filter((item) => item.product && item.product.status === 'active')
      .map((item) => {
        const productObj = item.product.toObject();
        delete productObj.kpiBonusPercent;

        totalPrice += item.product.price * item.quantity;
        totalOriginalPrice += item.product.originalPrice * item.quantity;

        return {
          product: productObj,
          quantity: item.quantity,
        };
      });

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Maxsulot korzinkaga qo\'shildi',
      data: {
        _id: cart._id,
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice,
        totalOriginalPrice,
        totalDiscount: totalOriginalPrice - totalPrice,
      },
    });
  } catch (error) {
    console.error('Error adding to cart:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Korzinkaga qo\'shishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Miqdor kamida 1 bo\'lishi kerak',
      });
    }

    const qty = parseInt(quantity, 10);

    // Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Korzinka topilmadi',
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot korzinkada topilmadi',
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (product.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bu maxsulot hozir mavjud emas',
      });
    }

    // Check if quantity is available
    if (product.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: `Mavjud miqdor: ${product.quantity}. Siz ${qty} ta so\'rayapsiz`,
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = qty;
    await cart.save();

    // Populate cart items
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status',
      populate: [
        {
          path: 'category',
          select: 'name slug status',
        },
        {
          path: 'subcategory',
          select: 'name slug status',
        },
        {
          path: 'contragent',
          select: 'name phone viloyat tuman mfy status',
        },
      ],
    });

    // Calculate totals
    let totalPrice = 0;
    let totalOriginalPrice = 0;
    const items = cart.items
      .filter((item) => item.product && item.product.status === 'active')
      .map((item) => {
        const productObj = item.product.toObject();
        delete productObj.kpiBonusPercent;

        totalPrice += item.product.price * item.quantity;
        totalOriginalPrice += item.product.originalPrice * item.quantity;

        return {
          product: productObj,
          quantity: item.quantity,
        };
      });

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Korzinka yangilandi',
      data: {
        _id: cart._id,
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice,
        totalOriginalPrice,
        totalDiscount: totalOriginalPrice - totalPrice,
      },
    });
  } catch (error) {
    console.error('Error updating cart item:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Korzinkani yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    // Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Korzinka topilmadi',
      });
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot korzinkada topilmadi',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate cart items
    await cart.populate({
      path: 'items.product',
      select: 'name price originalPrice images category subcategory contragent quantity unit unitSize status',
      populate: [
        {
          path: 'category',
          select: 'name slug status',
        },
        {
          path: 'subcategory',
          select: 'name slug status',
        },
        {
          path: 'contragent',
          select: 'name phone viloyat tuman mfy status',
        },
      ],
    });

    // Calculate totals
    let totalPrice = 0;
    let totalOriginalPrice = 0;
    const items = cart.items
      .filter((item) => item.product && item.product.status === 'active')
      .map((item) => {
        const productObj = item.product.toObject();
        delete productObj.kpiBonusPercent;

        totalPrice += item.product.price * item.quantity;
        totalOriginalPrice += item.product.originalPrice * item.quantity;

        return {
          product: productObj,
          quantity: item.quantity,
        };
      });

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Maxsulot korzinkadan olib tashlandi',
      data: {
        _id: cart._id,
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice,
        totalOriginalPrice,
        totalDiscount: totalOriginalPrice - totalPrice,
      },
    });
  } catch (error) {
    console.error('Error removing from cart:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Korzinkadan olib tashlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Clear cart (remove all items)
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Korzinka topilmadi',
      });
    }

    cart.items = [];
    await cart.save();

    // Invalidate cache

    res.status(200).json({
      success: true,
      message: 'Korzinka tozalandi',
      data: {
        _id: cart._id,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        totalOriginalPrice: 0,
        totalDiscount: 0,
      },
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Korzinkani tozalashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};






