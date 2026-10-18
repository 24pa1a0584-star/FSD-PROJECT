const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'BOYS_GYM', 'GIRLS_GYM', 'TRAINERS', 'STUDENTS'],
      default: 'ALL',
      index: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      default: null, // null means campus-wide
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ gymId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
