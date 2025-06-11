const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
  },
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
      "accepted_by_pharmacy",
      "assigned_to_delivery_partner",
      "assigned_to_pharmacy",
      "accepted_by_delivery_partner",
      "need_manual_assignment_to_pharmacy",
      "need_manual_assignment_to_delivery_partner",
      "accepted_by_delivery_partner_and_reached_pharmacy",
      "out_for_pickup",
      "picked_up",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "reached_pharmacy",
      "reached_destination",
      "verified_by_customer"
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
    enum: ["UPI", "CARD", "WALLET", "COD"],
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
  deliveryPartnerQueue: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
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
  pharmacyToCustomerRoute: {
    type: Array,
    default: []
  },
  pharmacyToDeliveryPartnerRoute: {
    type: Array,
    default: []
  },
  paymentDetails: {
    razorpay_payment_id: { type: String },
    amount: { type: Number }, // in paisa
    currency: { type: String, default: 'INR' },
    status: { type: String },
    method: { type: String }, // e.g. card, netbanking, upi
    email: { type: String },
    contact: { type: String },
    vpa: { type: String },
    bank: { type: String },
    wallet: { type: String },
    description: { type: String },
    fee: { type: Number }, // Razorpay fee
    tax: { type: Number }, // GST
    rrn: { type: String }, // for netbanking/card
    upi_transaction_id: { type: String }, // for UPI
  },
  deliveryPartnerOTP: {
    type: String,
    default: null
  },
  customerOTP: {
    type: String,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
