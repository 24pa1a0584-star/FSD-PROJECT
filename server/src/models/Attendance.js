const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    method: {
      type: String,
      enum: ['MANUAL', 'QR_SCAN'],
      default: 'MANUAL',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'AUTO_CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Unique partial index: Guarantees a student can NEVER have more than one ACTIVE attendance session simultaneously
attendanceSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
// Compound index for facility daily reports and real-time active users
attendanceSchema.index({ gymId: 1, checkInTime: -1, status: 1 });
attendanceSchema.index({ gymId: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
