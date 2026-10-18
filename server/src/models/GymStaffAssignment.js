const mongoose = require('mongoose');

const gymStaffAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    staffRole: {
      type: String,
      enum: ['MANAGER', 'DESK_STAFF', 'MAINTENANCE_SUPERVISOR', 'FITNESS_INSTRUCTOR'],
      default: 'DESK_STAFF',
    },
    shift: {
      type: String,
      enum: ['MORNING', 'EVENING', 'FULL_DAY', 'ROTATING'],
      default: 'MORNING',
    },
    assignedDate: {
      type: Date,
      default: Date.now,
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

gymStaffAssignmentSchema.index({ userId: 1, gymId: 1 }, { unique: true });

module.exports = mongoose.model('GymStaffAssignment', gymStaffAssignmentSchema);
