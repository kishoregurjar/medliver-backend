const mongoose = require('mongoose');

const bestSellerModel = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
    unique: true
  },
  soldCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCreatedByAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('BestSellerProduct', bestSellerModel);
