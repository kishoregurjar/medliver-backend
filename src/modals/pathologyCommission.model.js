const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  pathologyCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PathologyCenter',
    required: true,
  },
  type: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});
module.exports =  mongoose.model('Commission', commissionSchema);;
