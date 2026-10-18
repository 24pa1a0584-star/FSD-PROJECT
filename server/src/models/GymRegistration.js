const mongoose = require('mongoose');

const gymRegistrationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    preferredSlot: {
      type: String,
      enum: ['MORNING (6 AM - 8 AM)', 'EVENING (4 PM - 6 PM)', 'NIGHT (6 PM - 8 PM)', 'FLEXIBLE'],
      default: 'MORNING (6 AM - 8 AM)',
    },
    fitnessGoals: {
      type: String,
      default: 'General Physical Fitness & Strength',
    },
    medicalClearance: {
      type: Boolean,
      default: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
    studentSnapshot: {
      name: String,
      rollNumber: String,
      department: String,
      academicYear: Number,
      studentType: String,
      contactNumber: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying registrations by gym and status
gymRegistrationSchema.index({ gymId: 1, status: 1, applicationDate: -1 });
gymRegistrationSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('GymRegistration', gymRegistrationSchema);
