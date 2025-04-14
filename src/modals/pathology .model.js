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
    required: true, // Address is important for setting collection and testing locations
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
            enum: ['blood', 'urine', 'X-ray', 'ultrasound', 'other'], // Categories of tests
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
        required: true, // Scheduled collection date
      },
      status: {
        type: String,
        enum: ['pending', 'collected', 'processing', 'completed', 'cancelled'],
        default: 'pending',
      },
      report: {
        type: String, // Link to the report (URL or reference to storage)
        default: null, // If available after processing
      },
      paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending',
      },
      paymentMethod: {
        type: String, // Can be card, UPI, wallet, etc.
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
        required: true, // Date and time when the sample will be collected
      },
      deliveryAddress: {
        type: String,
        required: true, // Collection address for home service
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

pathologyCenterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PathologyCenter = mongoose.model('PathologyCenter', pathologyCenterSchema);
module.exports = PathologyCenter;
