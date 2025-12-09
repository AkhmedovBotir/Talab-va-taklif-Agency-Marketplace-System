const mongoose = require('mongoose');

const vacancyBookmarkSchema = new mongoose.Schema(
  {
    vacancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vacancy',
      required: [true, 'Vakansiya ID kiritilishi shart'],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VacancyApplicant',
      required: [true, 'Nomzod ID kiritilishi shart'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes - bir nomzod bir vakansiyani bir marta saqlab olishi mumkin
vacancyBookmarkSchema.index({ vacancy: 1, applicant: 1 }, { unique: true });
vacancyBookmarkSchema.index({ applicant: 1 });
vacancyBookmarkSchema.index({ vacancy: 1 });
vacancyBookmarkSchema.index({ createdAt: -1 });

const VacancyBookmark = mongoose.model('VacancyBookmark', vacancyBookmarkSchema);

module.exports = VacancyBookmark;




