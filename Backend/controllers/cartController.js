const Cart = require('../models/Cart');
const Product = require('../models/Product');
const MaxallaProduct = require('../models/MaxallaProduct');
const BaseProduct = require('../models/BaseProduct');

// Helper function to populate product based on type
const populateProduct = async (productId, productType) => {
  if (productType === 'maxalla') {
    const maxallaProduct = await MaxallaProduct.findById(productId)
      .populate({
        path: 'baseProduct',
        select: 'name description images category subcategory unit unitSize status',
        populate: [
          { path: 'category', select: 'name slug status' },
          { path: 'subcategory', select: 'name slug status' },
        ],
      })
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      });

    if (!maxallaProduct) return null;

    // Transform to marketplace format
    const bp = maxallaProduct.baseProduct;
    return {
      _id: maxallaProduct._id,
      name: bp.name,
      description: bp.description,
      images: bp.images,
      price: maxallaProduct.price,
      originalPrice: maxallaProduct.originalPrice,
      quantity: maxallaProduct.quantity,
      unit: bp.unit,
      unitSize: bp.unitSize,
      category: bp.category,
      subcategory: bp.subcategory,
      contragent: maxallaProduct.contragent,
      status: maxallaProduct.status,
      productType: 'maxalla',
    };
  } else {
    const product = await Product.findById(productId)
      .populate('category', 'name slug status')
      .populate('subcategory', 'name slug status')
      .populate({
        path: 'contragent',
        select: 'name phone viloyat tuman mfy status',
        populate: [
          { path: 'viloyat', select: 'name type code' },
          { path: 'tuman', select: 'name type code' },
          { path: 'mfy', select: 'name type code' },
        ],
      })
      .populate('deliveryRegions.viloyat', 'name type code')
      .populate('deliveryRegions.tuman', 'name type code');

    if (!product) return null;

    const productObj = product.toObject();
    delete productObj.kpiBonusPercent;
    productObj.productType = 'tuman';
    return productObj;
  }
};

// Get user's cart (tuman products)
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ user: userId, cartType: 'tuman' });

    // If cart doesn't exist, create empty cart
    if (!cart) {
      try {
        cart = await Cart.create({ user: userId, cartType: 'tuman', items: [] });
      } catch (error) {
        // Handle duplicate key error (cart might have been created by another request)
        if (error.code === 11000) {
          cart = await Cart.findOne({ user: userId, cartType: 'tuman' });
          if (!cart) {
            throw error; // Re-throw if still not found
          }
        } else {
          throw error;
        }
      }
    }

    // Populate products based on type (only tuman products)
    const activeItems = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const item of cart.items) {
      // Only process tuman products in tuman cart
      if (item.productType !== 'tuman') continue;
      
      const product = await populateProduct(item.product, 'tuman');
      
      if (product && product.status === 'active') {
        activeItems.push({
          product,
          quantity: item.quantity,
          productType: 'tuman',
        });

        totalPrice += product.price * item.quantity;
        totalOriginalPrice += product.originalPrice * item.quantity;
      }
    }

    // Update cart with only active items
    if (activeItems.length !== cart.items.length) {
      cart.items = activeItems.map((item) => ({
        product: item.product._id,
        productType: 'tuman',
        productModel: 'Product',
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

// Add item to cart (tuman products only)
const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;
    const productType = 'tuman'; // Tuman cart only accepts tuman products

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Maxsulot ID kiritilishi shart',
      });
    }

    // Tuman cart only accepts tuman products

    const qty = quantity ? parseInt(quantity, 10) : 1;
    if (qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Miqdor kamida 1 bo\'lishi kerak',
      });
    }

    // Check if product exists and is active
    let product;
    if (productType === 'maxalla') {
      product = await MaxallaProduct.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Maxalla maxsuloti topilmadi',
        });
      }
      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Bu maxsulot hozir mavjud emas',
        });
      }
      if (product.quantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Mavjud miqdor: ${product.quantity}. Siz ${qty} ta so\'rayapsiz`,
        });
      }
    } else {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Maxsulot topilmadi',
        });
      }
      if (product.status !== 'active' || product.moderationStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Bu maxsulot hozir mavjud emas',
        });
      }
      if (product.quantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Mavjud miqdor: ${product.quantity}. Siz ${qty} ta so\'rayapsiz`,
        });
      }
    }

    // Get or create tuman cart
    let cart = await Cart.findOne({ user: userId, cartType: 'tuman' });
    if (!cart) {
      try {
        cart = await Cart.create({ user: userId, cartType: 'tuman', items: [] });
      } catch (error) {
        // Handle duplicate key error (cart might have been created by another request)
        if (error.code === 11000) {
          cart = await Cart.findOne({ user: userId, cartType: 'tuman' });
          if (!cart) {
            throw error; // Re-throw if still not found
          }
        } else {
          throw error;
        }
      }
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
        productType: 'tuman',
        productModel: 'Product',
        quantity: qty,
      });
    }

    await cart.save();

    // Populate products (only tuman products)
    const items = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const item of cart.items) {
      if (item.productType !== 'tuman') continue;
      
      const populatedProduct = await populateProduct(item.product, 'tuman');
      if (populatedProduct && populatedProduct.status === 'active') {
        items.push({
          product: populatedProduct,
          quantity: item.quantity,
          productType: 'tuman',
        });
        totalPrice += populatedProduct.price * item.quantity;
        totalOriginalPrice += populatedProduct.originalPrice * item.quantity;
      }
    }

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

// Update cart item quantity (tuman products only)
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

    // Get tuman cart
    const cart = await Cart.findOne({ user: userId, cartType: 'tuman' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Korzinka topilmadi',
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.productType === 'tuman'
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot korzinkada topilmadi',
      });
    }

    // Check if product exists and is active (tuman product only)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot topilmadi',
      });
    }

    if (product.status !== 'active' || product.moderationStatus !== 'approved') {
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

    // Populate products
    const items = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const cartItem of cart.items) {
      const populatedProduct = await populateProduct(cartItem.product, cartItem.productType);
      if (populatedProduct && populatedProduct.status === 'active') {
        items.push({
          product: populatedProduct,
          quantity: cartItem.quantity,
          productType: cartItem.productType,
        });
        totalPrice += populatedProduct.price * cartItem.quantity;
        totalOriginalPrice += populatedProduct.originalPrice * cartItem.quantity;
      }
    }

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

// Remove item from cart (tuman products only)
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    // Get tuman cart
    const cart = await Cart.findOne({ user: userId, cartType: 'tuman' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Korzinka topilmadi',
      });
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.productType === 'tuman'
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Maxsulot korzinkada topilmadi',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate products
    const items = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const cartItem of cart.items) {
      const populatedProduct = await populateProduct(cartItem.product, cartItem.productType);
      if (populatedProduct && populatedProduct.status === 'active') {
        items.push({
          product: populatedProduct,
          quantity: cartItem.quantity,
          productType: cartItem.productType,
        });
        totalPrice += populatedProduct.price * cartItem.quantity;
        totalOriginalPrice += populatedProduct.originalPrice * cartItem.quantity;
      }
    }

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

// Clear cart (remove all items) - tuman cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, cartType: 'tuman' });
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

// ==================== MAXALLA CART API ====================

// Get user's maxalla cart
const getMaxallaCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });

    // If cart doesn't exist, create empty cart
    if (!cart) {
      try {
        cart = await Cart.create({ user: userId, cartType: 'maxalla', items: [] });
      } catch (error) {
        // Handle duplicate key error (cart might have been created by another request)
        if (error.code === 11000) {
          cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });
          if (!cart) {
            throw error; // Re-throw if still not found
          }
        } else {
          throw error;
        }
      }
    }

    // Populate products (only maxalla products)
    const activeItems = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const item of cart.items) {
      // Only process maxalla products in maxalla cart
      if (item.productType !== 'maxalla') continue;
      
      const product = await populateProduct(item.product, 'maxalla');
      
      if (product && product.status === 'active') {
        activeItems.push({
          product,
          quantity: item.quantity,
          productType: 'maxalla',
        });

        totalPrice += product.price * item.quantity;
        totalOriginalPrice += product.originalPrice * item.quantity;
      }
    }

    // Update cart with only active items
    if (activeItems.length !== cart.items.length) {
      cart.items = activeItems.map((item) => ({
        product: item.product._id,
        productType: 'maxalla',
        productModel: 'MaxallaProduct',
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
    console.error('Error fetching maxalla cart:', error);
    res.status(500).json({
      success: false,
      message: 'Maxalla korzinkani olishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Add item to maxalla cart
const addToMaxallaCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;
    const productType = 'maxalla'; // Maxalla cart only accepts maxalla products

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

    // Check if maxalla product exists and is active
    const product = await MaxallaProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti topilmadi',
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

    // Get or create maxalla cart
    let cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });
    if (!cart) {
      try {
        cart = await Cart.create({ user: userId, cartType: 'maxalla', items: [] });
      } catch (error) {
        // Handle duplicate key error (cart might have been created by another request)
        if (error.code === 11000) {
          cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });
          if (!cart) {
            throw error; // Re-throw if still not found
          }
        } else {
          throw error;
        }
      }
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.productType === 'maxalla'
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
        productType: 'maxalla',
        productModel: 'MaxallaProduct',
        quantity: qty,
      });
    }

    await cart.save();

    // Populate products (only maxalla products)
    const items = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const item of cart.items) {
      if (item.productType !== 'maxalla') continue;
      
      const populatedProduct = await populateProduct(item.product, 'maxalla');
      if (populatedProduct && populatedProduct.status === 'active') {
        items.push({
          product: populatedProduct,
          quantity: item.quantity,
          productType: 'maxalla',
        });
        totalPrice += populatedProduct.price * item.quantity;
        totalOriginalPrice += populatedProduct.originalPrice * item.quantity;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Maxalla maxsuloti korzinkaga qo\'shildi',
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
    console.error('Error adding to maxalla cart:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxalla maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxalla korzinkaga qo\'shishda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Update maxalla cart item quantity
const updateMaxallaCartItem = async (req, res) => {
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

    // Get maxalla cart
    const cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla korzinka topilmadi',
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.productType === 'maxalla'
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti korzinkada topilmadi',
      });
    }

    // Check if maxalla product exists and is active
    const product = await MaxallaProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti topilmadi',
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

    // Populate products (only maxalla products)
    const items = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const cartItem of cart.items) {
      if (cartItem.productType !== 'maxalla') continue;
      
      const populatedProduct = await populateProduct(cartItem.product, 'maxalla');
      if (populatedProduct && populatedProduct.status === 'active') {
        items.push({
          product: populatedProduct,
          quantity: cartItem.quantity,
          productType: 'maxalla',
        });
        totalPrice += populatedProduct.price * cartItem.quantity;
        totalOriginalPrice += populatedProduct.originalPrice * cartItem.quantity;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Maxalla korzinka yangilandi',
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
    console.error('Error updating maxalla cart item:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxalla maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxalla korzinkani yangilashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Remove item from maxalla cart
const removeFromMaxallaCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    // Get maxalla cart
    const cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla korzinka topilmadi',
      });
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.productType === 'maxalla'
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla maxsuloti korzinkada topilmadi',
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate products (only maxalla products)
    const items = [];
    let totalPrice = 0;
    let totalOriginalPrice = 0;

    for (const cartItem of cart.items) {
      if (cartItem.productType !== 'maxalla') continue;
      
      const populatedProduct = await populateProduct(cartItem.product, 'maxalla');
      if (populatedProduct && populatedProduct.status === 'active') {
        items.push({
          product: populatedProduct,
          quantity: cartItem.quantity,
          productType: 'maxalla',
        });
        totalPrice += populatedProduct.price * cartItem.quantity;
        totalOriginalPrice += populatedProduct.originalPrice * cartItem.quantity;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Maxalla maxsuloti korzinkadan olib tashlandi',
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
    console.error('Error removing from maxalla cart:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri maxalla maxsulot ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Maxalla korzinkadan olib tashlashda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// Clear maxalla cart (remove all items)
const clearMaxallaCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId, cartType: 'maxalla' });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Maxalla korzinka topilmadi',
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Maxalla korzinka tozalandi',
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
    console.error('Error clearing maxalla cart:', error);
    res.status(500).json({
      success: false,
      message: 'Maxalla korzinkani tozalashda xatolik yuz berdi',
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
  getMaxallaCart,
  addToMaxallaCart,
  updateMaxallaCartItem,
  removeFromMaxallaCart,
  clearMaxallaCart,
};






