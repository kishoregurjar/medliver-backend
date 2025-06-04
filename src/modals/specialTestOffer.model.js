const mongoose = require('mongoose');

const specialTestOfferModel = new mongoose.Schema({
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
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
  
  module.exports = mongoose.model('SpecialTestOffer', specialTestOfferModel);
   