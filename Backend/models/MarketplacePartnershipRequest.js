const mongoose = require('mongoose');

const marketplacePartnershipRequestSchema = new mongoose.Schema(
  {
    marketplaceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceUser',
      required: [true, 'Marketplace foydalanuvchisi kiritilishi shart'],
    },
    companyName: {
      type: String,
      required: [true, 'Kompaniya nomi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Kompaniya nomi kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [200, 'Kompaniya nomi 200 ta belgidan oshmasligi kerak'],
    },
    inn: {
      type: String,
      required: [true, 'INN kiritilishi shart'],
      trim: true,
      match: [/^\d{9}$|^\d{12}$/, 'INN 9 yoki 12 ta raqamdan iborat bo\'lishi kerak'],
    },
    mfo: {
      type: String,
      required: [true, 'MFO kiritilishi shart'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Hisob raqami kiritilishi shart'],
      trim: true,
    },
    viloyat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Viloyat kiritilishi shart'],
    },
    tuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Tuman kiritilishi shart'],
    },
    mfy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'MFY kiritilishi shart'],
    },
    activity: {
      type: String,
      required: [true, 'Faoliyat kiritilishi shart'],
      trim: true,
      maxlength: [500, 'Faoliyat 500 ta belgidan oshmasligi kerak'],
    },
    managerFirstName: {
      type: String,
      required: [true, 'Rahbar ismi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Rahbar ismi kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [50, 'Rahbar ismi 50 ta belgidan oshmasligi kerak'],
    },
    managerLastName: {
      type: String,
      required: [true, 'Rahbar familiyasi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Rahbar familiyasi kamida 2 ta belgidan iborat bo\'lishi kerak'],
      maxlength: [50, 'Rahbar familiyasi 50 ta belgidan oshmasligi kerak'],
    },
    managerPhone: {
      type: String,
      required: [true, 'Rahbar telefon raqami kiritilishi shart'],
      trim: true,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'To\'g\'ri telefon raqam formatini kiriting'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'contacted', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin eslatmasi 1000 ta belgidan oshmasligi kerak'],
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    contactedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
marketplacePartnershipRequestSchema.index({ marketplaceUser: 1 });
marketplacePartnershipRequestSchema.index({ status: 1 });
marketplacePartnershipRequestSchema.index({ createdAt: -1 });
marketplacePartnershipRequestSchema.index({ reviewedBy: 1 });

const MarketplacePartnershipRequest = mongoose.model(
  'MarketplacePartnershipRequest',
  marketplacePartnershipRequestSchema
);

module.exports = MarketplacePartnershipRequest;


