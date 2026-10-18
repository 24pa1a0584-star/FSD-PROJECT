const mongoose = require('mongoose');

const gymScheduleSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday ... 6 = Saturday
      required: true,
      min: 0,
      max: 6,
    },
    dayName: {
      type: String,
      required: true,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    morningSlot: {
      openTime: { type: String, default: '06:00' },
      closeTime: { type: String, default: '09:00' },
      isActive: { type: Boolean, default: true },
    },
    eveningSlot: {
      openTime: { type: String, default: '16:30' },
      closeTime: { type: String, default: '20:30' },
      isActive: { type: Boolean, default: true },
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    specialNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

gymScheduleSchema.index({ gymId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('GymSchedule', gymScheduleSchema);
