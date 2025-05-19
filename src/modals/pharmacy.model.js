const mongoose = require("mongoose");

const pharmacySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    pharmacyName: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      // unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      required: true,
      // unique: true,
    },
    password: {
      type: String,
      // required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    completeAddress: String,
    pharmacyCoordinates: {
      lat: Number,
      long: Number,
    },
    documents: {
      licenseNumber: String,
      gstNumber: String,
      licenseDocument: String, // file URL or path
      verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
    inventory: [
      {
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
        quantity: Number,
        price: Number,
        isPrescriptionRequired: Boolean,
        expiryDate: Date,
      },
    ],
    orders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        status: String,
      },
    ],
    salesAnalytics: {
      totalSales: { type: Number, default: 0 },
      monthlySales: [
        {
          month: String,
          amount: Number,
          orderCount: Number,
        },
      ],
    },
    commissionRate: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable"],
      default: "unavailable",
    },
    deviceToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

pharmacySchema.index({ pharmacyCoordinates1: '2dsphere' });


module.exports = mongoose.model("Pharmacy", pharmacySchema);
