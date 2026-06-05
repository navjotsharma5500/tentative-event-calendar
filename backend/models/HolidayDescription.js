const mongoose = require('mongoose');

const holidayDescriptionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

holidayDescriptionSchema.index({ date: 1, createdAt: 1 });

module.exports = mongoose.model('HolidayDescription', holidayDescriptionSchema);
