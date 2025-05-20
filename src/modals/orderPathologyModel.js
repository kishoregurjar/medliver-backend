const mongoose = require("mongoose");

const pathologyOrderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    // required: true,
  },
  pathologyCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PathologyCenter",
  },
  selectedTests: [
    {
      testName: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      testType: {
        type: String,
        enum: ['blood', 'urine', 'X-ray', 'ultrasound', 'other'],
        required: true,
      },
      labName: {
        type: String,
        required: true,
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  isHomeCollection: {
    type: Boolean,
    default: false,
  },
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
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryPartner",
    default: null,
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'sample_collected', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'card', 'cash', 'wallet', 'COD'],
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  }
}, { timestamps: true });

module.exports = mongoose.model("PathologyOrder", pathologyOrderSchema);
