const mongoose = require('mongoose');

const featuredProductModel = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
    unique: true // ensure no duplicate entry
  },
  featuredAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('featuredProduct', featuredProductModel);
