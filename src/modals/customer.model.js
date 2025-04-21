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
  otp:{
    type:String ,
    default:null
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

  //  Pathology Bookings with location
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
        type: String,
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
  userCoordinates: {
    lat: { type: Number },
    long: { type: Number },
  },

},{timestamps:true});

customerSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
