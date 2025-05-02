const mongoose = require('mongoose');

const medicineClickSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    medicine_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true,
    },
    clicked_at: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('medicineClickHistory', medicineClickSchema);
