const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['region', 'district', 'mfy'],
      required: [true, 'Type is required'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      default: null,
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
regionSchema.index({ type: 1, parent: 1 });
regionSchema.index({ code: 1 }, { unique: true });

const Region = mongoose.model('Region', regionSchema);

module.exports = Region;



