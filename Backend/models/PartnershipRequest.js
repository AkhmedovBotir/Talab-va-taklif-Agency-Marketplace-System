const mongoose = require('mongoose');

const partnershipRequestSchema = new mongoose.Schema(
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
    activityType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContragentType',
      required: [true, 'Faoliyat turi kiritilishi shart'],
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
    contactStatus: {
      type: String,
      enum: ['not_contacted', 'contacted', 'in_progress', 'completed'],
      default: 'not_contacted',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin eslatmasi 1000 ta belgidan oshmasligi kerak'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
partnershipRequestSchema.index({ marketplaceUser: 1 });
partnershipRequestSchema.index({ status: 1 });
partnershipRequestSchema.index({ contactStatus: 1 });
partnershipRequestSchema.index({ activityType: 1 });
partnershipRequestSchema.index({ createdAt: -1 });

const PartnershipRequest = mongoose.model('PartnershipRequest', partnershipRequestSchema);

module.exports = PartnershipRequest;




