const mongoose = require('mongoose');

const equipmentMaintenanceSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
      index: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issueDescription: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'DECOMMISSIONED'],
      default: 'REPORTED',
      index: true,
    },
    serviceVendor: {
      type: String,
      default: 'Campus Engineering Maintenance Wing',
    },
    cost: {
      type: Number,
      default: 0,
    },
    serviceDate: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

equipmentMaintenanceSchema.index({ gymId: 1, status: 1 });

module.exports = mongoose.model('EquipmentMaintenance', equipmentMaintenanceSchema);
