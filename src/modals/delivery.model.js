const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String, // URL or file path
  },
  documents: {
    aadharNumber: String,
    licenseNumber: String,
    idProof: String,
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  availabilityStatus: {
    type: String,
    enum: ["available", "on-delivery", "offline"],
    default: "offline",
  },
  location: {
    lat: { type: Number },
    long: { type: Number },
  },
    pharmacy: {
      lat: { type: Number },
      long: { type: Number },
    },
    delivery: {
      lat: { type: Number },
      long: { type: Number },
    },
    pathology: {
      lat: { type: Number },
      long: { type: Number },
    },
  assignedOrders: [
    {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      status: String,
    },
  ],
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    monthly: [
      {
        month: String,
        amount: Number,
      },
    ],
  },
  rating: {
    type: Number,
    default: 5,
  },
  emergencyContacts: [
    {
      name: String,
      phone: String,
    },
  ],
  sosTriggered: {
    type: Boolean,
    default: false,
  },
 
},{ timestamps: true });

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
