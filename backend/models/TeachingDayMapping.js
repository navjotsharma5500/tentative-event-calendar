const mongoose = require('mongoose');

const teachingDayMappingSchema = new mongoose.Schema(
  {
    nonTeachingDate: {
      type: String,
      required: [true, 'Non-teaching date is required'],
      index: true,
    },
    teachingDates: {
      type: [String],
      required: [true, 'Teaching dates are required'],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'Select at least one teaching date',
      },
    },
  },
  { timestamps: true }
);

teachingDayMappingSchema.index({ nonTeachingDate: 1, createdAt: 1 });

module.exports = mongoose.model('TeachingDayMapping', teachingDayMappingSchema);
