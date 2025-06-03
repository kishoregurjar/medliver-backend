const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    test_code: {
        type: String,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    sample_required: {
        type: String // e.g. 'Blood', 'Urine', 'Swab'
    },
    preparation: {
        type: String // e.g. 'Fasting for 8 hours'
    },
    deliveryTime: {
        type: String // e.g. '24 hours', 'Same day'
    },
    available: {
        type: Boolean,
        default: true
    },
    available_at_home: {
        type: Boolean,
        default: false
    },
    isPopular: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
