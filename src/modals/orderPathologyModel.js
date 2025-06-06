const mongoose = require("mongoose");

const pathologyOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
  },
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
  totalAmount: { type: Number },

  isHomeCollection: { type: Boolean, default: false },
  sampleCollectionDateTime: { type: Date },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerAddress", default: null },
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
    enum: ['pending', 'confirmed', 'sample_collected', 'completed', 'cancelled', 'need_manual_assignment_to_pathology', 'accepted_by_pathology'],
    default: 'pending',
  },
  cancellationReason: { type: String },
  reportStatus: {
    type: String,
    enum: ['not_uploaded', 'uploaded', 'in_progress'],
    default: 'not_uploaded'
  },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: "TestReport" },

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
      pathologyId: { type: mongoose.Schema.Types.ObjectId, ref: "PathologyCenter" },
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
