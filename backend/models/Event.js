const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    society: {
      type: String,
      required: [true, 'Society name is required'],
      trim: true,
    },
    event: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    startDate: {
      type: String,
      required: [true, 'Start date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endDate: {
      type: String,
      required: [true, 'End date is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    conflict: {
      type: Boolean,
      default: false,
    },
    conflictWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    ignoreConflict: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

eventSchema.index({ venue: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
