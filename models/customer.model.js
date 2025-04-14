const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
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
    required: true, // Customer must have an address for delivery
  },
  profilePicture: {
    type: String, // URL to the profile picture (optional)
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
      time: Date, // Time for reminder
      active: {
        type: Boolean,
        default: true, // If the reminder is active or not
      },
    },
  ],
  previousOrders: [
    {
      orderId: String,
      orderDate: Date,
      totalAmount: Number,
      status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
      },
      items: [
        {
          medicineName: String,
          quantity: Number,
          price: Number,
        },
      ],
    },
  ],
  currentOrder: {
    orderId: String,
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'out_for_delivery', 'delivered'],
      default: 'pending',
    },
    deliveryAddress: String,
    paymentMethod: String,
    totalAmount: Number,
    items: [
      {
        medicineName: String,
        quantity: Number,
        price: Number,
      },
    ],
  },
  pathologyBookings: [
    {
      testName: String,
      labName: String,
      bookingDate: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
      },
      report: {
        type: String, // URL or reference to the report
        default: null,
      },
    },
  ],
  medicalHistory: [
    {
      testName: String,
      result: String,
      date: Date,
      doctor: String,
      notes: String,
    },
  ],
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
