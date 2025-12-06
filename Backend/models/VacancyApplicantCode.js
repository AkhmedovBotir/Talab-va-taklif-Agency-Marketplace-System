const mongoose = require('mongoose');

const vacancyApplicantCodeSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'login', 'forgot_password'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

vacancyApplicantCodeSchema.index({ phone: 1, purpose: 1 });
vacancyApplicantCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VacancyApplicantCode = mongoose.model('VacancyApplicantCode', vacancyApplicantCodeSchema);

module.exports = VacancyApplicantCode;



