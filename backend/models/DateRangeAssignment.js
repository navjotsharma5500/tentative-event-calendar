const mongoose = require('mongoose');

const dateRangeAssignmentSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ColorCategory',
      required: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
      index: true,
    },
    type: {
      type: String,
      default: 'range',
      enum: ['range'],
    },
  },
  { timestamps: true }
);

dateRangeAssignmentSchema.index({ startDate: 1, endDate: 1, createdAt: -1 });

module.exports = mongoose.model('DateRangeAssignment', dateRangeAssignmentSchema);
