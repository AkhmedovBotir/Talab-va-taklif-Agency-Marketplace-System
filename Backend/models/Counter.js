const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index
counterSchema.index({ name: 1 }, { unique: true });

// Static method to get and increment counter
counterSchema.statics.getNextValue = async function (counterName) {
  const counter = await this.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  return counter.value;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;

