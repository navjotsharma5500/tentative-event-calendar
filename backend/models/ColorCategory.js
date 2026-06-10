const mongoose = require('mongoose');

const colorCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      required: [true, 'Colour is required'],
      trim: true,
      unique: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Colour must be a valid hex value'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    showDescription: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ColorCategory', colorCategorySchema);
