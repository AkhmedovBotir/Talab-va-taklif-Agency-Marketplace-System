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
      required: false, // Optional - kontragent profilidan olinadi
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
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: [1000, 'Rad etish sababi 1000 ta belgidan oshmasligi kerak'],
    },
    censored: {
      type: Boolean,
      default: false,
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
productSchema.index({ moderationStatus: 1 });
productSchema.index({ productCode: 1 }, { unique: true });
productSchema.index({ 'deliveryRegions.viloyat': 1 });
productSchema.index({ 'deliveryRegions.tuman': 1 });
productSchema.index({ createdAt: -1 });

// Method to generate product code (global sequence for all products)
productSchema.statics.generateProductCode = async function (contragentId) {
  const Counter = require('./Counter');

  // Validate contragent exists
  const Contragent = mongoose.model('Contragent');
  const contragent = await Contragent.findById(contragentId);

  if (!contragent) {
    throw new Error('Contragent topilmadi');
  }

  // Helper function to format code from sequence number
  const formatCode = (seqNum) => {
    if (seqNum <= 999) {
      // 001 to 999: 3 digits with leading zeros
      return seqNum.toString().padStart(3, '0');
    } else if (seqNum <= 9999) {
      // 1000 to 9999: 4 digits
      return seqNum.toString();
    } else if (seqNum <= 99999) {
      // 10000 to 99999: 5 digits
      return seqNum.toString();
    } else {
      // 100000+: Add letter prefix and 5 digits
      // Calculate: A00001, A00002, ..., A99999, B00001, B00002, ...
      const baseNumber = 100000;
      const numbersPerLetter = 99999; // A00001 to A99999 = 99999 numbers
      
      const letterIndex = Math.floor((seqNum - baseNumber) / numbersPerLetter);
      const remainder = ((seqNum - baseNumber) % numbersPerLetter) + 1;
      
      // Generate letter prefix: A=0, B=1, C=2, ..., Z=25, AA=26, AB=27, ...
      let letterPrefix = '';
      let tempIndex = letterIndex;
      
      if (tempIndex < 26) {
        // Single letter: A-Z
        letterPrefix = String.fromCharCode(65 + tempIndex); // 65 is 'A'
      } else {
        // Multiple letters: AA, AB, ..., ZZ, AAA, ...
        while (tempIndex >= 0) {
          letterPrefix = String.fromCharCode(65 + (tempIndex % 26)) + letterPrefix;
          tempIndex = Math.floor(tempIndex / 26) - 1;
        }
      }
      
      return letterPrefix + remainder.toString().padStart(5, '0');
    }
  };

  // Get next sequence number from counter
  let sequenceNumber = await Counter.getNextValue('productCode');
  let newCode = formatCode(sequenceNumber);

  // Check if code already exists (shouldn't happen, but safety check)
  let attempts = 0;
  while (await this.findOne({ productCode: newCode }) && attempts < 100) {
    // If code exists, increment sequence and try again
    sequenceNumber++;
    newCode = formatCode(sequenceNumber);
    attempts++;
  }

  // If we had to skip codes, update counter to match
  if (attempts > 0) {
    await Counter.findOneAndUpdate(
      { name: 'productCode' },
      { $set: { value: sequenceNumber } },
      { upsert: true }
    );
  }

  return newCode;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

