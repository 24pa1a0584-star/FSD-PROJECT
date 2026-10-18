const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    targetMuscle: { type: String, default: 'Full Body' },
    sets: { type: Number, default: 3 },
    reps: { type: String, default: '10-12' },
    durationMin: { type: Number, default: 0 },
    restSeconds: { type: Number, default: 60 },
    instructions: { type: String, default: 'Maintain proper posture and breathing.' },
  },
  { _id: false }
);

const dailyScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    focusArea: { type: String, default: 'Full Body' },
    isRestDay: { type: Boolean, default: false },
    exercises: [exerciseSchema],
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      default: null,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    description: {
      type: String,
      default: 'Personalized weekly training schedule for campus gym fitness.',
    },
    weeklySchedule: [dailyScheduleSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    healthMetrics: {
      heightCm: Number,
      weightKg: Number,
      bmi: Number,
      targetGoal: String,
    },
  },
  {
    timestamps: true,
  }
);

workoutPlanSchema.index({ studentId: 1, isActive: 1 });
workoutPlanSchema.index({ gymId: 1, level: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
