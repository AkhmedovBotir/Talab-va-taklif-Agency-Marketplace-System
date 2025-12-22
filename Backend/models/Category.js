const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Kategoriya nomi kiritilishi shart'],
      trim: true,
      minlength: [2, 'Kategoriya nomi kamida 2 ta belgidan iborat bo\'lishi kerak'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    censored: {
      type: Boolean,
      default: false,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdByModel',
      required: true,
    },
    createdByModel: {
      type: String,
      enum: ['Admin', 'ShopOwner', 'Contragent'],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Subkategoriyalarni olish uchun virtual field
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Slug yaratish (unikal qilish)
categorySchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let count = 1;

    // Unikal slug topilmaguncha raqam qo'sh
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }

  next();
});

// Kategoriya nomini va parent ID sini unique qilish
categorySchema.index({ name: 1, parent: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ status: 1 });
categorySchema.index({ createdBy: 1, createdByModel: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;


