// models/CrashLog.js
const mongoose = require('mongoose');

const CrashLogSchema = new mongoose.Schema(
  {
    error: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
    },
    fatal: {
      type: Boolean,
      default: false,
    },
    platform: {
      type: String, // 'android' | 'ios'
      required: true,
    },
    appVersion: {
      type: String,
    },
    userId: {
      type: String,
    },
    applicationType:{
      type: String,
      required: true,
      enum: ["delivery", "user"]
    },
    deviceInfo: {
      type: Object, // Optionally you can include things like device model, OS, etc.
      default: {},
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('CrashLog', CrashLogSchema);
