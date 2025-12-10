const mongoose = require('mongoose');

const vacancyViewSchema = new mongoose.Schema(
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

// Indexes - bir nomzod bir vakansiyani bir marta ko'rgani hisoblanadi
vacancyViewSchema.index({ vacancy: 1, applicant: 1 }, { unique: true });
vacancyViewSchema.index({ vacancy: 1 });
vacancyViewSchema.index({ applicant: 1 });
vacancyViewSchema.index({ createdAt: -1 });

const VacancyView = mongoose.model('VacancyView', vacancyViewSchema);

module.exports = VacancyView;






