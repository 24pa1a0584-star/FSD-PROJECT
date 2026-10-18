const mongoose = require('mongoose');

const trainerAssignmentSchema = new mongoose.Schema(
  {
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true,
      index: true,
    },
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
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'TRANSFERRED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: {
      type: String,
      default: 'Assigned for student workout guidance and fitness progression.',
    },
  },
  {
    timestamps: true,
  }
);

trainerAssignmentSchema.index({ trainerId: 1, studentId: 1, status: 1 });

module.exports = mongoose.model('TrainerAssignment', trainerAssignmentSchema);
