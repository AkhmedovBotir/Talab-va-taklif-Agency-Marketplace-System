const mongoose = require('mongoose');

const deliveryRegionSchema = new mongoose.Schema(
  {
    viloyat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: true,
    },
    tuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Maxsulot nomi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Maxsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [500, 'Maxsulot nomi 500 ta belgidan oshmasligi kerak'],
    },
    description: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    price: {
      type: Number,
      required: [true, 'Narx kiritilishi shart'],
      min: [0, 'Narx 0 dan kichik bo\'la olmaydi'],
    },
    originalPrice: {
      type: Number,
      required: [true, 'Asl narx kiritilishi shart'],
      min: [0, 'Asl narx 0 dan kichik bo\'la olmaydi'],
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'Maksimal 5 ta rasm yuklash mumkin',
      },
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Kategoriya kiritilishi shart'],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, 'Miqdor kiritilishi shart'],
      min: [0, 'Miqdor 0 dan kichik bo\'la olmaydi'],
    },
    unit: {
      type: String,
      enum: ['dona', 'litr', 'kg'],
      required: [true, 'Birlik kiritilishi shart'],
    },
    unitSize: {
      type: Number,
      default: null,
      min: [0, 'Birlik o\'lchami 0 dan kichik bo\'la olmaydi'],
    },
    length: {
      type: Number,
      default: null,
      min: [0, 'Bo\'yi 0 dan kichik bo\'la olmaydi'],
    },
    width: {
      type: Number,
      default: null,
      min: [0, 'Eni 0 dan kichik bo\'la olmaydi'],
    },
    weight: {
      type: Number,
      default: null,
      min: [0, 'Og\'irligi 0 dan kichik bo\'la olmaydi'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      required: true,
    },
    contragent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contragent',
      required: true,
    },
    deliveryRegions: {
      type: [deliveryRegionSchema],
      default: [],
    },
    kpiBonusPercent: {
      type: Number,
      required: [true, 'KPI bonus foizi kiritilishi shart'],
      min: [0, 'KPI bonus foizi 0 dan kichik bo\'la olmaydi'],
      max: [100, 'KPI bonus foizi 100 dan katta bo\'la olmaydi'],
    },
    productCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ contragent: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ status: 1 });
productSchema.index({ productCode: 1 }, { unique: true });
productSchema.index({ 'deliveryRegions.viloyat': 1 });
productSchema.index({ 'deliveryRegions.tuman': 1 });

// Method to generate product code
productSchema.statics.generateProductCode = async function (contragentId) {
  const Contragent = mongoose.model('Contragent');
  const contragent = await Contragent.findById(contragentId);
  
  if (!contragent) {
    throw new Error('Contragent topilmadi');
  }

  // Get last product code for this contragent
  const lastProduct = await this.findOne({ contragent: contragentId })
    .sort({ createdAt: -1 })
    .select('productCode');

  if (!lastProduct || !lastProduct.productCode) {
    return '001';
  }

  // Extract numeric part and suffix
  const match = lastProduct.productCode.match(/^(\d+)([a-z]*)$/i);
  
  if (!match) {
    return '001';
  }

  let numPart = parseInt(match[1], 10);
  let suffix = match[2] || '';

  // Try to increment number
  numPart++;
  
  // Format with leading zeros
  let newCode;
  
  // If number exceeds 999, add letter suffix
  if (numPart > 999) {
    if (!suffix) {
      suffix = 'a';
    } else {
      // Increment suffix letter
      const lastChar = suffix[suffix.length - 1].toLowerCase();
      if (lastChar === 'z') {
        suffix += 'a';
      } else {
        suffix = suffix.slice(0, -1) + String.fromCharCode(lastChar.charCodeAt(0) + 1);
      }
    }
    newCode = '001' + suffix;
    numPart = 1;
  } else {
    newCode = numPart.toString().padStart(3, '0') + suffix;
  }

  // Check if code already exists and find unique one
  let attempts = 0;
  while (await this.findOne({ productCode: newCode, contragent: contragentId }) && attempts < 1000) {
    numPart++;
    if (numPart > 999) {
      if (!suffix) {
        suffix = 'a';
      } else {
        const lastChar = suffix[suffix.length - 1].toLowerCase();
        if (lastChar === 'z') {
          suffix += 'a';
        } else {
          suffix = suffix.slice(0, -1) + String.fromCharCode(lastChar.charCodeAt(0) + 1);
        }
      }
      newCode = '001' + suffix;
      numPart = 1;
    } else {
      newCode = numPart.toString().padStart(3, '0') + suffix;
    }
    attempts++;
  }

  return newCode;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

