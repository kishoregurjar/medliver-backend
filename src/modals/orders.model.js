const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderType: {
    type: String,
    enum: ["pharmacy", "pathology", "mixed"],
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryPartner",
  },
  items: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
      },
      medicineName: String,
      quantity: Number,
      price: Number,
      prescription: String, // URL if uploaded
    },
  ],
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      long: Number,
    },
  },
  deliveryAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomerAddress"
  },
  pickupAddress: {
    type: String,
    coordinates: {
      lat: Number,
      long: Number
    }
  },
  orderStatus: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "out-for-delivery",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["UPI", "card", "cash", "wallet", "COD"],
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  prescriptionRequired: {
    type: Boolean,
    default: false,
  },
  isTestHomeCollection: {
    type: Boolean,
    default: false,
  },
  pharmacyQueue: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
    }
  ],
  assignedPharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    default: null,
  },
  assignedPharmacyCoordinates: {
    lat: Number,
    long: Number
  },
  pharmacyResponseStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  pharmacyAttempts: [
    {
      pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
      },
      attemptedAt: { type: Date, default: Date.now }
    }
  ],
  deliveryPartnerAttempts: [
    {
      deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner" },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
      },
      attemptedAt: { type: Date, default: Date.now }
    }
  ],

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
