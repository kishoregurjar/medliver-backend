const { boolean } = require("joi");
const mongoose = require("mongoose");

const pathologyCenterSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    centerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      // unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    deviceToken: {
      type: String,
      default: null,
    },
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable"],
      default: "unavailable",
    },
  availableTests: [
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
    price: { type: Number },
    deliveryTime: {
      type: Date,
      default: Date.now,
    },
    availabilityAtHome: {
      type: Boolean,
      default: false,
    },
  }
],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

pathologyCenterSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const PathologyCenter = mongoose.model(
  "PathologyCenter",
  pathologyCenterSchema
);
module.exports = PathologyCenter;
