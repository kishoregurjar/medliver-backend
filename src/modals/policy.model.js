// models/Policy.js
const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['privacy', 'terms'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['customer','pharmacy', 'delivery', 'pathology'],
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Policy', policySchema);
