const mongoose = require('mongoose');

const pathologyCenterSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
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
  deviceToken:{
    type: String,
    default: null,
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

}, { timestamps: true });

pathologyCenterSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const PathologyCenter = mongoose.model('PathologyCenter', pathologyCenterSchema);
module.exports = PathologyCenter;
