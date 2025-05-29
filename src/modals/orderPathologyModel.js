const mongoose = require("mongoose");

const pathologyOrderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  pathologyCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PathologyCenter"
  },
  selectedTests: [
    {
      testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test" }, 
    }
  ],
  testType: { type: String, enum: ["single", "package"] },
  totalAmount: { type: Number, required: true },

  isHomeCollection: { type: Boolean, default: false },
  sampleCollectionDateTime: { type: Date },
  homeCollectionAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      long: Number
    }
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'sample_collected', 'completed', 'cancelled','need_manual_assignment_to_pathology'],
    default: 'pending',
  },
  cancellationReason: { type: String },
  reportStatus: {
    type: String,
    enum: ['not_uploaded', 'uploaded', 'in_progress'],
    default: 'not_uploaded'
  },
  reportUrl: { type: String },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ["UPI", "CARD", "WALLET", "COD"],
  },
  pathologyAttempts: [
      {
        deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "PathologyCenter" },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending"
        },
        attemptedAt: { type: Date, default: Date.now }
      }
    ],
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  }
}, { timestamps: true }); 


module.exports = mongoose.model("PathologyOrder", pathologyOrderSchema);
