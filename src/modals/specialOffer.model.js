const mongoose = require('mongoose');

const specialOfferModel = new mongoose.Schema({
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      unique: true
    },
    offerPrice: {
      type: Number,
      required: true
    },
    offerPercentage:{
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number,
      required: true
    },
    validTill: {
      type: String,
      required: true
    },
    isActive:{
      type: Boolean,
      default: true 
    }
  }, { timestamps: true });
  
  module.exports = mongoose.model('SpecialOfferProduct', specialOfferModel);
   