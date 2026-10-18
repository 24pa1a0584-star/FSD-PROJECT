const mongoose = require('mongoose');

const membershipTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['Monthly', 'Semester', 'Academic Year', 'Special Approved Access'],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    durationMonths: {
      type: Number,
      required: true,
      default: 6,
    },
    feeAmount: {
      type: Number,
      default: 0, // Free by default on campus
    },
    description: {
      type: String,
      default: 'Standard campus fitness membership for enrolled VITB students.',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MembershipType', membershipTypeSchema);
