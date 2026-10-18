const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    specialization: {
      type: [String],
      default: ['Strength & Conditioning', 'Cardiovascular Training'],
    },
    certifications: {
      type: [String],
      default: ['Certified Fitness Coach (NSCA)', 'CPR / First Aid Certified'],
    },
    experienceYears: {
      type: Number,
      default: 3,
    },
    bio: {
      type: String,
      default: 'Dedicated campus fitness trainer specializing in student functional conditioning.',
    },
    maxStudents: {
      type: Number,
      default: 25,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

trainerSchema.index({ gymId: 1, isAvailable: 1 });

module.exports = mongoose.model('Trainer', trainerSchema);
