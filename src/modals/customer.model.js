const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  otp: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  height: {
    type: String,
    default: null,
  },
  weight: {
    type: String,
    default: null,
  },

  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null,
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'silver', 'gold'],
    default: 'basic',
  },
  medicineReminders: [
    {
      medicineName: String,
      dosage: String,
      time: Date,
      active: {
        type: Boolean,
        default: true,
      },
    },
  ],
  userCoordinates: {
    lat: { type: Number },
    long: { type: Number },
  },
  deviceToken:{
    type: String,
    default: null,
  }

}, { timestamps: true });

customerSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
