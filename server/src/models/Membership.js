const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
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
    membershipTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipType',
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qrCardId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    renewalHistory: [
      {
        renewedAt: { type: Date, default: Date.now },
        extendedMonths: Number,
        newEndDate: Date,
        renewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for gym-specific membership lookup and active state
membershipSchema.index({ gymId: 1, status: 1 });
membershipSchema.index({ studentId: 1, gymId: 1, status: 1 });
membershipSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
