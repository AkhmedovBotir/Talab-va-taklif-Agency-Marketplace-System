const mongoose = require('mongoose');

const reviewCommentTemplateSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Shablon matni kiritilishi shart'],
      trim: true,
      maxlength: [200, 'Shablon matni 200 ta belgidan oshmasligi kerak'],
    },
    order: {
      type: Number,
      required: [true, 'Tartib raqami kiritilishi shart'],
      min: [1, 'Tartib raqami kamida 1 bo\'lishi kerak'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index
reviewCommentTemplateSchema.index({ order: 1 }, { unique: true });
reviewCommentTemplateSchema.index({ isActive: 1 });

const ReviewCommentTemplate = mongoose.model('ReviewCommentTemplate', reviewCommentTemplateSchema);

module.exports = ReviewCommentTemplate;





