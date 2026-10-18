const mongoose = require('mongoose');

const campusGymSettingsSchema = new mongoose.Schema(
  {
    campusName: {
      type: String,
      default: 'Vishnu Institute of Technology, Bhimavaram',
    },
    boysGymOpen: {
      type: Boolean,
      default: true,
    },
    girlsGymOpen: {
      type: Boolean,
      default: true,
    },
    allowSelfRegistration: {
      type: Boolean,
      default: true,
    },
    feeManagementEnabled: {
      type: Boolean,
      default: false, // Default is free for campus students
    },
    qrTokenExpirySeconds: {
      type: Number,
      default: 60, // 60s dynamic QR freshness
      min: 15,
      max: 300,
    },
    defaultMembershipDurationMonths: {
      type: Number,
      default: 6,
    },
    announcementNotice: {
      type: String,
      default: 'Welcome to VISHNUFIT. Please carry your digital college ID & clean gym shoes.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CampusGymSettings', campusGymSettingsSchema);
