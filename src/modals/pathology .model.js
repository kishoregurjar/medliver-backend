const mongoose = require('mongoose');

const pathologyCenterSchema = new mongoose.Schema({
  centerName: {
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
  address: {
    type: String,
    required: true,
  },
  labs: [
    {
      labName: {
        type: String,
        required: true,
        trim: true,
      },
      labDescription: {
        type: String,
        required: true,
      },
      availableTests: [
        {
          testName: {
            type: String,
            required: true,
          },
          testDescription: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          preparationInstructions: {
            type: String,
            required: true,
          },
          testType: {
            type: String,
            enum: ['blood', 'urine', 'X-ray', 'ultrasound', 'other'],
            required: true,
          },
        },
      ],
    },
  ],
  bookings: [
    {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
      },
      testName: {
        type: String,
        required: true,
      },
      labName: {
        type: String,
        required: true,
      },
      bookingDate: {
        type: Date,
        required: true,
      },
      sampleCollectionDate: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'collected', 'processing', 'completed', 'cancelled'],
        default: 'pending',
      },
      report: {
        type: String,
        default: null,
      },
      paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending',
      },
      paymentMethod: {
        type: String,
      },
    },
  ],
  sampleCollection: [
    {
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
      },
      customerName: {
        type: String,
        required: true,
      },
      collectionTime: {
        type: Date,
        required: true,
      },
      deliveryAddress: {
        type: String,
        required: true,
      },
      collectionStatus: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'scheduled',
      },
      deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
      },
      customerLocation: {
        lat: { type: Number },
        long: { type: Number },
      },
      deliveryPartnerLocation: {
        lat: { type: Number },
        long: { type: Number },
      },
    },
  ],

},{ timestamps: true });

pathologyCenterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PathologyCenter = mongoose.model('PathologyCenter', pathologyCenterSchema);
module.exports = PathologyCenter;
