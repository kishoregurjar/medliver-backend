const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema({
  name: {
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
    idProof: String, // URL or file path
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  location: {
    lat: Number,
    lng: Number,
  },
  availabilityStatus: {
    type: String,
    enum: ["available", "on-delivery", "offline"],
    default: "offline",
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
  sosTriggered: {          //for emergency situation he can press. if is true then in admin pannel it should desplay SOS from Ravi Singh (ID: DP104) at 10:45 PM near City Hospital." 
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
