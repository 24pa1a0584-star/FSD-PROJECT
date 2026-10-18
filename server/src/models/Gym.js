const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Gym name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Gym code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      enum: ['BOYS_GYM', 'GIRLS_GYM'],
    },
    location: {
      type: String,
      default: 'Vishnu Institute of Technology, Bhimavaram',
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 100,
      min: [10, 'Capacity must be at least 10'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    operatingHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '21:00' },
    },
    contactPhone: {
      type: String,
      default: '+91 8816 251333',
    },
    contactEmail: {
      type: String,
      default: 'gym@vishnu.edu.in',
    },
    description: {
      type: String,
      default: 'State-of-the-art campus fitness facility at VITB.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Gym', gymSchema);
