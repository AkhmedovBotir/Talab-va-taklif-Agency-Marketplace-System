const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'productModel', // Dynamic reference based on productType
      required: [true, 'Maxsulot kiritilishi shart'],
    },
    productType: {
      type: String,
      enum: ['tuman', 'maxalla'],
      default: 'tuman',
      required: true,
    },
    productModel: {
      type: String,
      enum: ['Product', 'MaxallaProduct'],
      default: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Miqdor kiritilishi shart'],
      min: [1, 'Miqdor kamida 1 bo\'lishi kerak'],
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
    kpiBonusPercent: {
      type: Number,
      required: function() {
        // Only required for tuman products
        return this.productType === 'tuman';
      },
      min: [0, 'KPI bonus foizi 0 dan kichik bo\'la olmaydi'],
      max: [100, 'KPI bonus foizi 100 dan katta bo\'la olmaydi'],
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceUser',
      required: [true, 'Foydalanuvchi kiritilishi shart'],
    },
    orderNumber: {
      type: String,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Buyurtma mahsulotlari kiritilishi shart'],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: 'Buyurtmada kamida 1 ta maxsulot bo\'lishi kerak',
      },
    },
    totalPrice: {
      type: Number,
      required: [true, 'Jami narx kiritilishi shart'],
      min: [0, 'Jami narx 0 dan kichik bo\'la olmaydi'],
    },
    totalOriginalPrice: {
      type: Number,
      required: [true, 'Jami asl narx kiritilishi shart'],
      min: [0, 'Jami asl narx 0 dan kichik bo\'la olmaydi'],
    },
    totalKpiPrice: {
      type: Number,
      required: [true, 'Jami KPI narx kiritilishi shart'],
      min: [0, 'Jami KPI narx 0 dan kichik bo\'la olmaydi'],
    },
    itemCount: {
      type: Number,
      required: [true, 'Mahsulotlar soni kiritilishi shart'],
      min: [1, 'Mahsulotlar soni kamida 1 bo\'lishi kerak'],
    },
    orderType: {
      type: String,
      enum: ['tuman', 'dokon'],
      default: 'tuman',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',                    // Yangi buyurtma
        'confirmed_by_punkt',         // Punkt tomonidan tasdiqlangan
        'requested_to_contragent',    // Contragentga so'rov yuborilgan
        'accepted_by_contragent',     // Contragent tomonidan qabul qilingan
        'delivered_to_punkt',         // Punktga yetkazilgan
        'assigned_to_agent',          // Agentga yuborilgan
        'confirmed_by_agent',         // Agent tomonidan tasdiqlangan (mijozga yetkazilgan)
        'confirmed_by_customer',      // Mijoz tomonidan tasdiqlangan
        'cancelled',                  // Bekor qilingan
      ],
      default: 'pending',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card'],
      required: [true, 'To\'lov usuli kiritilishi shart'],
    },
    deliveryViloyat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Yetkazib berish viloyati kiritilishi shart'],
    },
    deliveryTuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
    },
    deliveryMfy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
    },
    deliveryNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Yetkazib berish eslatmasi 1000 ta belgidan oshmasligi kerak'],
      default: '',
    },
    phoneNumber: {
      type: String,
      required: [true, 'Telefon raqami kiritilishi shart'],
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'To\'g\'ri telefon raqam formatini kiriting'],
    },
    punktRequests: [
      {
        punktId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Punkt',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    confirmedByPunkt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Punkt',
      default: null,
    },
    punktStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'requested'],
      default: 'pending',
    },
    assignedToAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    assignedByPunkt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Punkt',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    confirmedByAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    agentConfirmedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    contragentRequests: [
      {
        contragentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Contragent',
          required: true,
        },
        itemIds: {
          type: [Number],
          required: true,
          default: [],
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected', 'delivered_to_punkt'],
          default: 'pending',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: {
          type: Date,
          default: null,
        },
        deliveredToPunktAt: {
          type: Date,
          default: null,
        },
        // Maxalla kontragentlar uchun yetkazib beruvchiga yuborish
        deliveryProvider: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DeliveryProvider',
          default: null,
        },
        sentToDeliveryProviderAt: {
          type: Date,
          default: null,
        },
      },
    ],
    punktToPunktRequests: [
      {
        fromPunktId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Punkt',
          required: true,
        },
        toPunktId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Punkt',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected', 'delivered'],
          default: 'pending',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: {
          type: Date,
          default: null,
        },
        deliveredAt: {
          type: Date,
          default: null,
        },
      },
    ],
    customerConfirmed: {
      type: Boolean,
      default: false,
    },
    customerConfirmedAt: {
      type: Date,
      default: null,
    },
    currentPunkt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Punkt',
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true, // Ignore fields not in schema
  }
);

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ deliveryViloyat: 1 });
orderSchema.index({ deliveryTuman: 1 });
orderSchema.index({ deliveryMfy: 1 });
orderSchema.index({ confirmedByPunkt: 1 });
orderSchema.index({ punktStatus: 1 });
orderSchema.index({ 'punktRequests.punktId': 1 });
orderSchema.index({ 'punktRequests.status': 1 });
orderSchema.index({ assignedToAgent: 1 });
orderSchema.index({ assignedByPunkt: 1 });
orderSchema.index({ confirmedByAgent: 1 });
orderSchema.index({ deliveredAt: 1 });
orderSchema.index({ 'contragentRequests.contragentId': 1 });
orderSchema.index({ 'contragentRequests.status': 1 });
orderSchema.index({ 'punktToPunktRequests.toPunktId': 1 });
orderSchema.index({ 'punktToPunktRequests.status': 1 });
orderSchema.index({ currentPunkt: 1 });
orderSchema.index({ customerConfirmed: 1 });
orderSchema.index({ orderType: 1 });

// Method to generate order number
orderSchema.statics.generateOrderNumber = async function () {
  // Get the last order
  const lastOrder = await this.findOne().sort({ createdAt: -1 }).select('orderNumber');

  if (!lastOrder || !lastOrder.orderNumber) {
    return '00001';
  }

  const orderNum = lastOrder.orderNumber;

  // Check if it's a simple numeric format (5 digits)
  if (/^\d{5}$/.test(orderNum)) {
    const num = parseInt(orderNum, 10);
    if (num < 99999) {
      return (num + 1).toString().padStart(5, '0');
    } else {
      // If exceeds 99999, start with 00001a
      return '00001a';
    }
  }

  // Check if it has letter suffix (e.g., 00001a, 00001b)
  const match = orderNum.match(/^(\d+)([a-z]*)$/i);
  
  if (match) {
    let numPart = parseInt(match[1], 10);
    let suffix = match[2] || '';
    
    // If no suffix, add 'a'
    if (!suffix) {
      return numPart.toString().padStart(5, '0') + 'a';
    }
    
    // Increment suffix
    const lastChar = suffix[suffix.length - 1].toLowerCase();
    
    if (lastChar === 'z') {
      // If last char is 'z', add another 'a' (e.g., 00001z -> 00001za)
      suffix += 'a';
    } else {
      // Increment last character
      suffix = suffix.slice(0, -1) + String.fromCharCode(lastChar.charCodeAt(0) + 1);
    }
    
    return numPart.toString().padStart(5, '0') + suffix;
  }

  // If format is different, check if it has more digits
  const digitMatch = orderNum.match(/^(\d+)/);
  if (digitMatch) {
    const numPart = parseInt(digitMatch[1], 10);
    const remaining = orderNum.substring(digitMatch[1].length);
    
    // If it's just digits with more than 5 digits, increment
    if (!remaining && numPart < 999999) {
      return (numPart + 1).toString();
    }
    
    // If it has suffix, increment suffix
    if (remaining) {
      const lastChar = remaining[remaining.length - 1].toLowerCase();
      if (lastChar === 'z') {
        return numPart.toString() + remaining + 'a';
      } else {
        return numPart.toString() + remaining.slice(0, -1) + String.fromCharCode(lastChar.charCodeAt(0) + 1);
      }
    }
  }

  // Fallback: start from 00001
  return '00001';
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;



