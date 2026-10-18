const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Equipment code is required'],
      trim: true,
      uppercase: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['CARDIO', 'STRENGTH', 'FREE_WEIGHTS', 'ACCESSORIES'],
      default: 'STRENGTH',
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    condition: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
      default: 'GOOD',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'],
      default: 'AVAILABLE',
      index: true,
    },
    lastMaintenanceDate: {
      type: Date,
      default: Date.now,
    },
    nextMaintenanceDate: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days later
    },
    notes: {
      type: String,
      default: 'Procured for Vishnu Institute of Technology student physical fitness.',
    },
  },
  {
    timestamps: true,
  }
);

// Unique code per gym
equipmentSchema.index({ gymId: 1, code: 1 }, { unique: true });
equipmentSchema.index({ gymId: 1, status: 1, category: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
