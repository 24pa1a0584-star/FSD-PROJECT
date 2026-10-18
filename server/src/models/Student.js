const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'College roll number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'AI&DS', 'CSBS'],
      trim: true,
    },
    academicYear: {
      type: Number,
      required: [true, 'Academic year is required (1-4)'],
      min: 1,
      max: 4,
    },
    section: {
      type: String,
      default: 'A',
      uppercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    studentType: {
      type: String,
      enum: ['Hosteller', 'Day Scholar'],
      default: 'Hosteller',
    },
    assignedGym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    membershipStatus: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: 'Parent/Guardian' },
    },
    profilePhoto: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for filtering students within gym by department and year
studentSchema.index({ assignedGym: 1, department: 1, academicYear: 1 });
studentSchema.index({ assignedGym: 1, membershipStatus: 1 });

module.exports = mongoose.model('Student', studentSchema);
