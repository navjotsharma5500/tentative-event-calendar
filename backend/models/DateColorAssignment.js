const mongoose = require('mongoose');

const dateColorAssignmentSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ColorCategory',
      required: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      index: true,
    },
    type: {
      type: String,
      default: 'single',
      enum: ['single'],
    },
  },
  { timestamps: true }
);

dateColorAssignmentSchema.index({ date: 1, createdAt: -1 });

module.exports = mongoose.model('DateColorAssignment', dateColorAssignmentSchema);
